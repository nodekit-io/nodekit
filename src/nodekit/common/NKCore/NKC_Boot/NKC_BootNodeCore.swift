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

class NKC_BootNodeCore: NSObject {
    
    static func bootTo(context: NKScriptContext) {
     /*   let url = NSBundle(forClass: NKC_BootNodeCore).pathForResource("_nk_boot", ofType: "js", inDirectory: "lib")
        let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
        let script = "function loadnodekit(){\n" + appjs! + "\n}\n" + "loadnodekit();" + "\n"
        let item = context.NKinjectJavaScript(NKScriptSource(source: script, asFilename: "io.nodekit.scripting/plugins/_nk_boot.js", namespace: "io.nodekit.core"))
        objc_setAssociatedObject(context, unsafeAddressOf(NKC_BootNodeCore), item, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN)  */
        
        NKC_Crypto.attachTo(context);
        NKC_SocketTCP.attachTo(context);
        NKC_SocketUDP.attachTo(context);
        NKC_Timer.attachTo(context);
    }
    
}