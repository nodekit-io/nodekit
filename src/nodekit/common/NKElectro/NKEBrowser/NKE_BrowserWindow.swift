/*
* nodekit.io
*
* Copyright (c) -> Void 2016 OffGrid Networks. All Rights Reserved.
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
import WebKit
import JavaScriptCore


@objc class NKE_BrowserWindow: NSObject  {
    
    internal var _events: NKEventEmitter = NKEventEmitter()
    
    internal static var _windowArray: [Int: NKE_BrowserWindow] = [Int: NKE_BrowserWindow]()
    internal var _window: AnyObject?;

    internal weak var _context: NKScriptContext?
    internal weak var _webView: AnyObject?
    internal var _browserType: NKEBrowserType = NKEBrowserType.WKWebView
    
    internal var _id: Int = 0;
    private var _type: String = "";
    internal var _options: Dictionary <String, AnyObject> =  Dictionary <String, AnyObject>()
    private var _nke_renderer: AnyObject?
    
    override init(){
        super.init()
    }
    
    // Creates a new BrowserWindow with native properties as set by the options.
    required init(options: Dictionary<String, AnyObject>) {
        super.init()
        
        // PARSE & STORE OPTIONS
        self._options["nk.InstallElectro"] = options["nk.InstallElectro"] as? Bool ?? true
        
        
        let createBlock = {() -> Void in
            
            self._browserType = NKEBrowserType(rawValue: (options[NKEBrowserOptions.nkBrowserType] as? String) ?? NKEBrowserDefaults.nkBrowserType)!
            
            let window = self.createWindow(options);
            self._window = window;
            
            switch self._browserType {
            case .WKWebView:
                log("+creating Nitro Renderer")
                self._id = self.createWKWebView(window, options: options)
                self._type = "Nitro"
            case .UIWebView:
                log("+creating JavaScriptCore Renderer")
                 self._id = self.createUIWebView(window, options: options)
                 self._type = "JavaScriptCore"
             }
            
            NKE_BrowserWindow._windowArray[self._id] = self;
            
            // Complete JavaScript Initialization to load WebContents binding
            self.NKscriptObject?.callMethod("_init", withArguments: nil, completionHandler: nil)
        }
        
        if (NSThread.isMainThread())
        {
            createBlock()
        }
        else
        {
            dispatch_async(dispatch_get_main_queue(), createBlock)
        }
    }
 
    // class functions (for Swift/Objective-C use )
    static func getAllWindows() -> [NKE_BrowserWindowProtocol] { NotImplemented(); return [NKE_BrowserWindowProtocol]() }
    static func getFocusedWindow() -> NKE_BrowserWindowProtocol?  { NotImplemented(); return nil }
    static func fromWebContents(webContents: AnyObject) -> AnyObject?  { NotImplemented(); return nil }
    static func fromContext(context: AnyObject) -> AnyObject?  { NotImplemented(); return nil }
    static func fromId(id: Int) -> NKE_BrowserWindowProtocol?  { return NKE_BrowserWindow._windowArray[id] }
    static func addDevToolsExtension(path: String)   { NotImplemented(); }
    static func removeDevToolsExtension(name: String)  { NotImplemented(); }
    
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
      
    private static func NotImplemented(functionName: String = __FUNCTION__) -> Void {
        log("!browserWindow.\(functionName) is not implemented");
    }
    
    private func NotImplemented(functionName: String = __FUNCTION__) -> Void {
        log("!browserWindow.\(functionName) is not implemented");
    }
}


extension NKE_BrowserWindow: NKScriptPlugin {
    
    static func attachTo(context: NKScriptContext) {
        let principal = NKE_BrowserWindow()
        context.NKloadPlugin(principal, namespace: "io.nodekit.BrowserWindow", options: [String:AnyObject]());
    }
    
    func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
            let url = NSBundle(forClass: NKEApp.self).pathForResource("browser-window", ofType: "js", inDirectory: "lib-electro")
            let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
            return "function loadplugin(){\n" + appjs! + "\n}\n" + stub + "\n" + "loadplugin();" + "\n"
        default:
            return stub;
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
    internal func NKScriptEngineLoaded(context: NKScriptContext) -> Void {
        log("E\(context.NKid) Renderer Engine Loaded");
        
        if (!(self._options["nk.InstallElectro"] as! Bool)) { return;}
        self._context = context;
        
        // INSTALL JAVASCRIPT ENVIRONMENT ON RENDERER CONTEXT
        NKE_BootRenderer.bootTo(context)
    }
    
    internal func NKApplicationReady(id: Int, context: NKScriptContext?) -> Void {
        switch self._browserType {
        case .WKWebView:
            WKApplicationReady()
         case .UIWebView:
            UIApplicationReady()
        }
        log("E\(id) APPLICATION READY");
        
    }
}