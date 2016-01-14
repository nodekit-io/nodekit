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

@objc class NKEDialog: NSObject, NKEDialogProtocol {
    
    override init(){
        super.init()
    }
    
    private static func NotImplemented(functionName: String = __FUNCTION__) -> Void {
        log("!dialog.\(functionName) is not available for iOS");
    }
    

    func showOpenDialog(browserWindow: NKE_BrowserWindow?, options: Dictionary<String, AnyObject>?, callback: NKScriptObject?) -> Void {
        NKEDialog.NotImplemented()
    }
    
    
    func showSaveDialog(browserWindow: NKE_BrowserWindow?, options: Dictionary<String, AnyObject>?, callback: NKScriptObject?)-> Void {
        NKEDialog.NotImplemented()
     }
    
    func showMessageBox(browserWindow: NKE_BrowserWindow?, options: Dictionary<String, AnyObject>?, callback: NKScriptObject?) -> Void {
   //     let type: String = (options?["type"] as? String) ?? "none"
        let buttons: [String] = (options?["buttons"] as? [String]) ?? ["Ok"]
        let title: String = (options?["title"] as? String) ?? ""
        let message: String = (options?["message"] as? String) ?? ""
 //       let detail: String = (options?["detail"] as? String) ?? ""
        //  let icon: NKNativeImage? = (options?["detail"] as? NKNativeImage)
        //  let cancelId: Int = (options?["cancelId"] as? String) ?? 0
        //    let noLink: Bool = (options?["cancelId"] as? Bool) ?? false
        
        
        let alertController = UIAlertController(title: title, message: message, preferredStyle: .Alert)
        
        for var i = 0; i < buttons.count; i++ {
            let buttonTitle: String = buttons[i] ?? "";
     
            let buttonAction = UIAlertAction(title: buttonTitle, style: (buttonTitle == "Cancel" ? .Cancel : .Default)) { (action) in
                callback?.call(arguments: [i], completionHandler: nil)
                };
            
            alertController.addAction(buttonAction)
        }
        
        guard let viewController = UIApplication.sharedApplication().delegate!.window!?.rootViewController else {return;}
        
        viewController.presentViewController(alertController, animated: true, completion: nil)

    }
    
    func showErrorBox(title: String, content: String) -> Void {
        self.showMessageBox(nil, options: ["message": title, "detail": content, "type": "error"], callback: nil)
    }
    
}