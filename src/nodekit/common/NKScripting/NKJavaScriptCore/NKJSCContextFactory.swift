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
import JavaScriptCore

extension NKJSContextFactory {
    
    func createContextJavaScriptCore(options: [String: AnyObject] = Dictionary<String, AnyObject>(), delegate cb: NKScriptContextDelegate) -> Int
    {
        let id = NKJSContextFactory.sequenceNumber
        
       dispatch_async(NKScriptChannel.defaultQueue) {
            log("+Starting NodeKit JavaScriptCore JavaScript Engine E\(id)")
            var item = Dictionary<String, AnyObject>()
            NKJSContextFactory._contexts[id] = item;
            
             let vm = JSVirtualMachine()
           let context = JSContext(virtualMachine: vm)
            
          //  Store JVM and JSC to retain
            item["JSVirtualMachine"] = vm
            item["context"] = context
            
            objc_setAssociatedObject(context, unsafeAddressOf(NKJSContextId), id, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
            
            cb.NKScriptEngineLoaded(context)
            cb.NKApplicationReady(context.NKid, context: context)
         }
        
        return id;
    }
 }