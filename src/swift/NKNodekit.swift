/*
* nodekit.io
*
* Copyright (c) 2014 Domabo. All Rights Reserved.
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

import Cocoa

let NKeventQueue : dispatch_queue_t! = dispatch_queue_create("io.nodekit.eventQueue", nil)

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
            
            var fileManager = NSFileManager.defaultManager()
            var mainBundle : NSBundle = NSBundle.mainBundle()
            
            var appPath = mainBundle.bundlePath.stringByDeletingLastPathComponent
            
            var resourcePath:String! = mainBundle.resourcePath
            var webPath = resourcePath.stringByAppendingPathComponent("/app")
            
            var nodeModulePath = resourcePath.stringByAppendingPathComponent("/app/node_modules")
            
            var nodeModulePathWeb = resourcePath.stringByAppendingPathComponent("/app-shared")
            var nodeModulePathWeb2 = resourcePath.stringByAppendingPathComponent("/app-shared/node_modules")
            
            var appModulePath = appPath.stringByAppendingPathComponent("/node_modules")
            
            var externalPackage = appPath.stringByAppendingPathComponent("/package.json")
            var embeddedPackage = webPath.stringByAppendingPathComponent("/package.json")
            
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
                    println("Missing package.json in main bundle /Resources/app");
                    return;
                }
                NKJavascriptBridge.setWorkingDirectory(webPath)
                
                resPaths = resourcePath.stringByAppendingString(":").stringByAppendingString(webPath).stringByAppendingString(":").stringByAppendingString(nodeModulePathWeb).stringByAppendingString(":").stringByAppendingString(nodeModulePathWeb2).stringByAppendingString(":").stringByAppendingString(appModulePath)
                
            }
        
            NKJavascriptBridge.setNodePaths(resPaths)
      
            var url = mainBundle.pathForResource("_nodekit_bootstrapper", ofType: "js", inDirectory: "lib")
            
            var bootstrapper = NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding, error: nil);
        
            var nsurl: NSURL = NSURL(fileURLWithPath: url!)!
            context.evaluateScript(bootstrapper, withSourceURL: nsurl)
    })
    }
}