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
import UIKit

protocol SamplePluginProtocol: NKScriptExport {
    func logconsole(text: AnyObject?) -> Void
    func alertSync(text: AnyObject?) -> String
}

class SamplePlugin: NSObject, SamplePluginProtocol {
    class func attachTo(context: NKScriptContext) {
        context.NKloadPlugin(SamplePlugin(), namespace: "io.nodekit.test", options: ["PluginBridge": NKScriptExportType.NKScriptExport.rawValue])
    }
    
    func logconsole(text: AnyObject?) -> Void {
        log(text as? String! ?? "")
    }

    func alertSync(text: AnyObject?) -> String {
        let alertBlock = { () -> Void in
            self._alert(title: text as? String, message: nil)
        }

        if (NSThread.isMainThread()) {
            alertBlock()
        } else {
            dispatch_async(dispatch_get_main_queue(), alertBlock)
        }
        return "OK"
    }


    private func _alert(title title: String?, message: String?) {
        let buttons: [String] = ["Ok"]
        let title: String = title ?? ""
        let message: String = message ?? ""

        let alertController = UIAlertController(title: title, message: message, preferredStyle: .Alert)

        for var i = 0; i < buttons.count; i++ {
            let buttonTitle: String = buttons[i] ?? ""

            let buttonAction = UIAlertAction(title: buttonTitle, style: (buttonTitle == "Cancel" ? .Cancel : .Default), handler: nil)
            alertController.addAction(buttonAction)
        }
        guard let viewController = UIApplication.sharedApplication().delegate!.window!?.rootViewController else {return;}
        viewController.presentViewController(alertController, animated: true, completion: nil)
    }
}
