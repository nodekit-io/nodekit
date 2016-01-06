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
    var ScriptContentController: NKScriptContentController? {get set}
    func loadPlugin(object: AnyObject, namespace: String) -> NKScriptObject?
    func prepareForPlugin ()
    func evaluateJavaScript(javaScriptString: String,
        completionHandler: ((AnyObject?,
        NSError?) -> Void)?)
    func evaluateJavaScript(script: String) throws -> AnyObject?
    func evaluateJavaScript(script: String, error: NSErrorPointer) -> AnyObject?
    func injectJavaScript(script: NKScript) -> AnyObject
}