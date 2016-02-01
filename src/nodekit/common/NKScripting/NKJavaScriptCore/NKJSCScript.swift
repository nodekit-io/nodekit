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

import JavaScriptCore

class NKJSCScript {
    weak var context: NKScriptContext?
    let source: String
    let cleanup: String?
    let filename: String

    init(context: NKScriptContext, script: NKScriptSource) {
        self.context = context
        self.source = script.source
        self.cleanup = script.cleanup
        self.filename = script.filename
        inject()
    }

    deinit {
        eject()
    }

    private func inject() {
        guard let context = context else { return }

       (context as! JSContext).NKevaluateJavaScript(source, withSourceURL: NSURL(string: "file:///" + filename)!, completionHandler: nil)
        log("+E\(context.NKid) Injected \(filename) ")

    }

    private func eject() {
        guard let context = context else { return }

        if let cleanup = cleanup {
            context.NKevaluateJavaScript(cleanup, completionHandler: nil)
        }
    }
}
