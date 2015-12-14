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

import Foundation
import JavaScriptCore

struct NKGlobals {
    static let NKeventQueue : dispatch_queue_t! = dispatch_queue_create("io.nodekit.eventQueue", nil)
}

class NKNodekit {
    
    init()
    {
        self.context = nil;
    }
    
    var context : JSContext?;
    
    func run() {
        
     NKJSContextFactory.createRegularContext( { (context: JSContext!) -> () in
            
            NKJavascriptBridge.attachToContext(context)
            self.context = context;
            let fileManager = NSFileManager.defaultManager()
            let mainBundle : NSBundle = NSBundle.mainBundle()
            
            let appPath = (mainBundle.bundlePath as NSString).stringByDeletingLastPathComponent
            
            let resourcePath:String! = mainBundle.resourcePath
            let webPath = (resourcePath as NSString).stringByAppendingPathComponent("/app")
            
        //    let nodeModulePath = (resourcePath as NSString).stringByAppendingPathComponent("/app/node_modules")
            
            let nodeModulePathWeb = (resourcePath as NSString).stringByAppendingPathComponent("/app-shared")
            let nodeModulePathWeb2 = (resourcePath as NSString).stringByAppendingPathComponent("/app-shared/node_modules")
            
            let appModulePath = (appPath as NSString).stringByAppendingPathComponent("/node_modules")
            
            let externalPackage = (appPath as NSString).stringByAppendingPathComponent("/package.json")
            let embeddedPackage = (webPath as NSString).stringByAppendingPathComponent("/package.json")
            
            var resPaths : NSString
            
            if (fileManager.fileExistsAtPath(externalPackage))
            {
                NKJavascriptBridge.setWorkingDirectory(appPath)
                
                resPaths = resourcePath.stringByAppendingString(":").stringByAppendingString(appPath).stringByAppendingString(":").stringByAppendingString(nodeModulePathWeb).stringByAppendingString(":").stringByAppendingString(nodeModulePathWeb2).stringByAppendingString(":").stringByAppendingString(appModulePath)
            }
            else
            {
                if (!fileManager.fileExistsAtPath(embeddedPackage))
                {
                    print("Missing package.json in main bundle /Resources/app");
                    return;
                }
                NKJavascriptBridge.setWorkingDirectory(webPath)
                
                resPaths = resourcePath.stringByAppendingString(":").stringByAppendingString(webPath).stringByAppendingString(":").stringByAppendingString(nodeModulePathWeb).stringByAppendingString(":").stringByAppendingString(nodeModulePathWeb2).stringByAppendingString(":").stringByAppendingString(appModulePath)
                
            }
        
            NKJavascriptBridge.setNodePaths(resPaths as String)
      
            let url = mainBundle.pathForResource("_nodekit_bootstrapper", ofType: "js", inDirectory: "lib")
            
            let bootstrapper = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding);
        
            let nsurl: NSURL = NSURL(fileURLWithPath: url!)
            context.evaluateScript(bootstrapper! as String, withSourceURL: nsurl)
    })
    }
}