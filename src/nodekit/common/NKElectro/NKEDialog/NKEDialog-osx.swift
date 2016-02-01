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
import Cocoa

extension NKE_Dialog: NKScriptExport {

    static func attachTo(context: NKScriptContext) {
        let principal = NKE_Dialog()
        context.NKloadPlugin(principal, namespace: "io.nodekit.electro.dialog", options: [String:AnyObject]())
    }

}

class NKE_Dialog: NSObject, NKE_DialogProtocol {

    func showOpenDialog(browserWindow: NKE_BrowserWindow?, options: Dictionary<String, AnyObject>?, callback: NKScriptValue?) -> Void {
        let fileManager = NSFileManager.defaultManager()

        let title: String = (options?["title"] as? String) ?? ""
        let defaultPath: String = (options?["defaultPath"] as? String) ?? ""
        let filters: [Dictionary<String, AnyObject>] = (options?["filters"] as? [Dictionary<String, AnyObject>]) ?? [Dictionary<String, AnyObject>]()
        let properties: [String] = (options?["properties"] as? [String]) ?? ["openFile"]

        let openPanel = NSOpenPanel()
        openPanel.title = title


        if (defaultPath != "") {
            if (fileManager.fileExistsAtPath(defaultPath)) {
                openPanel.directoryURL = NSURL(string: (defaultPath as NSString).stringByDeletingLastPathComponent)
                openPanel.nameFieldStringValue = (defaultPath as NSString).lastPathComponent
            } else {
                openPanel.directoryURL = NSURL(fileURLWithPath: defaultPath)
            }
        }

        openPanel.canSelectHiddenExtension = true

        openPanel.allowsMultipleSelection = properties.contains("multiSelections")
        openPanel.canChooseDirectories =  properties.contains("openDirectory")
        openPanel.canCreateDirectories = properties.contains("createDirectory")
        openPanel.canChooseFiles = properties.contains("openFile")

        if (filters.isEmpty) {
            openPanel.allowsOtherFileTypes = true
        } else {

            let file_type_set: NSMutableSet = NSMutableSet()
            for var i = 0; i < filters.count; ++i {
                let filter: [String: AnyObject]! = filters[i]

              //  let name: String = filter["name"] as! String
                let extensions: [String] = filter["extensions"] as! [String]

                for var j = 0; j < extensions.count; ++j {
                    // If we meet a '*' file extension, we allow all the file types and no
                    // need to set the specified file types.
                    let ext = extensions[j]
                    if ext == "*" {
                        openPanel.allowsOtherFileTypes = true
                        return
                    }
                    file_type_set.addObject(ext)
                }
            }

            openPanel.allowedFileTypes = file_type_set.allObjects as? [String]
        }


        openPanel.beginWithCompletionHandler({(result: Int) in
            if(result == NSFileHandlingPanelOKButton) {
                var paths = [String]()
                let urls = openPanel.URLs

                for url: NSURL in urls {
                    if (url.fileURL) {
                        paths.append(url.path!)
                    }
                }
                callback?.callWithArguments( [true, paths], completionHandler: nil)
            } else {
                callback?.callWithArguments([false, ""], completionHandler: nil)
            }
        })

    }


    func showSaveDialog(browserWindow: NKE_BrowserWindow?, options: Dictionary<String, AnyObject>?, callback: NKScriptValue?)-> Void {

        let fileManager = NSFileManager.defaultManager()

        let title: String = (options?["title"] as? String) ?? ""
        let defaultPath: String = (options?["defaultPath"] as? String) ?? ""
        let filters: [Dictionary<String, AnyObject>] = (options?["filters"] as? [Dictionary<String, AnyObject>]) ?? [Dictionary<String, AnyObject>]()
        let properties: [String] = (options?["properties"] as? [String]) ?? ["openFile"]

        let savePanel = NSSavePanel()
        savePanel.title = title


        if (defaultPath != "") {
            if (fileManager.fileExistsAtPath(defaultPath)) {
                savePanel.directoryURL = NSURL(string: (defaultPath as NSString).stringByDeletingLastPathComponent)
                savePanel.nameFieldStringValue = (defaultPath as NSString).lastPathComponent
            } else {
                savePanel.directoryURL = NSURL(fileURLWithPath: defaultPath)
            }
        }

        savePanel.canSelectHiddenExtension = true
        savePanel.canCreateDirectories = properties.contains("createDirectory")

        if (filters.isEmpty) {
            savePanel.allowsOtherFileTypes = true
        } else {

            let file_type_set: NSMutableSet = NSMutableSet()
            for var i = 0; i < filters.count; ++i {
                let filter: [String: AnyObject]! = filters[i]

                //  let name: String = filter["name"] as! String
                let extensions: [String] = filter["extensions"] as! [String]

                for var j = 0; j < extensions.count; ++j {
                    // If we meet a '*' file extension, we allow all the file types and no
                    // need to set the specified file types.
                    let ext = extensions[j]
                    if ext == "*" {
                        savePanel.allowsOtherFileTypes = true
                        return
                    }
                    file_type_set.addObject(ext)
                }
            }

            savePanel.allowedFileTypes = file_type_set.allObjects as? [String]
        }


        savePanel.beginWithCompletionHandler({(result: Int) in
            if(result == NSFileHandlingPanelOKButton) {
                 let url = savePanel.URL!
                callback?.callWithArguments([true, url.path!], completionHandler: nil)
            } else {
                callback?.callWithArguments([false, ""], completionHandler: nil)
            }
        })
    }

    func showMessageBox(browserWindow: NKE_BrowserWindow?, options: Dictionary<String, AnyObject>?, callback: NKScriptValue?) -> Void {
        let type: String = (options?["type"] as? String) ?? "none"
        let buttons: [String] = (options?["buttons"] as? [String]) ?? [String]()
    //    let title: String = (options?["title"] as? String) ?? ""
        let message: String = (options?["message"] as? String) ?? ""
        let detail: String = (options?["detail"] as? String) ?? ""
    //  let icon: NKNativeImage? = (options?["detail"] as? NKNativeImage)
    //  let cancelId: Int = (options?["cancelId"] as? String) ?? 0
    //    let noLink: Bool = (options?["cancelId"] as? Bool) ?? false

        let msgBox: NSAlert = NSAlert()
        msgBox.messageText = message
        msgBox.informativeText = detail
        switch type {
            case "info":
                msgBox.alertStyle = .InformationalAlertStyle
            case "error":
                msgBox.alertStyle = .CriticalAlertStyle
            case "warning":
                msgBox.alertStyle = .WarningAlertStyle
        default: break
        }

        for var i = 0; i < buttons.count; i++ {
            let buttonTitle: String
            if (buttons[i] == "") {
              buttonTitle = "(empty)"
            } else {
               buttonTitle  = buttons[i]
            }
            let button: NSButton = msgBox.addButtonWithTitle(buttonTitle)
            button.tag = i
        }

        let result: Int = msgBox.runModal()

        callback?.callWithArguments([result], completionHandler: nil)

    }

    func showErrorBox(title: String, content: String) -> Void {
        self.showMessageBox(nil, options: ["message": title, "detail": content, "type": "error"], callback: nil)
    }

}
