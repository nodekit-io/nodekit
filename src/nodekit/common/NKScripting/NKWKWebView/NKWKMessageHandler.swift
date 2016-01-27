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

public class NKWKMessageHandler: NSObject, WKScriptMessageHandler {

    private var name: String
    private var messageHandler: NKScriptMessageHandler
    private weak var context: NKScriptContext?

    init(name: String, messageHandler: NKScriptMessageHandler, context: NKScriptContext) {
        self.messageHandler = messageHandler
        self.name = name
        self.context = context
    }

   public func userContentController(userContentController: WKUserContentController, didReceiveScriptMessage message: WKScriptMessage) {
        // A workaround for crash when postMessage(undefined)
        guard unsafeBitCast(message.body, COpaquePointer.self) != nil else { return }

     if let body = message.body as? [String: AnyObject], let _ = body["$nk.sync"] as? Bool, let id = body["$id"] as? String {
            let result = messageHandler.userContentControllerSync(didReceiveScriptMessage: NKScriptMessage(name: name, body: message.body))
            let resultJSON = context?.NKserialize(result)
            NKEventEmitter.global.emit(id, resultJSON)
            return
        }

        messageHandler.userContentController(didReceiveScriptMessage: NKScriptMessage(name: name, body: message.body))
    }
}
