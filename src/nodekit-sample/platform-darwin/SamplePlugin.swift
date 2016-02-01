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

import Foundation
import Cocoa
import WebKit

protocol SamplePluginProtocol: NKScriptExport {
    func logconsole(text: AnyObject?) -> Void
    func alertSync(text: AnyObject?) -> String
}


class SamplePlugin: NSObject, SamplePluginProtocol {
    class func attachTo(context: NKScriptContext) {
        context.NKloadPlugin(SamplePlugin(), namespace: "io.nodekit.test", options: ["PluginBridge": NKScriptExportType.NKScriptExport.rawValue])
    }

    func logconsole(text: AnyObject?) -> Void {
        log(text as? String! ?? "")
    }

    func alertSync(text: AnyObject?) -> String {
        dispatch_async(dispatch_get_main_queue()) {
            self._alert(title: text as? String, message: nil)
        }
        return "OK"
    }

    private func _alert(title title: String?, message: String?) {
        let myPopup: NSAlert = NSAlert()
        myPopup.messageText = message ?? "NodeKit"
        myPopup.informativeText = title ?? ""
        myPopup.alertStyle = NSAlertStyle.WarningAlertStyle
        myPopup.addButtonWithTitle("OK")
        myPopup.runModal()
    }
}

/*

extension WKWebView: WKUIDelegate {
    private func _alert(title title: String?, message: String?) {
        let myPopup: NSAlert = NSAlert()
        myPopup.messageText = message ?? "NodeKit"
        myPopup.informativeText = title!
        myPopup.alertStyle = NSAlertStyle.WarningAlertStyle
        myPopup.addButtonWithTitle("OK")
        myPopup.runModal()
    }

    public func webView(webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: () -> Void) {

        _alert(title: self.title, message: message)
    }

    public func webView(webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: (String?) -> Void) {

        completionHandler("hello from native;  you sent: " + prompt)

    }
} */
