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

import Foundation
import JavaScriptCore

var bridgeContext: JSContext? = nil
var stringViewer: NKStringViewer? = nil
var urlNavigator: NKUrlNavigator? = nil

class NKJavascriptBridge: NSObject {
    
    class func attachToContext(context: JSContext) {
        #if os(iOS)
            let PLATFORM: String = "ios";
        #elseif os(OSX)
            let PLATFORM: String = "darwin";
         #else
            let PLATFORM: String = "darwin";
        #endif
        
        bridgeContext = context
        
        var _process: Dictionary<String, AnyObject> = Dictionary<String, AnyObject>()
        _process["platform"] = PLATFORM
        _process["argv"] = ["nodekit"]
        _process["env"] = NSProcessInfo.processInfo().environment
        _process["execPath"] = NSBundle.mainBundle().resourcePath!
        
        let process: JSValue = JSValue(object: _process, inContext: context)
        
        context.exceptionHandler = {(ctx: JSContext!, e: JSValue!) -> Void in
           NSLog("Context exception thrown: %@; sourceURL: %@, stack: %@", e, e.valueForProperty("sourceURL"), e.valueForProperty("stack"))
        }
        
        context.setObject(process, forKeyedSubscript: "process")
        
        let console_log: @convention(block)  (String) -> Void = { msg in
           NSLog("%@", msg)
        }
        
        console.setObject(unsafeBitCast(console_log, AnyObject.self), forKeyedSubscript: "log")

        
        let console_nextTick: @convention(block)  (JSValue) -> Void = { callBack in
            dispatch_async(dispatch_get_main_queue(), {() -> Void in
                callBack.callWithArguments([])
            })

        }
        
        console.setObject(unsafeBitCast(console_nextTick, AnyObject.self), forKeyedSubscript: "nextTick")
        
    //    let console_timer: @convention(block)  () -> JSValue! = {
     //       let timer: NKC_Timer = NKC_Timer()
     //       return timer.Timer()
      //  }
        
    //    console.setObject(unsafeBitCast(console_timer, AnyObject.self), forKeyedSubscript: "timer")
        
    
        
        let console_setTimeout: @convention(block)  (Int64, JSValue) -> Void = { delayInSeconds, callBack in
        
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, delayInSeconds * Int64(NSEC_PER_SEC) ), dispatch_get_main_queue(), {() -> Void in
                callBack.callWithArguments([])
            })
            
        }
        
        console.setObject(unsafeBitCast(console_setTimeout, AnyObject.self), forKeyedSubscript: "setTimeout")

        let console_loadString: @convention(block)  (String, String) -> Void = { html, title in
            dispatch_async(dispatch_get_main_queue(), {() -> Void in
                NKJavascriptBridge.showString(html, Title: title)
            })
        }
        
        console.setObject(unsafeBitCast(console_loadString, AnyObject.self), forKeyedSubscript: "loadString")
        
        let console_navigateTo: @convention(block)  (String, String) -> Void = { url, title in
            dispatch_async(dispatch_get_main_queue(), {() -> Void in
                NKJavascriptBridge.navigateTo(url, Title: title)
            })
        }
        
        console.setObject(unsafeBitCast(console_navigateTo, AnyObject.self), forKeyedSubscript: "navigateTo")
        
        let console_resize: @convention(block)  (NSNumber, NSNumber) -> Void = { width, height in
      
        }
        
        console.setObject(unsafeBitCast(console_resize, AnyObject.self), forKeyedSubscript: "resize")
        
        
        
    }
    
    class func registerStringViewer(callBack: NKStringViewer) {
        stringViewer = callBack
    }
    
    class func registerNavigator(callBack: NKUrlNavigator) {
        urlNavigator = callBack
    }
    
    class func showString(message: String, Title title: String) {
        stringViewer!(msg: message, title: title)
    }
    
    class func navigateTo(uri: String, Title title: String) {
        urlNavigator!(uri: uri, title: title)
    }
    
    class func createHttpContext() -> JSValue {
        return bridgeContext!.evaluateScript("io.nodekit.createEmptyContext();")
    }
    
    class func currentContext() -> JSContext {
        return bridgeContext!
    }
    
    class func setJavascriptClosure(httpContext: JSValue, key: String, callBack: NKClosure) {
        
        let key_block: @convention(block)  () -> Void = {
           callBack()
        }
        
         httpContext.setObject(unsafeBitCast(key_block, AnyObject.self), forKeyedSubscript: key)
    }
    
    class func setWorkingDirectory(directory: String) {
        let jsProcess: JSValue = bridgeContext!.objectForKeyedSubscript("process")
        jsProcess.setObject(directory, forKeyedSubscript: "workingDirectory")
    }
    
    class func setNodePaths(directory: String) {
        let jsEnv: JSValue = bridgeContext!.objectForKeyedSubscript("process").objectForKeyedSubscript("env")
        jsEnv.setObject(directory, forKeyedSubscript: "NODE_PATH")
    }
    
    class func cancelHttpContext(httpContext: JSValue) {
        let jsCancelContext: JSValue = bridgeContext!.objectForKeyedSubscript("io").objectForKeyedSubscript("nodekit").objectForKeyedSubscript("cancelContext")
        
        jsCancelContext.callWithArguments([httpContext])
    }
    
    class func invokeHttpContext(httpContext: JSValue, callBack: NKClosure) {
        let jsInvokeContext: JSValue = bridgeContext!.objectForKeyedSubscript("io").objectForKeyedSubscript("nodekit").objectForKeyedSubscript("invokeContext")
        
        let done: @convention(block)  () -> Void = {
            callBack()
        }
        
        jsInvokeContext.callWithArguments([httpContext, unsafeBitCast(done, AnyObject.self)])
    }
}

