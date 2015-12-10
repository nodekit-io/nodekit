/*
* nodekit.io
*
* Copyright (c) 2015 Domabo. All Rights Reserved.
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

class NKAppDelegate: NSObject, NSApplicationDelegate {
    
    var mainWindowView = NKUIWebView(urlAddress: "http://internal/nodekit-splash/views/StartupSplash.html", title: "", width: 800, height: 600)
    
    var _nodekit : NKNodekit;
    
    let app: NSApplication
    
    init(app: NSApplication) {
        self.app = app
        _nodekit = NKNodekit();
    }
    
    func applicationDidFinishLaunching(aNotification: NSNotification) {
        _nodekit.run()
    }
    
    func applicationWillTerminate(aNotification: NSNotification) {
        print("EXIT")
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(sender: NSApplication) -> Bool {
        return true
    }
    
}

let app      = NSApplication.sharedApplication()
let delegate = NKAppDelegate(app: app)
app.delegate = delegate
let menu = NKMenu(app: app)
app.setActivationPolicy(.Regular)
atexit_b { app.setActivationPolicy(.Prohibited); return }
app.activateIgnoringOtherApps(true)
app.run()