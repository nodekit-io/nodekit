/*
* nodekit.io
*
* Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
* Portions Copyright (c) 2013 GitHub, Inc. under MIT License
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

class NKC_BootCore: NSObject {

    class func bootTo(context: NKScriptContext) {

        let url = NSBundle(forClass: NKC_BootCore.self).pathForResource("_core", ofType: "js", inDirectory: "lib/platform")
        let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
        let processScript: String = syncProcessDictionary(context)
        let script = "this.process = this.process || {};\n(function _core(process){\n" + appjs! + "\n" + processScript + "\n})(this.process);\n"

        let item = context.NKinjectJavaScript(NKScriptSource(source: script, asFilename: "io.nodekit.core/lib/platform/_core.js", namespace: "io.nodekit.core"))
        objc_setAssociatedObject(context, unsafeAddressOf(NKC_BootCore), item, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN)

       addPlugins(context)

    }

    private class func addPlugins(context: NKScriptContext) {
        NKC_FileSystem.attachTo(context)
        NKC_Console.attachTo(context)
        NKC_Crypto.attachTo(context)
        NKC_SocketTCP.attachTo(context)
        NKC_SocketUDP.attachTo(context)
        NKC_Timer.attachTo(context)
    }

    private class func syncProcessDictionary(context: NKScriptContext) -> String {
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
               script += "process['\(name)'] = \(context.NKserialize(val));\n"
        }

        return script
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
