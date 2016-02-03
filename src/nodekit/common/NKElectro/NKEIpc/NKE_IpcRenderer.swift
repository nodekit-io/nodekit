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

class NKE_IpcRenderer: NSObject, NKE_IpcProtocol {

    internal weak var _window: NKE_BrowserWindow? = nil
    internal var _id: Int = 0
    private var globalEvents: NKEventEmitter = NKEventEmitter.global

    override init() {
        super.init()
    }

    required init(id: Int) {
        super.init()

        _id = id
        guard let window = NKE_BrowserWindow.fromId(_id) as? NKE_BrowserWindow else {return;}
        _window = window

         window._events.on("nk.IPCtoRenderer") { (item: NKE_IPC_Event) -> Void in
            self.NKscriptObject?.invokeMethod("emit", withArguments: ["nk.IPCtoRenderer", item.sender, item.channel, item.replyId, item.arg], completionHandler: nil)
        }

         window._events.on("nk.IPCReplytoRenderer") { (item: NKE_IPC_Event) -> Void in
            self.NKscriptObject?.invokeMethod("emit", withArguments: ["nk.IPCReplytoRenderer", item.sender, item.channel, item.replyId, item.arg[0]], completionHandler: nil)
        }
    }

    // Messages to main are sent to the global events queue
    func ipcSend(channel: String, replyId: String, arg: [AnyObject]) -> Void {
        let payload = NKE_IPC_Event(sender: _id, channel: channel, replyId: replyId, arg: arg)
        globalEvents.emit("nk.IPCtoMain", payload)
    }

    // Replies to main are sent directly to the webContents window that sent the original message
    func ipcReply(dest: Int, channel: String, replyId: String, result: AnyObject) -> Void {
        guard let window = _window else {return;}
     //   let payload = NKE_IPC_Event(sender: _id, channel: channel, replyId: replyId, arg: [result])
        window._events.emit("nk.IPCReplytoMain", (sender: _id, channel: channel, replyId: replyId, arg: [result]))
    }
}

extension NKE_IpcRenderer: NKScriptExport {

    static func attachTo(context: NKScriptContext) {
        let principal = NKE_IpcRenderer(id: context.NKid)
        context.NKloadPlugin(principal, namespace: "io.nodekit.electro.ipcRenderer", options: [String:AnyObject]())
    }

    func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
            let url = NSBundle(forClass: NKE_IpcRenderer.self).pathForResource("ipc-renderer", ofType: "js", inDirectory: "lib-electro")
            let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
            return "function loadplugin(){\n" + appjs! + "\n}\n" + stub + "\n" + "loadplugin();" + "\n"
        default:
            return stub
        }
    }

    class func scriptNameForSelector(selector: Selector) -> String? {
        return selector == Selector("initWithOptions:") ? "" : nil
    }
}
