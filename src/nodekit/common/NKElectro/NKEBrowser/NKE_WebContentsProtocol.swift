/*
* nodekit.io
*
* Copyright (c) -> Void -> Void 2016 OffGrid Networks. All Rights Reserved.
* Portions Copyright (c) -> Void 2013 GitHub, Inc. under MIT License
*
* Licensed under the Apache License, Version 2.0 (the "License") -> Void;
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

protocol NKE_WebContentsProtocol: NKScriptExport, NKE_IpcProtocol {

    func loadURL(url: String, options: [String: AnyObject]) -> Void
    func getURL() -> String
    func getTitle() -> String
    func isLoading() -> Bool
    func stop() -> Void
    func reload() -> Void
    func reloadIgnoringCache() -> Void
    func canGoBack() -> Bool
    func canGoForward() -> Bool

    func goBack() -> Void
    func goForward() -> Void

    func setUserAgent(userAgent: String) -> Void
    func getUserAgent() -> String
    func executeJavaScript(code: String, userGesture: String) -> Void

    func ipcSend(channel: String, replyId: String, arg: [AnyObject]) -> Void
    func ipcReply(dest: Int, channel: String, replyId: String, result: AnyObject) -> Void

    // Event:  'did-fail-load'
    // Event:  'did-finish-load'


    // NOT IMPLEMENTED
/*  func clearHistory() -> Void
    func isWaitingForResponse() -> Bool
    func downloadURL(url: String) -> Void
    func goToIndex(index: Int) -> Void
    func canGoToOffset(offset: Int) -> Void
    func goToOffset(offset: Int) -> Void
    func isCrashed() -> Void
    func insertCSS(css: String) -> Void
    func setAudioMuted(muted: Bool) -> Void
    func isAudioMuted() -> Bool
    func undo() -> Void
    func redo() -> Void
    func cut() -> Void
    func copyclipboard() -> Void
    func paste() -> Void
    func pasteAndMatchStyle() -> Void
    func delete() -> Void
    func selectAll() -> Void
    func unselect() -> Void
    func replace(text: String) -> Void
    func replaceMisspelling(text: String) -> Void
    func hasServiceWorker(callback: NKScriptValue) -> Void
    func unregisterServiceWorker(callback: NKScriptValue) -> Void
    func print(options: [String: AnyObject]) -> Void
    func printToPDF(options: [String: AnyObject], callback: NKScriptValue) -> Void
    func addWorkSpace(path: String) -> Void
    func removeWorkSpace(path: String) -> Void
    func openDevTools(options: [String: AnyObject]) -> Void
    func closeDevTools() -> Void
    func isDevToolsOpened() -> Void
    func toggleDevTools() -> Void
    func isDevToolsFocused() -> Void
    func inspectElement(x: Int, y: Int) -> Void
    func inspectServiceWorker() -> Void
    func enableDeviceEmulation(parameters: [String: AnyObject]) -> Void
    func disableDeviceEmulation() -> Void
    func sendInputEvent(event: [String: AnyObject]) -> Void
    func beginFrameSubscription(callback: NKScriptValue) -> Void
    func endFrameSubscription() -> Void
    func savePage(fullPath: String, saveType: String, callback: NKScriptValue) -> Void
    var session: NKScriptValue? { get }
    var devToolsWebContents: NKE_WebContentProtocol { get } */
    // Event:  'certificate-error'
    // Event:  'crashed'
    // Event:  'destroyed'
    // Event:  'devtools-closed'
    // Event:  'devtools-focused'
    // Event:  'devtools-opened'
    // Event:  'did-frame-finish-load'
    // Event:  'did-get-redirect-request'
    // Event:  'did-get-response-details'
    // Event:  'did-start-loading'
    // Event:  'did-stop-loading'
    // Event:  'dom-ready'
    // Event:  'login'
    // Event:  'new-window'
    // Event:  'page-favicon-updated'
    // Event:  'plugin-crashed'
    // Event:  'select-client-certificate'
    // Event:  'will-navigate'
}
