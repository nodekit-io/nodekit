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

protocol NKE_BrowserWindowProtocol: NKScriptExport {

    // Creates a new BrowserWindow with native properties as set by the options.
    init(options: Dictionary<String, AnyObject>)

    // class functions
    static func fromId(id: Int) -> NKE_BrowserWindowProtocol?

    var id: Int {get}

    func destroy() -> Void
    func close() -> Void
    func focus() -> Void
    func isFocused() -> Bool
    func show() -> Void
    func showInactive() -> Void
    func hide() -> Void
    func isVisible() -> Bool
    func maximize() -> Void
    func unmaximize() -> Void
    func isMaximized() -> Bool
    func minimize() -> Void
    func isMinimized() -> Bool
    func setFullScreen(flag: Bool) -> Void
    func isFullScreen() -> Bool
    func setAspectRatio(aspectRatio: NSNumber, extraSize: [Int]) -> Void //OS X
    func setBounds(options: [NSObject : AnyObject]!) -> Void
    func getBounds() -> [NSObject : AnyObject]!
    func setSize(width: Int, height: Int) -> Void
    func getSize() -> [NSObject : AnyObject]!
    func setContentSize(width: Int, height: Int) -> Void
    func getContentSize() -> [Int]
    func setMinimumSize(width: Int, height: Int) -> Void
    func getMinimumSize() -> [Int]
    func setMaximumSize(width: Int, height: Int) -> Void
    func getMaximumSize() -> [Int]
    func setResizable(resizable: Bool) -> Void
    func isResizable() -> Bool
    func setAlwaysOnTop(flag: Bool) -> Void
    func isAlwaysOnTop() -> Bool
    func center() -> Void
    func setPosition(x: Int, y: Int) -> Void
    func getPosition() -> [Int]
    func setTitle(title: String) -> Void
    func getTitle() -> Void
    func flashFrame(flag: Bool) -> Void
    func setSkipTaskbar(skip: Bool) -> Void
    func setKiosk(flag: Bool) -> Void
    func isKiosk() -> Bool
    // func hookWindowMessage(message: Int32, callback: AnyObject) -> Void //WINDOWS
    // func isWindowMessageHooked(message: Int32) -> Void //WINDOWS
    // func unhookWindowMessage(message: Int32) -> Void //WINDOWS
    // func unhookAllWindowMessages() -> Void //WINDOWS
    func setRepresentedFilename(filename: String) -> Void //OS X
    func getRepresentedFilename() -> String //OS X
    func setDocumentEdited(edited: Bool) -> Void //OS X
    func isDocumentEdited() -> Bool //OS X
    func focusOnWebView() -> Void
    func blurWebView() -> Void
    func capturePage(rect: [NSObject : AnyObject]!, callback: AnyObject) -> Void
    func print(options: [NSObject : AnyObject]) -> Void
    func printToPDF(options: [NSObject : AnyObject], callback: AnyObject) -> Void
    func loadURL(url: String, options: [NSObject : AnyObject]) -> Void
    func reload() -> Void
    // func setMenu(menu) -> Void //LINUX WINDOWS
    func setProgressBar(progress: Double) -> Void
    // func setOverlayIcon(overlay, description) -> Void //WINDOWS 7+
    // func setThumbarButtons(buttons) -> Void //WINDOWS 7+
    func showDefinitionForSelection() -> Void //OS X
    func setAutoHideMenuBar(hide: Bool) -> Void
    func isMenuBarAutoHide() -> Bool
    func setMenuBarVisibility(visible: Bool) -> Void
    func isMenuBarVisible() -> Bool
    func setVisibleOnAllWorkspaces(visible: Bool) -> Void
    func isVisibleOnAllWorkspaces() -> Bool
    func setIgnoreMouseEvents(ignore: Bool) -> Void //OS X
}
