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
import WebKit
import JavaScriptCore

struct NKJSContextFactory {
    
    static func createRegularContext(callback: (JSContext!)-> () )
    {
        print("Starting javascriptcore native engine")
        let vm = JSVirtualMachine()
        let context = JSContext(virtualMachine: vm)
        
        callback(context)
    }
    
    static func createWKContext(callback: (WKWebView!)-> () )
    {
        let width: CGFloat = 400
        let height: CGFloat = 300
        
        let windowRect : NSRect = (NSScreen.mainScreen()!).frame
        
        let frameRect : NSRect = NSMakeRect(
            (NSWidth(windowRect) - width)/2,
            (NSHeight(windowRect) - height)/2,
            width, height)
        
        let viewRect : NSRect = NSMakeRect(0,0,width, height);
        
        let mainWindow = NSWindow(contentRect: frameRect, styleMask: NSTitledWindowMask | NSClosableWindowMask | NSResizableWindowMask, backing: NSBackingStoreType.Buffered, `defer`: false, screen: NSScreen.mainScreen())
        
        
        if (mainWindows == nil) {
            mainWindows = NSMutableArray()
        }
        
        mainWindows?.addObject(mainWindow)
        
        let config = WKWebViewConfiguration()
        let webPrefs = WKPreferences()
        
        webPrefs.javaEnabled = false
        webPrefs.plugInsEnabled = false
        webPrefs.javaScriptEnabled = true
        webPrefs.javaScriptCanOpenWindowsAutomatically = true
      
        config.preferences = webPrefs
        
        let scriptSource = "console.log('FROM JAVA'); console.log(window.prompt('hello native')); console.log('FROM JAVA');";
        
        let userScript: WKUserScript =  WKUserScript(source: scriptSource, injectionTime: WKUserScriptInjectionTime.AtDocumentEnd, forMainFrameOnly: false);
        config.userContentController.addUserScript(userScript)
        
       let webview = NKWebView(frame: viewRect, configuration: config)
        
        mainWindow.makeKeyAndOrderFront(nil)
        mainWindow.contentView = webview
        mainWindow.title = "NodeKit VM"
        webview.autoresizingMask = [NSAutoresizingMaskOptions.ViewWidthSizable, NSAutoresizingMaskOptions.ViewHeightSizable]
        
   //     webview.loadPlugin(HelloWorld(), namespace: "io.nodekit")
    //    let url = NSURL(string: "http://nodekit.io" as String)
    //    let requestObj: NSURLRequest = NSURLRequest(URL: url!)
      //  webview.loadRequest(requestObj)
        webview.loadHTMLString("<HTML><BODY>NodeKit</BODY></HTML>", baseURL: NSURL(string: "about:blank"))
        webview.UIDelegate = webview;
        callback(webview) 
      
    }
}

class HelloWorld {
    @objc func alert(text: AnyObject?) -> String  {
         dispatch_async(dispatch_get_main_queue()) {
            _alert(title: text as? String, message: nil)
        }
        return "OK"
    }
}

private func _alert(title title: String?, message: String?) {
    let myPopup: NSAlert = NSAlert()
    myPopup.messageText = message ?? "NodeKit"
    myPopup.informativeText = title!
    myPopup.alertStyle = NSAlertStyle.WarningAlertStyle
    myPopup.addButtonWithTitle("OK")
    myPopup.runModal()
}
