/*
* nodekit.io
*
* Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
* Portions Copyright 2015 XWebView
* Portions Copyright (c) 2014 Intel Corporation.  All rights reserved.
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
import WebKit

class NKWKUserScript {
    weak var webView: WKWebView?
    var wkscript: WKUserScript?
    let cleanup: String?
    let filename: String

    init(context: WKWebView, script: NKScriptSource) {
        self.webView = context
        self.cleanup = script.cleanup
        self.filename = script.filename ?? ""

        self.wkscript = WKUserScript(source: script.source,
            injectionTime: WKUserScriptInjectionTime.AtDocumentStart,
            forMainFrameOnly: true)

        inject()
    }

    deinit {
        eject()
    }

    private func inject() {
        guard let webView = webView else { return }
        guard let wkscript = wkscript else {return }

        // add to userContentController
        webView.configuration.userContentController.addUserScript(wkscript)

        // inject into current context
        if webView.URL != nil {
            webView.evaluateJavaScript(wkscript.source) {
                if let error = $1 {
                    log("!E\(webView.NKid) Failed to inject script. \(error) on file \(self.filename) ")
                } else {
                   log("+E\(webView.NKid) Injected and executed \(self.filename) ")
                }
            }
        } else {
            log("+E\(webView.NKid) Injected \(self.filename) ")
        }
    }
    private func eject() {
        guard let webView = webView else { return }

        // remove from userContentController
        let controller = webView.configuration.userContentController
        let userScripts = controller.userScripts
        controller.removeAllUserScripts()
        userScripts.forEach {
            if $0 != self.wkscript { controller.addUserScript($0) }
        }

        if webView.URL != nil, let cleanup = cleanup {
            // clean up in current context
            webView.evaluateJavaScript(cleanup, completionHandler: nil)
        }

        log("+E\(webView.NKid) Removed script \(self.filename) ")

        self.wkscript = nil
    }
}
