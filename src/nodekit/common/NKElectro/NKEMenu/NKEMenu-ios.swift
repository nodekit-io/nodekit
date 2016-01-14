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
import UIKit

@objc class NKEMenu: NSObject, NKEMenuProtocol {
    
    override init(){
        super.init()
    }
    
    static func setApplicationMenu(menu: NKEMenuProtocol) -> Void { NKEMenu.NotImplemented(); }
    static func sendActionToFirstResponder(action: String) -> Void  { NKEMenu.NotImplemented(); } //OS X
    static func buildFromTemplate(template: [Dictionary<String, AnyObject>]) -> NKEMenuProtocol  { NKEMenu.NotImplemented(); return NKEMenu() }
    
    func popup(browserWindow: NKE_BrowserWindow?, x: Int, y: Int) -> Void  { NKEMenu.NotImplemented(); }
    func append(menuItem: NKEMenuItemProtocol) -> Void  { NKEMenu.NotImplemented(); }
    func insert(pos: Int, menuItem: NKEMenuItemProtocol) -> Void  { NKEMenu.NotImplemented(); }
    func items() -> [NKEMenuItemProtocol]  { NKEMenu.NotImplemented(); return [NKEMenuItemProtocol]() }
    
    private static func NotImplemented(functionName: String = __FUNCTION__) -> Void {
        log("!menu.\(functionName) is not implemented");
    }
   
}

@objc class NKEMenuItem: NSObject, NKEMenuItemProtocol {
    
    override init(){
        super.init()
    }
    
    
    // Creates a new BrowserWindow with native properties as set by the options.
    required init(options: Dictionary<String, AnyObject>) {
        super.init()
        
        let createBlock = {() -> Void in
            
            
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
    
    class func scriptNameForSelector(selector: Selector) -> String? {
        return selector == Selector("initWithOptions:") ? "" : nil
    }
}