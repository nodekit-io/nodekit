 /*
* nodekit.io
*
* Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
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
 
class NKC_Timer : NSObject, NKScriptExport {
    
    class func attachTo(context: NKScriptContext) {
        context.NKloadPlugin(NKC_Timer.self, namespace: "io.nodekit.Timer", options: [String:AnyObject]());
    }
    
    class func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
            let url = NSBundle(forClass: NKC_Timer.self).pathForResource("timer", ofType: "js", inDirectory: "lib/platform")
            let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
            return "function loadplugin(){\n" + appjs! + "\n}\n" + stub + "\n" + "loadplugin();" + "\n"
        default:
            return stub;
        }
    }
    
    class func scriptNameForSelector(selector: Selector) -> String? {
        log(selector.description)
        return selector == Selector("init") ? "" : nil
    }
    
    
    /* NKTimer
    * Creates _timer JSValue
    *
    * _timer.onTimout returns handler
    * _timer.setOnTimeout(handler)
    * _timer.close
    * _timer.start(delay, repeat)
    * _timer.stop
     */
    
    private var _handler : NKScriptValue?
    private var _nsTimer : NSTimer?
    private var _repeatPeriod : NSNumber!
    
    override init()
    {
        self._repeatPeriod = 0;
        super.init()
    }
    
    func onTimeout() -> NKScriptValue! {
        return self._handler!
    }
    
    func setOnTimeout(handler: NKScriptValue!) -> Void {
        self._handler = handler
    
    }
    
    func stop() -> Void {
        self._nsTimer!.invalidate();
        self._nsTimer = nil;
        
    }
    
    func close() -> Void {
        self._nsTimer!.invalidate();
        self._nsTimer = nil;
        self._handler = nil;
    }
    

    func start(delay: NSNumber!, `repeat`: NSNumber!) -> Void  {
        if (self._nsTimer != nil)
        {
        self.stop()
        }
        
        self._repeatPeriod = `repeat`
        
        let secondsToDelay : NSTimeInterval = delay.doubleValue / 1000
        self.scheduleTimeout(secondsToDelay)
    }
    
    private func scheduleTimeout(timeout: NSTimeInterval)
    {
        self._nsTimer = NSTimer(timeInterval: timeout, target: self, selector: "_timeOutHandler", userInfo: nil, repeats: false)
        self._nsTimer!.tolerance = min(0.001, timeout / 10)
        NSRunLoop.mainRunLoop().addTimer(self._nsTimer!, forMode: NSRunLoopCommonModes)
    }
    
    @objc func _timeOutHandler() {
        _ = try? self._handler?.callWithArguments([])
        let seconds: NSTimeInterval = self._repeatPeriod.doubleValue / 1000
        if (seconds>0) {
            self.scheduleTimeout(seconds)
        }
        
    }
}
