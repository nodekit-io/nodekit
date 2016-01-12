
import Foundation
import WebKit
import JavaScriptCore

@objc class NKBrowserWindow: NSObject, NKScriptContextDelegate {
    
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
            
            let browserType = NKBrowserType(rawValue: (options[NKBrowserOptions.nkBrowserType] as? String) ?? NKDefaults.nkBrowserType)!
            
            let window = self.createWindow(options);
            NKBrowserWindow.windowArray.addObject(window)
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
    static func getAllWindows() -> [NKBrowserWindowProtocol] { NotImplemented(); return [NKBrowserWindowProtocol]() }
    static func getFocusedWindow() -> NKBrowserWindowProtocol?  { NotImplemented(); return nil }
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
      
    private static func NotImplemented() -> Void {
        NSException(name: "NotImplemented", reason: "This function is not implemented", userInfo: nil).raise()
    }
    
    private func NotImplemented() -> Void {
        NSException(name: "NotImplemented", reason: "This function is not implemented", userInfo: nil).raise()
    }
    
    func _getNativeWindow() -> AnyObject? { return _window; }
}
