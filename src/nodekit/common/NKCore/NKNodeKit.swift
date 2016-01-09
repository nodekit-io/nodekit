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

struct NKGlobals {
    static let NKeventQueue : dispatch_queue_t! = dispatch_queue_create("io.nodekit.eventQueue", nil)
}
var dog5: AnyObject? = nil
var dog7: AnyObject? = nil
var dog6: AnyObject? = nil
var dog8: AnyObject? = nil

public class NKNodeKit: NKScriptContextDelegate {
    
    public init()
    {
        self.context = nil;
      }
    
    var context : NKScriptContext?;
    
    public class func start() {
       #if os(iOS)
            NKMainMobile.start()
        #elseif os(OSX)
            NKMainDesktop.start()
        #endif
    }
    
    public func run() {
       NKJSContextFactory().createContext(["Engine": NKEngineType.WKWebView.rawValue], delegate: self)
    }
      
    
    public func NKScriptEngineLoaded(context: NKScriptContext) -> Void {
        
        self.context = context;
        
        let _nodeKitBundle: NSBundle = NSBundle(forClass: NKNodeKit.self)
        
        let url = _nodeKitBundle.pathForResource("_nk_boot", ofType: "js", inDirectory: "lib")
        
        let bootstrapper = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding);
        //      dog6 = context2.NKinjectJavaScript(NKScriptSource(source: bootstrapper! as String, asFilename:"nk_boot.js"))
        
        dog8 =  context.NKloadPlugin(HelloWorldMobile(), namespace: "io.nodekit", options: ["PluginBridge": NKScriptPluginType.NKScriptPlugin.rawValue])
        dog7 =  context.NKinjectJavaScript(NKScriptSource(source: bootstrapper! as String, asFilename:"io.nodekit/scripting/nk_boot.js"))
        
        let scriptSource = "var init =function(){console.log('FROM JAVA'); io.nodekit.alert('hello world'); console.log('FROM JAVA');}\ninit();";
        dog5 = context.NKinjectJavaScript(NKScriptSource(source: scriptSource, asFilename: "startup.js"))
    }
    
    public func NKApplicationReady(context: NKScriptContext) -> Void {
        
    }
    
}