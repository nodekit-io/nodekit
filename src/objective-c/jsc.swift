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

import JavaScriptCore

typealias ID = AnyObject!
extension JSContext {
    func fetch(key:NSString)->JSValue {
        return getJSVinJSC(self, key)
    }
    func store(key:NSString, _ val:ID) {
        setJSVinJSC(self, key, val)
    }
    func store(key:NSString,key2:NSString, _ val:ID) {
        setJSV2inJSC(self, key, key2, val)
    }
    func store(key:NSString,key2:NSString, key3:NSString, _ val:ID) {
        setJSV3inJSC(self, key, key2, key3, val)
    }
    func store2(key:NSString, _ blk:()->ID) {
        setB0JSVinJSC(self, key, blk)
    }
    func store3(key:NSString, _ blk:(ID)->ID) {
        setB1JSVinJSC(self, key, blk)
    }
    func store4(key:NSString, _ blk:(ID,ID)->ID) {
        setB2JSVinJSC(self, key, blk)
    }
}