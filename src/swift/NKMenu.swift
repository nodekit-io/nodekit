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

import Cocoa

class NKMenu {
    var app: NSApplication
    init(app: NSApplication) {
        self.app = app
        setup()
    }
    
    func setup () {
        let mainMenu = NSMenu(title: "AMainMenu")
        for (title, items) in tree() {
            let item = mainMenu.addItemWithTitle(title, action: nil, keyEquivalent:"")
            let menu = NSMenu(title: title)
            mainMenu.setSubmenu(menu, forItem: item)
            for item in items { menu.addItem(item) }
        }
        self.app.menu = mainMenu
    }
    
    func tree() -> Dictionary<String, [NSMenuItem]>{
        return [
            "Edit": [
                NSMenuItem(title: "Copy", action: nil, keyEquivalent:"c"),
                NSMenuItem(title: "Paste", action: nil, keyEquivalent:"p")
            ],
            "Apple": [
                NSMenuItem(title: "About", action: "orderFrontStandardAboutPanel:", keyEquivalent:""),
                NSMenuItem.separatorItem(),
                NSMenuItem(title: "Hide",  action: "hide:", keyEquivalent:"h"),
                // NSMenuItem(title: "Hide Others",  action: "hideOtherApplications:", keyEquivalent:"h"),
                NSMenuItem(title: "Quit",  action: "terminate:", keyEquivalent:"q"),
            ],
        ]
    }
}

