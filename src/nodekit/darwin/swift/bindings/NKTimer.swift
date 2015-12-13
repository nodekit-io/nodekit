 /*
* nodekit.io
*
* Copyright (c) 2015 Domabo. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

 
 public class NKTimer : NSObject {
    
    /* NKTimer
    * Creates _timer JSValue
    *
    * _timer.onTimout returns handler
    * _timer.setOnTimeout(handler)
    * _timer.close
    * _timer.start(delay, repeat)
    * _timer.stop
     */
    
    private var _timer : JSValue?
    private var _handler : JSValue?
    private var _nsTimer : NSTimer?
    private var _repeatPeriod : NSNumber!
    
    public override init()
    {
        
        self._timer  = NKJavascriptBridge.createTimer()
        self._repeatPeriod = 0;
        
        super.init()
        
        self._timer!.setObject(unsafeBitCast(self.block_onTimout, AnyObject.self), forKeyedSubscript:"onTimout")
        self._timer!.setObject(unsafeBitCast(self.block_setOnTimeout, AnyObject.self), forKeyedSubscript:"setOnTimeout")
        self._timer!.setObject(unsafeBitCast(self.block_stop, AnyObject.self), forKeyedSubscript:"close")
        self._timer!.setObject(unsafeBitCast(self.block_start, AnyObject.self), forKeyedSubscript:"start")
        self._timer!.setObject(unsafeBitCast(self.block_stop, AnyObject.self), forKeyedSubscript:"stop")
        
    }
    
    public func Timer() -> JSValue!
    {
        return self._timer!
    }
    
    
    lazy var block_onTimout : @convention(block) () -> JSValue! = {
        () -> JSValue! in
        
        return self._handler!
    
    }
    
    lazy var block_setOnTimeout : @convention(block) (JSValue!) -> Void = {
        (handler: JSValue!) -> Void in
        self._handler = handler
    
    }
    
    lazy var block_stop : @convention(block) () -> Void = {
        () -> Void in
        
        self._nsTimer!.invalidate();
        self._nsTimer = nil;
        
    }
    
    lazy var block_close : @convention(block) () -> Void = {
        () -> Void in
        self._nsTimer!.invalidate();
        self._nsTimer = nil;
        self._handler = nil;
        
        self._timer!.setObject(nil, forKeyedSubscript:"onTimout")
        self._timer!.setObject(nil, forKeyedSubscript:"setOnTimeout")
        self._timer!.setObject(nil, forKeyedSubscript:"close")
        self._timer!.setObject(nil, forKeyedSubscript:"start")
        self._timer!.setObject(nil, forKeyedSubscript:"stop")
        
        self._timer = nil;
        
    }
    

    lazy var block_start : @convention(block) (NSNumber!, NSNumber!) -> Void = {
        (delay: NSNumber!, `repeat`: NSNumber!) -> Void in
        
        if (self._nsTimer != nil)
        {
        self.block_stop()
        }
        
        self._repeatPeriod = `repeat`
        
        var secondsToDelay : NSTimeInterval = delay.doubleValue / 1000
        self.scheduleTimeout(secondsToDelay)

    }
    
    private func scheduleTimeout(timeout: NSTimeInterval)
    {
        self._nsTimer = NSTimer(timeInterval: timeout, target: self, selector: "timeOutHandler", userInfo: nil, repeats: false)
        self._nsTimer!.tolerance = min(0.001, timeout / 10)
        NSRunLoop.mainRunLoop().addTimer(self._nsTimer!, forMode: NSRunLoopCommonModes)
    }
    
    @objc func timeOutHandler() {
        dispatch_sync(NKGlobals.NKeventQueue, {
            self._handler?.callWithArguments([])
            let seconds: NSTimeInterval = self._repeatPeriod.doubleValue / 1000
            if (seconds>0) {
                self.scheduleTimeout(seconds)
            }
            
        })
    }
}
