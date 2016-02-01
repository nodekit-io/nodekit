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

private class NKC_BootCoreBootStrap : NSObject {}

class NKC_BootCore: NSObject {

    class func addCorePlatform(context: NKScriptContext) {
        // PROCESS SHOULD BE FIRST CORE PLATFORM PLUGIN
        NKC_Process.attachTo(context)
        
        // LOAD REMAINING CORE PLATFORM PLUGINS
        NKC_FileSystem.attachTo(context)
        NKC_Console.attachTo(context)
        NKC_Crypto.attachTo(context)
        NKC_SocketTCP.attachTo(context)
        NKC_SocketUDP.attachTo(context)
        NKC_Timer.attachTo(context)
        
    }
    
    class func bootCore(context: NKScriptContext) {
        // INJECT NODE BOOTSTRAP
        let url = NSBundle(forClass: NKNodeKit.self).pathForResource("_nodekit_bootstrapper", ofType: "js", inDirectory: "lib")
        let script = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
        context.NKinjectJavaScript(NKScriptSource(source: script!, asFilename: "io.nodekit.core/lib/_nodekit_bootstrapper.js", namespace: "io.nodekit.bootstrapper"))
        
    }
}
