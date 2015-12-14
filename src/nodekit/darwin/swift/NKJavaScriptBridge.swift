//
//  NKJavaScriptBridge.swift
//  nodekit
//
//  Created by Guy on 12/13/15.
//  Copyright © 2015 limerun. All rights reserved.
//

import Foundation
import JavaScriptCore

var bridgeContext: JSContext? = nil
var stringViewer: NKStringViewer? = nil
var urlNavigator: NKUrlNavigator? = nil

class NKJavascriptBridge: NSObject {
    
    
    class func attachToContext(context: JSContext) {
        
        let PLATFORM: String = "ios";  // or "darwin"
        
        bridgeContext = context
        
        var _process: Dictionary<String, AnyObject> = Dictionary<String, AnyObject>()
        _process["platform"] = PLATFORM
        _process["argv"] = ["nodekit"]
        _process["env"] = NSProcessInfo.processInfo().environment
        _process["execPath"] = NSBundle.mainBundle().resourcePath!
        
        let process: JSValue = JSValue(object: _process, inContext: context)
        
        context.exceptionHandler = {(ctx: JSContext!, e: JSValue!) -> Void in
            NSLog("Context exception thrown: %@; sourceURL: %@, stack: %@", e, e.valueForProperty("sourceURL"), e.valueForProperty("stack"))
        }
        
        context.setObject(process, forKeyedSubscript: "process")
        
        let console: JSValue = JSValue(object:["platform": PLATFORM], inContext: context)
        let fs: JSValue = JSValue(object:["platform": PLATFORM], inContext: context)
        let socket: JSValue = JSValue(object:["platform": PLATFORM], inContext: context)
        
        
        let socket_createTcp : @convention(block) () -> JSValue = {
            let server: NKSocketTCP = NKSocketTCP()
            return server.TCP()
        }
        
        socket.setObject(unsafeBitCast(socket_createTcp, AnyObject.self), forKeyedSubscript: "createTcp")
        
        let socket_createUdp : @convention(block) () -> JSValue = {
            let socket: NKSocketUDP = NKSocketUDP()
            return socket.UDP()
        }
        
        socket.setObject(unsafeBitCast(socket_createUdp, AnyObject.self), forKeyedSubscript: "createUdp")
        
        
        
        let fs_getTempDirectory: @convention(block) () -> String? = {
               let fileURL: NSURL = NSURL.fileURLWithPath(NSTemporaryDirectory())
                return fileURL.path
            }
        
        fs.setObject(unsafeBitCast(fs_getTempDirectory, AnyObject.self), forKeyedSubscript: "getTempDirectory")
        
        
        
        let fs_stat: @convention(block) String -> Dictionary<String, NSObject>? = { path in
            return NKFileSystem.stat(path)
        }
        
        fs.setObject(unsafeBitCast(fs_stat, AnyObject.self), forKeyedSubscript: "stat")
        
        let fs_statAsync: @convention(block) (String, JSValue) -> Void = { path, callBack in
            
            let done: NKNodeCallBack = {error, value in
                  callBack.callWithArguments([error, value]);
            };
            
            NKFileSystem.statAsync(path, completionHandler: done);
        
        }
        
        fs.setObject(unsafeBitCast(fs_statAsync, AnyObject.self), forKeyedSubscript: "statAsync")
        
        
        
        let fs_mkdir: @convention(block) String -> Bool = { path in
            return NKFileSystem.mkdir(path)
        }
        
        
        fs.setObject(unsafeBitCast(fs_mkdir, AnyObject.self), forKeyedSubscript: "mkdir")
        
        let fs_rmdir: @convention(block) String -> Bool = { path in
            return NKFileSystem.rmdir(path)
        }
        
        
        fs.setObject(unsafeBitCast(fs_rmdir, AnyObject.self), forKeyedSubscript: "rmdir")
      
        
       let fs_move: @convention(block) (String, String) -> Bool = { path, path2 in
             return NKFileSystem.move(path, path2: path2)
        }
        
        fs.setObject(unsafeBitCast(fs_move, AnyObject.self), forKeyedSubscript: "move")
        
        
        let fs_unlink: @convention(block) String -> Bool = { path in
            return NKFileSystem.unlink(path)
        }
        
        fs.setObject(unsafeBitCast(fs_unlink, AnyObject.self), forKeyedSubscript: "unlink")
        
        
        
        /**
         * Get  file item
         * @param {string} path Path to directory.
         * @param {string} module Path of parent directory.
         * @return {String}  The item (or null if not found).
         */
        let fs_getFullPath: @convention(block) (String, String) -> String = { path, module in
            return NKFileSystem.getFullPath(path, module: module)
        }
        
        fs.setObject(unsafeBitCast(fs_getFullPath, AnyObject.self), forKeyedSubscript: "getFullPath")
        
        
        
