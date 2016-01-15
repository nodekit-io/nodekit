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

public protocol NKScriptContext: class {
    var NKid: Int { get }
    func NKloadPlugin(object: AnyObject, namespace: String, options: Dictionary<String, AnyObject>) -> AnyObject?
    func NKevaluateJavaScript(javaScriptString: String,
        completionHandler: ((AnyObject?,NSError?) -> Void)?)
    func NKevaluateJavaScript(script: String) throws -> AnyObject?
    func NKevaluateJavaScript(script: String, error: NSErrorPointer) -> AnyObject?
    
    func NKinjectJavaScript(script: NKScriptSource) -> AnyObject?
}

public protocol NKScriptContextHost: class {
    var NKid: Int { get }
    func NKgetScriptContext(id: Int, options: [String: AnyObject], delegate cb: NKScriptContextDelegate) -> Void
}

internal protocol NKScriptContentController: class {
    func NKaddScriptMessageHandler (scriptMessageHandler: NKScriptMessageHandler, name: String)
    func NKremoveScriptMessageHandlerForName (name: String)
}

public protocol NKScriptContextDelegate: class {
    func NKScriptEngineLoaded(context: NKScriptContext) -> Void
    func NKApplicationReady(id: Int, context: NKScriptContext?) -> Void
}

public class NKJSContextId {}