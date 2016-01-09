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
import JavaScriptCore

public enum NKEngineType : Int {
    case JavaScriptCore  = 0
    case WKWebView = 1
    case UIWebView
    case WebView
}

public class NKJSContextFactory {
    
    internal static var _contexts: Dictionary<UInt, AnyObject> = Dictionary<UInt, AnyObject>()
    
    internal class var sequenceNumber: UInt {
        struct sequence{
            static var number: UInt = 0
        }
        return ++sequence.number
    }
    
    public func createContext(options: [String: AnyObject] = Dictionary<String, AnyObject>(), delegate cb: NKScriptContextDelegate)
        {
       let engine = NKEngineType(rawValue: (options["Engine"] as? Int)!) ?? NKEngineType.JavaScriptCore
            
        switch engine {
        case .JavaScriptCore:
            self.createContextJavaScriptCore(options, delegate: cb)
        case .WKWebView:
            self.createContextWKWebView(options, delegate: cb)
        case .UIWebView:
            self.createContextUIWebView(options, delegate: cb)
        case .WebView:
            NSException(name: "Unsupported NKContextType", reason: "Use JavaScriptCore or WKWebView", userInfo: nil).raise()
        }
    }
}
