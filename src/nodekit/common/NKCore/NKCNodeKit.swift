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
import WebKit

//struct NKGlobals {
//    static let NKeventQueue : dispatch_queue_t! = dispatch_queue_create("io.nodekit.eventQueue", nil)
//}

public class NKNodeKit: NKScriptContextDelegate {
    
    public init()
    {
        self.context = nil;
      }
    
    var context : NKScriptContext?;
    var scriptContextDelegate: NKScriptContextDelegate?;
    
    public class func start() {
       #if os(iOS)
            NKMainMobile.start()
        #elseif os(OSX)
            NKMainDesktop.start()
        #endif
    }
    
    public func run(delegate: NKScriptContextDelegate? = nil) {
        self.scriptContextDelegate = delegate;
       NKScriptContextFactory().createContext(["Engine": NKEngineType.JavaScriptCore.rawValue], delegate: self)
    }
    
    public func NKScriptEngineLoaded(context: NKScriptContext) -> Void {
        
        self.context = context;
        
        // INSTALL JAVASCRIPT ENVIRONMENT ON MAIN CONTEXT
        NKC_BootCore.bootTo(context)
        NKE_BootElectroMain.bootTo(context)
        
        let script1 =  context.NKloadPlugin(HelloWorldTest(), namespace: "io.nodekit.test", options: ["PluginBridge": NKScriptExportType.NKScriptExport.rawValue])
        objc_setAssociatedObject(context, unsafeAddressOf(HelloWorldTest), script1, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN)
        
        let script2Source = "var p = new io.nodekit.BrowserWindow();\n var result = io.nodekit.test.alertSync('hello'); \nio.nodekit.test.logconsole('hello' + result);\n p.webContents.send('hello world')\n";
        let script2 = context.NKinjectJavaScript(NKScriptSource(source: script2Source, asFilename: "startup.js"))
        objc_setAssociatedObject(context, unsafeAddressOf(HelloWorldTest), script2, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN)
        
        self.scriptContextDelegate?.NKScriptEngineLoaded(context);
    
        let seconds = 5.0
        let delay = seconds * Double(NSEC_PER_SEC)  // nanoseconds per seconds
        let dispatchTime = dispatch_time(DISPATCH_TIME_NOW, Int64(delay))
        
        dispatch_after(dispatchTime, dispatch_get_main_queue(), {
             NKSignalEmitter.global.trigger("io.nodekit.HelloWorld", "OK")
        })
    }
    
    public func NKApplicationReady(id: Int, context: NKScriptContext?) -> Void {
        let seconds = 0.0
        let delay = seconds * Double(NSEC_PER_SEC)  // nanoseconds per seconds
        let dispatchTime = dispatch_time(DISPATCH_TIME_NOW, Int64(delay))
        
        dispatch_after(dispatchTime, dispatch_get_main_queue(), {
            
           self.scriptContextDelegate?.NKApplicationReady(id, context: context);
            NKEventEmitter.global.emit("nk.ApplicationReady", ())
        })
        
        /*
NKJavascriptBridge.attachToContext(context)
self.context = context;
let url = _nodeKitBundle.pathForResource("_nodekit_bootstrapper", ofType: "js", inDirectory: "lib")

let bootstrapper = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding);

let nsurl: NSURL = NSURL(fileURLWithPath: url!)
context.evaluateScript(bootstrapper! as String, withSourceURL: nsurl)
*/
    }

}