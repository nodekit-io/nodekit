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

    // global EventEmitter that is actually a signal emitter (retains early triggers without subscriptions until once is called)
    internal static var global: NKEventEmitter = NKSignalEmitter()

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

private class NKSignalEmitter: NKEventEmitter {
    
    private var earlyTriggers: [String: Any] = [:]
    
    override func once<T>(event: String, handler: (T) -> Void) {
        let registerBlock = { () -> Void in
            if let data = self.earlyTriggers[event] {
                self.earlyTriggers.removeValueForKey(event)
                handler(data as! T)
                return
            }
            self.on(event) { (data: T) -> Void in
                self.currentSubscription?.remove()
                handler(data)
            }
        }
        
        if (NSThread.isMainThread()) {
            registerBlock()
        } else {
            dispatch_async(dispatch_get_main_queue(), registerBlock)
        }
    }
    
    override func emit<T>(event: String, _ data: T) {
        let triggerBlock = { () -> Void in
            if let subscriptions = self.subscriptions[event] {
                for (_, subscription) in subscriptions {
                     (subscription as! NKEventSubscriptionGeneric<T>).handler(data)
                }
            } else {
                self.earlyTriggers[event] = data
            }
        }
        if (NSThread.isMainThread()) {
            triggerBlock()
        } else {
            dispatch_async(dispatch_get_main_queue(), triggerBlock)
        }
    }
}