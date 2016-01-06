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

public class NKNodeKit {
    
    public init()
    {
        self.context = nil;
        self.context2 = nil;
        self.webview = nil;
    }
    
    var context : JSContext?;
    var context2 : NKScriptContext?;
    var webview: NKScriptContext?;
    
    public class func start() {
       #if os(iOS)
            NKMainMobile.start()
        #elseif os(OSX)
            NKMainDesktop.start()
        #endif
    }
    
    public func run() {
        
        NKJSContextFactory.createWKWebKitContext( { (webview: NKScriptContext!) -> () in
            
            self.webview = webview;
 
            let _nodeKitBundle: NSBundle = NSBundle(forClass: NKNodeKit.self)
            
            let url = _nodeKitBundle.pathForResource("_nk_boot", ofType: "js", inDirectory: "lib")
            
            let bootstrapper = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding);
            
      //      let nsurl: NSURL = NSURL(fileURLWithPath: url!)
            webview.evaluateJavaScript(bootstrapper! as String, completionHandler: nil)
            
            webview.evaluateJavaScript("console.log('NKWebView JS Call!')", completionHandler: { (address: AnyObject?, error: NSError?) -> Void in
                print("callback");
                print(address);
                print(error);
            })
            
     
            
        });
        
     /*  NKJSContextFactory.createJavaScriptCoreContext( { (context2: NKScriptContext!) -> () in
            
            self.context2 = context2;
            
            let _nodeKitBundle: NSBundle = NSBundle(forClass: NKNodeKit.self)
            
            let url = _nodeKitBundle.pathForResource("_nk_boot", ofType: "js", inDirectory: "lib")
            
            let bootstrapper = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding);
            
            //      let nsurl: NSURL = NSURL(fileURLWithPath: url!)
            context2.evaluateJavaScript(bootstrapper! as String, completionHandler: nil)
            
            context2.evaluateJavaScript("console.log('NKJavaScriptCore JS Call!')", completionHandler: { (address: AnyObject?, error: NSError?) -> Void in
                print("callback");
                print(address);
                print(error);
            })
        });
*/
        
     NKJSContextFactory.createRegularContext( { (context: JSContext!) -> () in
            
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
    })
    }
}