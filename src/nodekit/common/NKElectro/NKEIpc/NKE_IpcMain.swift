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


class NKE_IpcMain: NSObject, NKE_IpcProtocol {
    private var globalEvents: NKEventEmitter = NKEventEmitter.global

    override init() {
        super.init()

        globalEvents.on("nk.IPCtoMain") { (item: NKE_IPC_Event) -> Void in
            
              self.NKscriptObject?.invokeMethod("emit", withArguments: ["nk.IPCtoMain", item.sender, item.channel, item.replyId, item.arg], completionHandler: nil)
        }
    }

    func ipcSend(channel: String, replyId: String, arg: [AnyObject]) -> Void {
        NSException(name: "Illegal function call", reason: "Event subscription only API.  Sends are handled in WebContents API", userInfo: nil).raise()
    }

    // Replies to renderer to the window events queue for that renderer
    func ipcReply(dest: Int, channel: String, replyId: String, result: AnyObject) -> Void {
        let payload = NKE_IPC_Event(sender: 0, channel: channel, replyId: replyId, arg: [result])
        guard let window = NKE_BrowserWindow.fromId(dest) as? NKE_BrowserWindow else {return;}
        window._events.emit("nk.IPCReplytoRenderer", payload)
    }

}


extension NKE_IpcMain: NKScriptExport {

    static func attachTo(context: NKScriptContext) {
        context.NKloadPlugin(NKE_IpcMain(), namespace: "io.nodekit.electro.ipcMain", options: [String:AnyObject]())
    }

    func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
            let url = NSBundle(forClass: NKE_IpcMain.self).pathForResource("ipc-main", ofType: "js", inDirectory: "lib-electro")
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
