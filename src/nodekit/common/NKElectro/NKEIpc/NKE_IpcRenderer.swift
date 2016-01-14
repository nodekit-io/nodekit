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

@objc class NKE_IpcRenderer: NSObject, NKE_IpcRendererProtocol {
    
    internal weak var _window: NKE_BrowserWindow? = nil
    internal var _id : Int = 0
    internal var _type : String = ""
   
    override init() {
        super.init()
    }
    
    required init(id: Int) {
        super.init()
        
        _id = id;
        guard let window = NKE_BrowserWindow.fromId(_id) else {return;}
        _window = window as? NKE_BrowserWindow;
        
        
        // Event:  'did-fail-load'
        // Event:  'did-finish-load'
        
        _window?._events.on("did-finish-load") { (id: Int) in
            self.NKscriptObject?.callMethod("emit", withArguments: ["did-finish-load"], completionHandler: nil)
        }
        
        _window?._events.on("did-fail-loading") { (error: String) in
            self.NKscriptObject?.callMethod("emit", withArguments: ["did-fail-loading", error], completionHandler: nil)
        }
    }
    
    func send(channel: String, arg: [AnyObject]) -> Void {

        let event: Dictionary<String, AnyObject?>  = ["returnValue": nil, "sender": nil ]
     //   events.emit("nk.ipcMain", (channel, event, arg));
    }
    
    func sendAsync(channel: String, arg: [AnyObject], callback: NKScriptObject) -> Void {
        let event: Dictionary<String, AnyObject?>  = ["sender": nil, "callback": callback ]
     //   events.emit("nk.ipcMain", (channel, event, arg));
    }
    
    func sendSync(channel: String, arg: [AnyObject]) -> AnyObject {
        return ""
    }
    
    func sendToHost(channel: String, arg: [AnyObject]) -> Void {
        
    }
}

extension NKE_IpcRenderer: NKScriptPlugin {
    
    static func attachTo(context: NKScriptContext) {
        let principal = NKE_IpcRenderer()
        context.NKloadPlugin(principal, namespace: "io.nodekit.ipcRenderer", options: [String:AnyObject]());
    }
    
    func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
            let url = NSBundle(forClass: NKEApp.self).pathForResource("ipc-renderer", ofType: "js", inDirectory: "lib-electro")
            let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
            return "function loadplugin(){\n" + appjs! + "\n}\n" + stub + "\n" + "loadplugin();" + "\n"
        default:
            return stub;
        }
    }
    
    class func scriptNameForSelector(selector: Selector) -> String? {
        return selector == Selector("initWithOptions:") ? "" : nil
    }
    

}
