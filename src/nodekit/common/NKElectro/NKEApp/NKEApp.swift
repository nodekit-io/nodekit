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

extension NKE_App: NKScriptExport {

    static func attachTo(context: NKScriptContext) {
        let principal = NKE_App()
        context.NKloadPlugin(principal, namespace: "io.nodekit.electro.app", options: [String:AnyObject]())
    }

    func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
            let url = NSBundle(forClass: NKE_App.self).pathForResource("app", ofType: "js", inDirectory: "lib-electro")
            let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
            return "function loadplugin(){\n" + appjs! + "\n}\n" + stub + "\n" + "loadplugin();" + "\n"
        default:
            return stub
        }
    }
}

class NKE_App: NSObject, NKEAppProtocol {

    private var events: NKEventEmitter = NKEventEmitter.global
 
    override init() {
        super.init()
        initializeEvents()
    }

    func quit() -> Void {  exit(0) }
    func exit(exitCode: Int) -> Void { exit(exitCode) }

    func getAppPath() -> String { return (NSBundle.mainBundle().bundlePath as NSString).stringByDeletingLastPathComponent }
    func getPath(name: String) -> String { return NKEAppDirectory.getPath(name) }
    func setPath(name: String, path: String) -> Void { NotImplemented(); }

    func getVersion() -> String { return (NKEAppDirectory.getPackage()?["version"] as? String) ?? "" }
    func getName() -> String { return (NKEAppDirectory.getPackage()?["name"] as? String) ?? ""  }
    func getLocale() -> String { NotImplemented(); return "" }
    func addRecentDocument(path: String) -> Void { NotImplemented(); } //OS X WINDOWS
    func clearRecentDocuments() -> Void { NotImplemented(); } //OS X WINDOWS
    func setUserTasks(tasks: [Dictionary<String, AnyObject>]) -> Void { NotImplemented(); } //WINDOWS
    func allowNTLMCredentialsForAllDomains(allow: Bool) -> Void { NotImplemented(); }
    func makeSingleInstance(callback: AnyObject) -> Void { NotImplemented(); }
    func setAppUserModelId(id: String) -> Void { NotImplemented(); } //WINDOWS

    func appendSwitch(`switch`: String, value: String?) -> Void { NotImplemented(); }
    func appendArgument(value: String) -> Void { NotImplemented(); }
    func dockBounce(type: String?) -> Int { NotImplemented(); return 0 }//OS X
    func dockCancelBounce(id: Int) -> Void { NotImplemented(); } //OS X
    func dockSetBadge(text: String) -> Void { NotImplemented(); } //OS X
    func dockGetBadge() -> String { NotImplemented(); return "" } //OS X
    func dockHide() -> Void { NotImplemented(); } //OS X
    func dockShow() -> Void { NotImplemented(); } //OS X
    func dockSetMenu(menu: AnyObject) -> Void { NotImplemented(); } //OS X


    // Event: 'will-finish-launching'

    private func initializeEvents() {
    // Event: 'ready'
        events.once("nk.jsApplicationReady") { (data: AnyObject) -> Void in
             self.NKscriptObject?.invokeMethod("emit", withArguments: ["ready"], completionHandler: nil)
        }

        events.once("nk.ApplicationDidFinishLaunching") { () -> Void in
            self.NKscriptObject?.invokeMethod("emit", withArguments: ["will-finish-launching"], completionHandler: nil)
        }

        events.once("nk.ApplicationWillTerminate") { () -> Void in
            self.NKscriptObject?.invokeMethod("emit", withArguments: ["will-quit"], completionHandler: nil)
            self.NKscriptObject?.invokeMethod("emit", withArguments: ["quit"], completionHandler: nil)
      }

    // Event: 'window-all-closed'
    // Event: 'before-quit'
    // Event: 'will-quit'
    // Event: 'quit'
    // Event: 'open-file' OS X
    // Event: 'open-url' OS X
    // Event: 'activate' OS X
    // Event: 'browser-window-blur'
    // Event: 'browser-window-focus'
    // Event: 'browser-window-created'
    // Event: 'certificate-error'
    // Event: 'select-client-certificate'
    // Event: 'login'
    // Event: 'gpu-process-crashed'
    }

    private static func NotImplemented(functionName: String = __FUNCTION__) -> Void {
        log("!app.\(functionName) is not implemented")
    }

    private func NotImplemented(functionName: String = __FUNCTION__) -> Void {
         log("!app.\(functionName) is not implemented")
    }
}
