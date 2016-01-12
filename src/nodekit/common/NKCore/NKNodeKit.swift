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
       NKJSContextFactory().createContext(["Engine": NKEngineType.JavaScriptCore.rawValue], delegate: self)
    }
    
    var browserPlugin: AnyObject?;
    var appPlugin: AnyObject?;
    
    
    public func NKScriptEngineLoaded(context: NKScriptContext) -> Void {
        
        self.context = context;
        
        let _nodeKitBundle: NSBundle = NSBundle(forClass: NKNodeKit.self)
        
        let url = _nodeKitBundle.pathForResource("_nk_boot", ofType: "js", inDirectory: "lib")
        
       browserPlugin = context.NKloadPlugin(NKEBrowserWindow(), namespace: "io.nodekit.browserWindow", options: ["PluginBridge": NKScriptPluginType.NKScriptPlugin.rawValue]);
        
       appPlugin = context.NKloadPlugin(NKEApp(), namespace: "io.nodekit.app", options: ["PluginBridge": NKScriptPluginType.NKScriptPlugin.rawValue]);
        
        
        let bootstrapper = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding);
         dog8 =  context.NKloadPlugin(HelloWorldTest(), namespace: "io.nodekit.console", options: ["PluginBridge": NKScriptPluginType.NKScriptPlugin.rawValue])
        dog7 =  context.NKinjectJavaScript(NKScriptSource(source: bootstrapper! as String, asFilename:"io.nodekit/scripting/nk_boot.js"))
        let scriptSource = "var init =function(){console.log('FROM JAVA'); \n //io.nodekit.console.alert('hello world'); \n var p = (new io.nodekit.browserWindow({'nk.browserType': 'WKWebView'})) \n ; console.log('FROM JAVA');}\ninit();";
        dog5 = context.NKinjectJavaScript(NKScriptSource(source: scriptSource, asFilename: "startup.js"))
        self.scriptContextDelegate?.NKScriptEngineLoaded(context);
        
       }
    
    public func NKApplicationReady(id: Int, context: NKScriptContext?) -> Void {
        let seconds = 1.5
        let delay = seconds * Double(NSEC_PER_SEC)  // nanoseconds per seconds
        let dispatchTime = dispatch_time(DISPATCH_TIME_NOW, Int64(delay))
        
        dispatch_after(dispatchTime, dispatch_get_main_queue(), {
            
           self.scriptContextDelegate?.NKApplicationReady(id, context: context);
            NKEventEmitter.global.emit("nk.ApplicationReady", ())
        })
        
        /*
NKJavascriptBridge.attachToContext(context)
self.context = context;
let fileManager = NSFileManager.defaultManager()
let mainBundle : NSBundle = NSBundle.mainBundle()
let _nodeKitBundle: NSBundle = NSBundle(forClass: NKNodeKit.self)

let appPath = (mainBundle.bundlePath as NSString).stringByDeletingLastPathComponent

let resourcePath:String! = mainBundle.resourcePath
let nodekitPath:String! = _nodeKitBundle.resourcePath

let webPath = (resourcePath as NSString).stringByAppendingPathComponent("/app")

//    let nodeModulePath = (resourcePath as NSString).stringByAppendingPathComponent("/app/node_modules")

let appModulePath = (appPath as NSString).stringByAppendingPathComponent("/node_modules")

let externalPackage = (appPath as NSString).stringByAppendingPathComponent("/package.json")
let embeddedPackage = (webPath as NSString).stringByAppendingPathComponent("/package.json")

var resPaths : NSString

if (fileManager.fileExistsAtPath(externalPackage))
{
NKJavascriptBridge.setWorkingDirectory(appPath)

resPaths = resourcePath.stringByAppendingString(":").stringByAppendingString(appPath).stringByAppendingString(":").stringByAppendingString(appModulePath).stringByAppendingString(":").stringByAppendingString(nodekitPath)
}
else
{
if (!fileManager.fileExistsAtPath(embeddedPackage))
{
print("Missing package.json in main bundle /Resources/app");
print(resourcePath);
return;
}
NKJavascriptBridge.setWorkingDirectory(webPath)

resPaths = resourcePath.stringByAppendingString(":").stringByAppendingString(webPath).stringByAppendingString(":").stringByAppendingString(appModulePath).stringByAppendingString(":").stringByAppendingString(nodekitPath)

}

NKJavascriptBridge.setNodePaths(resPaths as String)

let url = _nodeKitBundle.pathForResource("_nodekit_bootstrapper", ofType: "js", inDirectory: "lib")

let bootstrapper = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding);

let nsurl: NSURL = NSURL(fileURLWithPath: url!)
context.evaluateScript(bootstrapper! as String, withSourceURL: nsurl)
*/
    }

}