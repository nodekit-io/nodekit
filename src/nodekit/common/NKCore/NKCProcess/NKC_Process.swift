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

 class NKC_Process: NSObject, NKScriptExport {
    class func attachTo(context: NKScriptContext) {
        context.NKloadPlugin(NKC_Process(), namespace: "io.nodekit.platform.process", options: [String:AnyObject]())
    }

    func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
             let url = NSBundle(forClass: NKC_Process.self).pathForResource("process", ofType: "js", inDirectory: "lib/platform")
            let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
             
            // UNIQUE SCRIPT FOR PROCESS
             return "function loadplugin(){\n" + "this.process = this.process || Object.create(null);\n" + NKC_Process.syncProcessDictionary() + "\n" + appjs! + "\n}\n" + stub + "\n" + "loadplugin();" + "\n"
        default:
            return stub
        }
    }
    
    // PUBLIC FUNCTIONS EXPOSED TO JAVASCRIPT as io.nodekit.process.*

    func nextTick(callBack: NKScriptValue) -> Void {
        dispatch_async(NKScriptChannel.defaultQueue, {() -> Void in
            callBack.callWithArguments([], completionHandler: nil)
        })
    }
    
    func emit(event: String, data: AnyObject) -> Void {
       NKEventEmitter.global.emit(event, data)
    }
    
    // PRIVATE FUNCTIONS USED TO SET PROCESS DICTIONARY
    
    private class func syncProcessDictionary() -> String {
        #if os(iOS)
            let PLATFORM: String = "darwin"
            let DEVICEFAMILY: String = "mobile"
        #elseif os(OSX)
            let PLATFORM: String = "darwin"
            let DEVICEFAMILY: String = "desktop"
        #else
            let PLATFORM: String = "darwin"
            let DEVICEFAMILY: String = "desktop"
        #endif
        
        var process: Dictionary<String, AnyObject> = Dictionary<String, AnyObject>()
        process["platform"] = PLATFORM
        process["devicefamily"] = DEVICEFAMILY
        process["argv"] = ["nodekit"]
        process["execPath"] = NSBundle.mainBundle().resourcePath!
        
        setNodePaths(&process)
        
        var script = ""
        
        for (name, val) in process {
            script += "process['\(name)'] = \(serialize(val));\n"
        }
        
        return script
    }
    
    private class func serialize(obj: AnyObject?) -> String {
       if let s = obj as? String {
            let d = try? NSJSONSerialization.dataWithJSONObject([s], options: NSJSONWritingOptions(rawValue: 0))
            let json = NSString(data: d!, encoding: NSUTF8StringEncoding)!
            return json.substringWithRange(NSMakeRange(1, json.length - 2))
        } else if let a = obj as? [AnyObject] {
            return "[" + a.map(serialize).joinWithSeparator(", ") + "]"
        } else if let d = obj as? [String: AnyObject] {
            return "{" + d.keys.map {"\"\($0)\": \(serialize(d[$0]!))"}.joinWithSeparator(", ") + "}"
        } else if obj === NSNull() {
            return "null"
        } else if obj == nil {
            return "undefined"
        }
        return "'\(obj!.description)'"
    }
    
    private class func setNodePaths(inout process: Dictionary<String, AnyObject>) {
        let fileManager = NSFileManager.defaultManager()
        let mainBundle: NSBundle = NSBundle.mainBundle()
        let _nodeKitBundle: NSBundle = NSBundle(forClass: NKNodeKit.self)
        
        let appPath = (mainBundle.bundlePath as NSString).stringByDeletingLastPathComponent
        
        let resourcePath: String! = mainBundle.resourcePath
        let nodekitPath: String! = _nodeKitBundle.resourcePath
        
        let webPath = (resourcePath as NSString).stringByAppendingPathComponent("/app")
        let appModulePath = (appPath as NSString).stringByAppendingPathComponent("/node_modules")
        
        let externalPackage = (appPath as NSString).stringByAppendingPathComponent("/package.json")
        let embeddedPackage = (webPath as NSString).stringByAppendingPathComponent("/package.json")
        
        var resPaths: String
        
        if (fileManager.fileExistsAtPath(externalPackage)) {
            process["workingDirectory"] = appPath
            
            resPaths = resourcePath.stringByAppendingString(":").stringByAppendingString(appPath).stringByAppendingString(":").stringByAppendingString(appModulePath).stringByAppendingString(":").stringByAppendingString(nodekitPath)
        } else {
            if (!fileManager.fileExistsAtPath(embeddedPackage)) {
                print("Missing package.json in main bundle /Resources/app")
                print(resourcePath)
                return
            }
            process["workingDirectory"] = webPath
            
            resPaths = resourcePath.stringByAppendingString(":").stringByAppendingString(webPath).stringByAppendingString(":").stringByAppendingString(appModulePath).stringByAppendingString(":").stringByAppendingString(nodekitPath)
            
        }
        var env  = NSProcessInfo.processInfo().environment
        env["NODE_PATH"] = resPaths
        process["env"] = env
    }
 }
 
 