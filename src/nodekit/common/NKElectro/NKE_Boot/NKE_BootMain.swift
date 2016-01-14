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

class NKE_BootMain: NSObject {
    
    static func bootTo(context: NKScriptContext) {
        let url = NSBundle(forClass: NKEApp.self).pathForResource("_nke_main", ofType: "js", inDirectory: "lib-electro")
        let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
        let script = "function loadbootstrap(){\n" + appjs! + "\n}\n" + "loadbootstrap();" + "\n"
        let item = context.NKinjectJavaScript(NKScriptSource(source: script, asFilename: "io.nodekit.scripting/plugins/_nke_main.js", namespace: "io.nodekit.electro"))
        
        objc_setAssociatedObject(context, unsafeAddressOf(NKE_BootMain), item, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN)
        
        NKEApp.attachTo(context);
        NKE_BrowserWindow.attachTo(context);
        NKE_WebContentsBase.attachTo(context);
        
        context.NKloadPlugin(NKEDialog(), namespace: "io.nodekit.dialog", options: ["MainThread": true, "PluginBridge": NKScriptPluginType.NKScriptPlugin.rawValue]);
        
        //   menuPlugin = context.NKloadPlugin(NKEMenu(), namespace: "io.nodekit.menu", options: ["PluginBridge": NKScriptPluginType.NKScriptPlugin.rawValue]);
        
        //   menuItemPlugin = context.NKloadPlugin(NKEMenuItem(), namespace: "io.nodekit.menuItem", options: ["PluginBridge": NKScriptPluginType.NKScriptPlugin.rawValue]);
        
        
    }
    
}