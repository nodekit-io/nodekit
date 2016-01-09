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

import Cocoa

class NKNSAppDelegate: NSObject, NSApplicationDelegate {
    
    var mainWindowView = NKUIWebView(urlAddress: "http://internal/splash/views/StartupSplash.html", title: "", width: 800, height: 600)
    
    var _nodekit : NKNodeKit;
    
    let app: NSApplication
    
    init(app: NSApplication) {
        self.app = app
        _nodekit = NKNodeKit();
    }
    
    func applicationDidFinishLaunching(aNotification: NSNotification) {
        _nodekit.run()
    }
    
    func applicationWillTerminate(aNotification: NSNotification) {
        log("EXIT")
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(sender: NSApplication) -> Bool {
        return true
    }
    
}
