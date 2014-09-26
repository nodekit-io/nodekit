/*
* nodekit.io
*
* Copyright (c) 2014 Domabo. All Rights Reserved.
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
import JavaScriptCore

struct NKJSContextFactory {
    
    static var debug : NKWebViewDebug! = nil;
    static var _debugView : WebView! = nil;
    
    static func createRegularContext(callback: (JSContext!)-> () )
    {
        println("Starting javascriptcore native engine")
        var vm = JSVirtualMachine()
        var context = JSContext(virtualMachine: vm)
        callback(context)
    }
    
    static func createDebugContext(callback: (JSContext!)-> () )
    {
        
        println("Starting javascriptcore embedded engine")
        
        _debugView = WebView()
        
        var webPrefs : WebPreferences = WebPreferences.standardPreferences()
        
        webPrefs.javaEnabled = false
        webPrefs.plugInsEnabled = false
        webPrefs.javaScriptEnabled = true
        webPrefs.javaScriptCanOpenWindowsAutomatically = false
        webPrefs.loadsImagesAutomatically = true
        webPrefs.allowsAnimatedImages = false
        webPrefs.allowsAnimatedImageLooping = false
        webPrefs.shouldPrintBackgrounds = false
        webPrefs.userStyleSheetEnabled = false
        
        _debugView.setMaintainsBackForwardList(true)
        
        _debugView.applicationNameForUserAgent = "nodekit"
        _debugView.drawsBackground = false
        _debugView.preferences = webPrefs
        
        debug = NKWebViewDebug(callBack: callback);
        
        _debugView.frameLoadDelegate = debug;
        
        var url = NSURL(string: "about:blank")
        var requestObj: NSURLRequest = NSURLRequest(URL: url!)
        
        _debugView.mainFrame.loadRequest(requestObj)
        
        var scriptObject : WebScriptObject = _debugView.windowScriptObject
        scriptObject.setValue("TEST", forKey: "TEST")
        
        

    }
}