        /**
        * Get directory listing
        * @param {string} path Path to directory.
        * @param {Function(err, value)} callBack the callback handler where value
        * @return {[string]} The array of item names (or error if not found or not a directory).
        */
        let fs_getgetDirectoryAsync: @convention(block) (String, NKNodeCallBack) -> Void = { path, callBack in
            return NKFileSystem.getDirectoryAsync(path, completionHandler: callBack)
        }
        
        fs.setObject(unsafeBitCast(fs_getgetDirectoryAsync, AnyObject.self), forKeyedSubscript: "getDirectoryAsync")
        

        /**
        * Get directory listing
        * @param {string} path Path to directory.
        * @param {Function(err, value)} callBack the callback handler where value
        * @return {[string]} The array of item names (or error if not found or not a directory).
        */
        let fs_getDirectory: @convention(block) (String) -> NSArray = { path in
            return NKFileSystem.getDirectory(path)
        }
        
        fs.setObject(unsafeBitCast(fs_getDirectory, AnyObject.self), forKeyedSubscript: "getDirectory")
        
        
        /* Get file source synchronously
        * @param {string} path Path to directory.
        * @return {String}  The file content
        */
        let fs_getSource: @convention(block) (String) -> String = { path in
             return NKFileSystem.getSource(path)
        }
        
        fs.setObject(unsafeBitCast(fs_getSource, AnyObject.self), forKeyedSubscript: "getSource")
        
         /**
        * Get file content synchronously
        * @param {string} path Path to directory.
        * @param {Function(err, value)} callBack the callback handler where value
        * @return {string} The file content
        */
        let fs_getContent: @convention(block)  NSDictionary! -> NSString = { storageItem in
            return NKFileSystem.getContent(storageItem)
        }
        
        fs.setObject(unsafeBitCast(fs_getContent, AnyObject.self), forKeyedSubscript: "getContent")
        
        
        /**
        * Get file content asynchronously
        * @param {string} path Path to directory.
        * @param {Function(err, value)} callBack the callback handler where value
        * @return {string} The file content
        */
        let fs_getContentAsync: @convention(block)  (NSDictionary!, JSValue) -> Void = { storageItem, callBack in
            let done: NKNodeCallBack = {error, value in
                callBack.callWithArguments([error, value]);
            };
            
            NKFileSystem.getContentAsync(storageItem, completionHandler: done)
        }
        
        fs.setObject(unsafeBitCast(fs_getContentAsync, AnyObject.self), forKeyedSubscript: "getContentAsync")
        
        /**
        * Get file content synchronously
        * @param {string} path Path to directory.
        * @param {string} content Content to write in base64
        * @return {bool} success
        */
        let fs_writeContent: @convention(block)  (NSDictionary!, String!) -> Bool = { storageItem, content in
            
            return NKFileSystem.writeContent(storageItem, str: content)
        }
        
        fs.setObject(unsafeBitCast(fs_writeContent, AnyObject.self), forKeyedSubscript: "writeContent")
        
        
        
        /**
        * Get file content synchronously
        * @param {string} path Path to directory.
        * @param {string} content Content to write in base64
        * @param {Function(err, value)} callBack the callback handler where value
        * @return {bool} success
        */
        let fs_writeContentAsync: @convention(block)  (NSDictionary!, String!, JSValue) -> Void = { storageItem, content, callBack in
            let done: NKNodeCallBack = {error, value in
                callBack.callWithArguments([error, value]);
            };
            
            NKFileSystem.writeContentAsync(storageItem, str: content, completionHandler: done)
        }
        
        fs.setObject(unsafeBitCast(fs_writeContentAsync, AnyObject.self), forKeyedSubscript: "writeContentAsync")
        
        
        let fs_eval: @convention(block)  (String!, String!) -> JSValue! = { script, filename in
          return JSContext.currentContext().evaluateScript(script, withSourceURL:  NSURL(string: "file://".stringByAppendingString(filename)))
        
        }
        
        fs.setObject(unsafeBitCast(fs_eval, AnyObject.self), forKeyedSubscript: "eval")
        
        let console_log: @convention(block)  (String) -> Void = { msg in
           NSLog("%@", msg)
        }
        
        console.setObject(unsafeBitCast(console_log, AnyObject.self), forKeyedSubscript: "log")
        
        
        
        
        
        let console_nextTick: @convention(block)  (JSValue) -> Void = { callBack in
            dispatch_async(dispatch_get_main_queue(), {() -> Void in
                callBack.callWithArguments([])
            })

        }
        
        console.setObject(unsafeBitCast(console_nextTick, AnyObject.self), forKeyedSubscript: "nextTick")
        
        let console_timer: @convention(block)  () -> JSValue! = {
            let timer: NKTimer = NKTimer()
            return timer.Timer()
        }
        
        console.setObject(unsafeBitCast(console_timer, AnyObject.self), forKeyedSubscript: "timer")
        
    
        
