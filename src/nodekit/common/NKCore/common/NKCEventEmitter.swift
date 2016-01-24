/*
* nodekit.io
*
* Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
* Portions Copyright (c) 2013 GitHub, Inc. under MIT License
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

/*
* NKEventEmitter:  A very basic type safe event emitter for Swift
*
* USAGE
* let emitter = NKEventEmitter()
* let subscription = emitter.on<String>("ready", { print("received ready event: \($0)") })
* emitter.emit<String>("ready", "now")
* subscription.remove()
*/

// Static variables (class variables not allowed for generics)
private var seq: Int = 1

protocol NKEventSubscription {
    func remove()
}

class NKEventSubscriptionGeneric<T>: NKEventSubscription {
    
   typealias NKHandler = (T) -> Void
    
    let handler: NKHandler
    
    private let emitter: NKEventEmitter
    private let eventType: String
    private let id: Int
    
    init(emitter: NKEventEmitter, eventType: String,  handler: NKHandler) {
        id = seq++
        self.eventType = eventType
        self.emitter = emitter
        self.handler = handler
    }
    
    func remove() {
        emitter.subscriptions[eventType]?.removeValueForKey(id)
    }
}

class NKEventEmitter {
    
    internal static var global: NKEventEmitter = NKEventEmitter()
    
    private var currentSubscription: NKEventSubscription?
    private var subscriptions: [String: [Int:NKEventSubscription]] = [:]
    
    func on<T>(eventType: String, handler: (T) -> Void) -> NKEventSubscription {
        var eventSubscriptions: [Int:NKEventSubscription]
        
        if let values = subscriptions[eventType] {
            eventSubscriptions = values
        } else {
            eventSubscriptions = [:]
        }
        
        let subscription = NKEventSubscriptionGeneric<T>(
            emitter: self,
            eventType: eventType,
            handler: handler
        )
        
        eventSubscriptions[subscription.id] = subscription
        subscriptions[eventType] = eventSubscriptions
        return subscription
    }
    
    func once<T>(event: String, handler: (T) -> Void) {
        on(event) { (data: T) -> Void in
            self.currentSubscription?.remove()
            handler(data)
        }
    }
    
    func removeAllListeners(eventType: String?) {
        if let eventType = eventType {
            subscriptions.removeValueForKey(eventType)
        } else {
            subscriptions.removeAll()
        }
    }
    
    func emit<T>(event: String, _ data: T) {
        if let subscriptions = subscriptions[event] {
            for (_, subscription) in subscriptions {
                currentSubscription = subscription
                (subscription as! NKEventSubscriptionGeneric<T>).handler(data)
            }
        }
    }
}


// Static variables (class variables not allowed for generics)
private var seq2: Int = 1

class NKSignalSubscription {
    
    typealias NKHandler = (String?) -> Void
    
    let handler: NKHandler
    
    private let emitter: NKSignalEmitter
    private let signal: String
    private let id: Int
    
    init(emitter: NKSignalEmitter, signal: String,  handler: NKHandler) {
        id = seq2++
        self.signal = signal
        self.emitter = emitter
        self.handler = handler
    }
    
    func remove() {
        emitter.subscriptions[signal]?.removeValueForKey(id)
    }
}

class NKSignalEmitter {
    
    internal static var global: NKSignalEmitter = NKSignalEmitter()
    
    private var currentSubscription: NKSignalSubscription?
    private var subscriptions: [String: [Int:NKSignalSubscription]] = [:]
    private var earlyTriggers: [String: String?] = [:]
    
    private func on(signal: String, handler: (String?) -> Void) -> NKSignalSubscription {
        var eventSubscriptions: [Int:NKSignalSubscription]
        
        if let values = subscriptions[signal] {
            eventSubscriptions = values
        } else {
            eventSubscriptions = [:]
        }
        
        let subscription = NKSignalSubscription(
            emitter: self,
            signal: signal,
            handler: handler
        )
        
        eventSubscriptions[subscription.id] = subscription
        subscriptions[signal] = eventSubscriptions
        return subscription
    }
    
    func waitFor(event: String, handler: (String?) -> Void) {
         let registerBlock = { () -> Void in
            if let data = self.earlyTriggers[event] {
              self.earlyTriggers.removeValueForKey(event)
                handler(data);
                return;
            }
            self.on(event) { (data: String?) -> Void in
                self.currentSubscription?.remove()
                handler(data)
            }
            
        }
        if (NSThread.isMainThread())
        {
            registerBlock()
        }
        else
        {
            dispatch_async(dispatch_get_main_queue(), registerBlock)
        }
    }
    
    func trigger(event: String, _ data: String?) {
        
        let triggerBlock = { () -> Void in
            if let subscriptions = self.subscriptions[event] {
                for (_, subscription) in subscriptions {
                    self.currentSubscription = subscription
                    subscription.handler(data)
                }
            } else
            {
                self.earlyTriggers[event] = data;
            }
        }
        if (NSThread.isMainThread())
        {
            triggerBlock()
        }
        else
        {
            dispatch_async(dispatch_get_main_queue(), triggerBlock)
        }
    }
}
