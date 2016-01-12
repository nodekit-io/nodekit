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

@objc class NKEBrowserWindow: NSObject, NKScriptContextDelegate {
    
    private var _window: AnyObject?;
    private weak var _context: NKScriptContext?
    private var _id: Int = 0;
    
    private static var windowArray: NSMutableArray = NSMutableArray()
    
    override init(){
        super.init()
    }
    
    // Creates a new BrowserWindow with native properties as set by the options.
    required init(options: Dictionary<String, AnyObject>) {
        super.init()
        
        let createBlock = {() -> Void in
            
            let browserType = NKEBrowserType(rawValue: (options[NKEBrowserOptions.nkBrowserType] as? String) ?? NKEBrowserDefaults.nkBrowserType)!
            
            let window = self.createWindow(options);
            NKEBrowserWindow.windowArray.addObject(window)
            self._window = window;
            
            switch browserType {
            case .WKWebView:
                log("+creating WKWebView Renderer")
                self._id = self.createWKWebView(window, options: options)
            case .UIWebView:
                log("+creating UIWebView Renderer")
                 self._id = self.createUIWebView(window, options: options)
            }
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
    
    internal func NKScriptEngineLoaded(context: NKScriptContext) -> Void {
        log("E\(context.NKid) SCRIPT ENGINE LOADED");
        self._context = context;
    }
    
    internal func NKApplicationReady(id: Int, context: NKScriptContext?) -> Void {
        log("E\(id) APPLICATION READY");
    }
    
    class func scriptNameForSelector(selector: Selector) -> String? {
        return selector == Selector("initWithOptions:") ? "" : nil
    }
    
    // class functions
    static func getAllWindows() -> [NKEBWProtocol] { NotImplemented(); return [NKEBWProtocol]() }
    static func getFocusedWindow() -> NKEBWProtocol?  { NotImplemented(); return nil }
    static func fromWebContents(webContents: AnyObject) -> AnyObject?  { NotImplemented(); return nil }
    static func fromContext(context: AnyObject) -> AnyObject?  { NotImplemented(); return nil }
    static func fromId(id: Int) -> AnyObject?  { NotImplemented(); return nil }
    static func addDevToolsExtension(path: String)   { NotImplemented(); }
    static func removeDevToolsExtension(name: String)  { NotImplemented(); }
    
     var webContents: AnyObject? {get { return self._context } }
    var id: Int {
        get {
            if (self._context != nil)
            {return self._context!.NKid }
            else {return 0};
        }
    }
      
    private static func NotImplemented(functionName: String = __FUNCTION__) -> Void {
        log("!browserWindow.\(functionName) is not implemented");
    }
    
    private func NotImplemented(functionName: String = __FUNCTION__) -> Void {
        log("!browserWindow.\(functionName) is not implemented");
    }
    
    func _getNativeWindow() -> AnyObject? { return _window; }
}