        let console_setTimeout: @convention(block)  (Int64, JSValue) -> Void = { delayInSeconds, callBack in
        
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, delayInSeconds * Int64(NSEC_PER_SEC) ), dispatch_get_main_queue(), {() -> Void in
                callBack.callWithArguments([])
            })
            
        }
        
        console.setObject(unsafeBitCast(console_setTimeout, AnyObject.self), forKeyedSubscript: "setTimeout")

        let console_loadString: @convention(block)  (String, String) -> Void = { html, title in
            dispatch_async(dispatch_get_main_queue(), {() -> Void in
                NKJavascriptBridge.showString(html, Title: title)
            })
        }
        
        console.setObject(unsafeBitCast(console_loadString, AnyObject.self), forKeyedSubscript: "loadString")
        
        let console_navigateTo: @convention(block)  (String, String) -> Void = { url, title in
            dispatch_async(dispatch_get_main_queue(), {() -> Void in
                NKJavascriptBridge.navigateTo(url, Title: title)
            })
        }
        
        console.setObject(unsafeBitCast(console_navigateTo, AnyObject.self), forKeyedSubscript: "navigateTo")
        
        let console_resize: @convention(block)  (NSNumber, NSNumber) -> Void = { width, height in
      
        }
        
        console.setObject(unsafeBitCast(console_resize, AnyObject.self), forKeyedSubscript: "resize")
        
        
        let io_nodekit: JSValue = JSValue(object: Dictionary<String, AnyObject>(), inContext: context)
        
        io_nodekit.setObject(fs, forKeyedSubscript: "fs");
        io_nodekit.setObject(console, forKeyedSubscript: "console");
        io_nodekit.setObject(socket, forKeyedSubscript: "socket");
        
        let io: JSValue = JSValue(object: Dictionary<String, AnyObject>(), inContext: context)
        
        io.setObject(io_nodekit, forKeyedSubscript: "nodekit");
        
        context.setObject(io, forKeyedSubscript: "io");
        
    }
    
    class func createNativeStream() -> JSValue {
        
        let jsCreateNativeStream: JSValue = bridgeContext!.objectForKeyedSubscript("io").objectForKeyedSubscript("nodekit").objectForKeyedSubscript("createNativeStream")
        
        let tcp: JSValue = jsCreateNativeStream.callWithArguments([])
        return tcp
    }
    
    class func createNativeSocket() -> JSValue {
        
        let jsCreateNativeSocket: JSValue = bridgeContext!.objectForKeyedSubscript("io").objectForKeyedSubscript("nodekit").objectForKeyedSubscript("createNativeSocket")
        
        let socket: JSValue = jsCreateNativeSocket.callWithArguments([])
        return socket

    }
    
    class func createTimer() -> JSValue {
        
        let timer: JSValue = JSValue(object: ["timer": "darwin"], inContext: bridgeContext)
        return timer
    }
    
    class func registerStringViewer(callBack: NKStringViewer) {
        stringViewer = callBack
    }
    
    class func registerNavigator(callBack: NKUrlNavigator) {
        urlNavigator = callBack
    }
    
    class func showString(message: String, Title title: String) {
        stringViewer!(msg: message, title: title)
    }
    
    class func navigateTo(uri: String, Title title: String) {
        urlNavigator!(uri: uri, title: title)
    }
    
    
    class func createHttpContext() -> JSValue {
        return bridgeContext!.evaluateScript("io.nodekit.createEmptyContext();")
    }
    
    class func currentContext() -> JSContext {
        return bridgeContext!
    }
    
    class func setJavascriptClosure(httpContext: JSValue, key: String, callBack: NKClosure) {
        
        let key_block: @convention(block)  () -> Void = {
           callBack()
        }
        
         httpContext.setObject(unsafeBitCast(key_block, AnyObject.self), forKeyedSubscript: key)
    }
    
    class func setWorkingDirectory(directory: String) {
        let jsProcess: JSValue = bridgeContext!.objectForKeyedSubscript("process")
        jsProcess.setObject(directory, forKeyedSubscript: "workingDirectory")
    }
    
    class func setNodePaths(directory: String) {
        let jsEnv: JSValue = bridgeContext!.objectForKeyedSubscript("process").objectForKeyedSubscript("env")
        jsEnv.setObject(directory, forKeyedSubscript: "NODE_PATH")
    }
    
    class func cancelHttpContext(httpContext: JSValue) {
        let jsCancelContext: JSValue = bridgeContext!.objectForKeyedSubscript("io").objectForKeyedSubscript("nodekit").objectForKeyedSubscript("cancelContext")
        
        jsCancelContext.callWithArguments([httpContext])
    }
    
    class func invokeHttpContext(httpContext: JSValue, callBack: NKClosure) {
        let jsInvokeContext: JSValue = bridgeContext!.objectForKeyedSubscript("io").objectForKeyedSubscript("nodekit").objectForKeyedSubscript("invokeContext")
        
        let done: @convention(block)  () -> Void = {
            callBack()
        }
        
        jsInvokeContext.callWithArguments([httpContext, unsafeBitCast(done, AnyObject.self)])
    }
}

