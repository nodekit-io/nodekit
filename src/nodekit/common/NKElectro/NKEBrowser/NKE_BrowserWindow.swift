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

class NKE_BrowserWindow: NSObject {

    internal var _events: NKEventEmitter = NKEventEmitter()

    internal static var _windowArray: [Int: NKE_BrowserWindow] = [Int: NKE_BrowserWindow]()
    internal var _window: AnyObject?

    internal weak var _context: NKScriptContext?
    internal weak var _webView: AnyObject?
    internal var _browserType: NKEBrowserType = NKEBrowserType.WKWebView

    internal var _id: Int = 0
    private var _type: String = ""
    internal var _options: Dictionary <String, AnyObject> =  Dictionary <String, AnyObject>()
    private var _nke_renderer: AnyObject?
    internal var _webContents: NKE_WebContentsBase? = nil

    override init() {
        super.init()
    }

    // Creates a new BrowserWindow with native properties as set by the options.
    required init(options: Dictionary<String, AnyObject>) {
        super.init()

        // PARSE & STORE OPTIONS
        self._options["nk.InstallElectro"] = options["nk.InstallElectro"] as? Bool ?? true

        self._browserType = NKEBrowserType(rawValue: (options[NKEBrowserOptions.nkBrowserType] as? String) ?? NKEBrowserDefaults.nkBrowserType)!

        switch self._browserType {
        case .WKWebView:
            log("+creating Nitro Renderer")
            self._id = self.createWKWebView(options)
            self._type = "Nitro"
            let webContents: NKE_WebContentsWK = NKE_WebContentsWK(window: self)
            self._webContents = webContents
        case .UIWebView:
            log("+creating JavaScriptCore Renderer")
            self._id = self.createUIWebView(options)
            self._type = "JavaScriptCore"
            let webContents: NKE_WebContentsUI = NKE_WebContentsUI(window: self)
            self._webContents = webContents
        }

        NKE_BrowserWindow._windowArray[self._id] = self
    }

    // class functions (for Swift/Objective-C use only, equivalent functions exist in .js helper )
    static func fromId(id: Int) -> NKE_BrowserWindowProtocol? { return NKE_BrowserWindow._windowArray[id] }

    var id: Int {
        get {
         return _id
        }
    }

    var type: String {
        get {
            return _type
        }
    }

    var webContents: NKE_WebContentsBase {
        get {
            return _webContents!
        }
    }

    private static func NotImplemented(functionName: String = __FUNCTION__) -> Void {
        log("!browserWindow.\(functionName) is not implemented")
    }

    private func NotImplemented(functionName: String = __FUNCTION__) -> Void {
        log("!browserWindow.\(functionName) is not implemented")
    }
}


extension NKE_BrowserWindow: NKScriptExport {

    static func attachTo(context: NKScriptContext) {
        let principal = NKE_BrowserWindow.self
        context.NKloadPlugin(principal, namespace: "io.nodekit.electro.BrowserWindow", options: [String:AnyObject]())
    }

    class func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
            let url = NSBundle(forClass: NKE_BrowserWindow.self).pathForResource("browser-window", ofType: "js", inDirectory: "lib-electro")
            let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
            return "function loadplugin(){\n" + appjs! + "\n}\n" + stub + "\n" + "loadplugin();" + "\n"
        default:
            return stub
        }
    }

    class func scriptNameForSelector(selector: Selector) -> String? {
        return selector == Selector("initWithOptions:") ? "" : nil
    }
    class func isSelectorExcludedFromScript(selector: Selector) -> Bool {
        return selector.description.hasPrefix("webView") ||
        selector.description.hasPrefix("NKScriptEngineLoaded") ||
         selector.description.hasPrefix("NKApplicationReady")
    }
}

extension NKE_BrowserWindow: NKScriptContextDelegate {
    internal func NKScriptEngineDidLoad(context: NKScriptContext) -> Void {
        log("+E\(context.NKid) Renderer Loaded")

        if (!(self._options["nk.InstallElectro"] as! Bool)) { return;}
        self._context = context

        // INSTALL JAVASCRIPT ENVIRONMENT ON RENDERER CONTEXT
        NKE_BootElectroRenderer.bootTo(context)
    }

    internal func NKScriptEngineReady(context: NKScriptContext) -> Void {
        switch self._browserType {
        case .WKWebView:
            WKScriptEnvironmentReady()
         case .UIWebView:
            UIScriptEnvironmentReady()
        }
        log("+E\(id) Renderer Ready")
        
    }
}