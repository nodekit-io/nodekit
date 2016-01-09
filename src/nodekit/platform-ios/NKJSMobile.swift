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
import WebKit
import JavaScriptCore
import UIKit

@objc protocol jse : JSExport {
       func alert(text: AnyObject?) -> String
}


@objc class HelloWorldMobile: NSObject, jse {
     func alert(text: AnyObject?) -> String  {
        dispatch_async(dispatch_get_main_queue()) {
            self._alert(title: text as? String, message: nil)
        }
        return "OK"
    }
    
    private func _alert(title title: String?, message: String?) {
        let alert = UIAlertView()
        alert.title = title!
        alert.message = message
        alert.addButtonWithTitle("Ok")
        alert.show()
    }
}

