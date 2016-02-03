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
 
 import Foundation

 typealias NKStringViewer = (msg: String, title: String) -> Void
 typealias NKUrlNavigator = (uri: String, title: String) -> Void

 class NKC_Console: NSObject, NKScriptExport {

    static var stringViewer: NKStringViewer? = nil
    static var urlNavigator: NKUrlNavigator? = nil

    class func attachTo(context: NKScriptContext) {
        context.NKloadPlugin(NKC_Console(), namespace: "io.nodekit.platform.console", options: [String:AnyObject]())
    }

    func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
            let url = NSBundle(forClass: NKC_Console.self).pathForResource("console", ofType: "js", inDirectory: "lib/platform")
            let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
            return "function loadplugin(){\n" + appjs! + "\n}\n" + stub + "\n" + "loadplugin();" + "\n"
        default:
            return stub
        }
    }

    func log(msg: AnyObject) -> Void {
        nklog(msg as? String ?? "INVALID LOG")
    }

    func error(msg: String) -> Void {
        nklog(msg)
    }

}
