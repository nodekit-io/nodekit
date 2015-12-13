/*
 * nodekit.io
 *
 * Copyright (c) 2015 Domabo. All Rights Reserved.
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

#import "NKJavascriptBridge.h"
#import "NodeKitMac-swift.h"

static JSContext *_context = nil;
static stringViewer  _stringViewer = nil;
static urlNavigator _urlNavigator = nil;
static resizer _resizer = nil;

@implementation NKJavascriptBridge

+ (void)attachToContext:(JSContext *)context
    {
        _context = context;
        
        JSValue *process = [JSValue valueWithObject:@{
                                        @"platform": @"darwin",
                                        
                                        @"argv":     @[@"nodekit"],
                                    
                                        @"env":      NSProcessInfo.processInfo.environment,
                                                  @"execPath": NSBundle.mainBundle.resourcePath
                                                  } inContext:context];
        
   /*     context.exceptionHandler = ^(JSContext *ctx, JSValue *e) {
             NSLog(@"Context exception thrown: %@; sourceURL: %@, stack: %@", e, e[@"sourceURL"],[e valueForProperty:@"stack"]);
        };*/
        
        context[@"process"] = process;
        
        JSValue *fs = [JSValue valueWithObject:@{  @"platform": @"darwin"                                                         } inContext:context];
        
        JSValue *console = [JSValue valueWithObject:@{  @"platform": @"darwin"                                                         } inContext:context];
        
        JSValue *socket = [JSValue valueWithObject:@{  @"platform": @"darwin"                                                         } inContext:context];
        
        socket[@"createTcp"] = (JSValue*)^(){
            NKSocketTCP *server =[[NKSocketTCP alloc] init];
            
            return [server TCP];
        };
        
        socket[@"createUdp"] = (JSValue*)^(){
            NKSocketUDP *socket =[[NKSocketUDP alloc] init];
            
            return [socket UDP];
        };
        
        fs[@"getTempDirectory"] = (NSString*)^(){
            
            NSURL *fileURL = [NSURL fileURLWithPath:NSTemporaryDirectory()];
            return [fileURL path];
        };
        
        
        fs[@"stat"] = (NSDictionary*)^(NSString* path){
            return [NKFileSystem stat:path];
        };
        
        fs[@"mkdir"] = (NSNumber*)^(NSString* path){
            return [NKFileSystem mkdir:path];
        };
        
        
        fs[@"rmdir"] = (NSNumber*)^(NSString* path){
            return [NKFileSystem rmdir:path];
        };
        
        fs[@"move"] = (NSNumber*)^(NSString* path, NSString* path2){
            return [NKFileSystem move:path path2:path2];
        };
        
        fs[@"unlink"] = (NSNumber*)^(NSString* path){
            return [NKFileSystem unlink:path];
        };
        
        fs[@"statAsync"] = ^(NSString* path, JSValue *callBack){
            [NKFileSystem statAsync:path completionHandler:^(id error, id value){[callBack callWithArguments:@[error, value]];}];
        };
        
        /**
         * Get  file item
         * @param {string} path Path to directory.
         * @param {string} module Path of parent directory.
         * @return {String}  The item (or null if not found).
         */
        fs[@"getFullPath"] = ^(NSString* path, NSString* module){
            return [NKFileSystem getFullPath:path module:module];
        };
    
        /**
         * Get directory listing
         * @param {string} path Path to directory.
         * @param {Function(err, value)} callBack the callback handler where value 
         * @return {[string]} The array of item names (or error if not found or not a directory).
         */
        fs[@"getDirectoryAsync"] = ^(NSString* path, nodeCallBack callBack){
            [NKFileSystem getDirectoryAsync:path completionHandler:callBack];
        };
        
        /**
         * Get directory listing
         * @param {string} path Path to directory.
         * @param {Function(err, value)} callBack the callback handler where value
         * @return {[string]} The array of item names (or error if not found or not a directory).
         */
        fs[@"getDirectory"] = (NSArray*)^(NSString* path){
            return [NKFileSystem getDirectory:path ];
        };
        
        
        /* Get file source synchronously
        * @param {string} path Path to directory.
        * @return {String}  The file content
        */
        fs[@"getSource"] = (NSString*)^(NSString* path){
            return [NKFileSystem getSource:path];
        };
        
        /**
         * Get file content synchronously
         * @param {string} path Path to directory.
         * @param {Function(err, value)} callBack the callback handler where value
         * @return {string} The file content
         */
        fs[@"getContent"] = (NSString*)^(NSDictionary* storageItem){
           return [NKFileSystem getContent: storageItem];
        };
        
        
          /**
         * Get file content asynchronously
         * @param {string} path Path to directory.
         * @param {Function(err, value)} callBack the callback handler where value
         * @return {string} The file content
         */
        fs[@"getContentAsync"] = ^(NSDictionary* storageItem, JSValue* callBack){
            [NKFileSystem getContentAsync: storageItem  completionHandler:^(id error, id value){[callBack callWithArguments:@[error, value]];}];
        };
        
        
        /**
         * Get file content synchronously
         * @param {string} path Path to directory.
         * @param {string} content Content to write in base64
         * @return {bool} success
         */
        fs[@"writeContent"] = (NSNumber*)^(NSDictionary* storageItem, NSString* content){
            return [NKFileSystem writeContent:storageItem str:content];
        };
        
        
        /**
         * Get file content synchronously
         * @param {string} path Path to directory.
         * @param {string} content Content to write in base64
         * @param {Function(err, value)} callBack the callback handler where value
         * @return {bool} success
         */
        fs[@"writeContentAsync"] = ^(NSDictionary* storageItem, NSString* content,  JSValue* callBack){
            [NKFileSystem writeContentAsync:storageItem str:content completionHandler:^(id error, id value){[callBack callWithArguments:@[error, value]];}];
        };
        
        
        fs[@"eval"] = (JSValue*)^(NSString* script, NSString* filename){
            return [[JSContext currentContext] evaluateScript:script withSourceURL:[NSURL URLWithString:[@"file://" stringByAppendingString:filename]]];
        };
        
        console[@"log"] = ^(NSString* msg){
            NSLog(@"%@", msg);
        };
        
        console[@"nextTick"] = ^(JSValue *callBack){
            dispatch_async(dispatch_get_main_queue(), ^{
            [callBack callWithArguments:@[]];
                    });
        };
        
        console[@"timer"] = ^(){
            
            NKTimer *timer =[[NKTimer alloc] init];
            
            return [timer Timer];
        };
        
        console[@"setTimeout"] = ^(long delayInSeconds, JSValue *callBack){
            
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, delayInSeconds * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
                [callBack callWithArguments:@[]];
            });
            
        };
        
        console[@"loadString"] = ^(NSString* html, NSString* title){
            dispatch_async(dispatch_get_main_queue(), ^{
                [NKJavascriptBridge showString:html Title: title];
            });
        };
        
        console[@"navigateTo"] = ^(NSString* url, NSString* title){
            dispatch_async(dispatch_get_main_queue(), ^{
                [NKJavascriptBridge navigateTo: url Title: title];
            });
        };
        
        console[@"resize"] = ^(NSNumber* width, NSNumber* height){
            dispatch_async(dispatch_get_main_queue(), ^{
                [NKJavascriptBridge resize: width Height: height];
            });
        };
        
        
        JSValue *io_nodekit = [JSValue valueWithObject:@{
                                                         @"fs": fs,
                                                         @"console": console,
                                                         @"socket": socket,
                                                         } inContext:context];
        
        
        JSValue *io = [JSValue valueWithObject:@{@"nodekit": io_nodekit} inContext:context];
        
        context[@"io"] = io;

    }

+ (JSValue*)createNativeStream
{
    JSValue *tcp = [_context[@"io"][@"nodekit"][@"createNativeStream"] callWithArguments:@[]];
    return tcp;
}

+ (JSValue*)createNativeSocket
{
    JSValue *socket = [_context[@"io"][@"nodekit"][@"createNativeSocket"] callWithArguments:@[]];
    return socket;
}

+ (JSValue*)createTimer
{
       JSValue *timer = [JSValue valueWithObject:@{  @"platform": @"darwin"                                                         }  inContext:_context];
    return timer;
}

+ (void)registerStringViewer:(stringViewer)callBack
{
    _stringViewer = callBack;
}

+ (void)registerNavigator:(urlNavigator)callBack
{
    _urlNavigator = callBack;
}

+ (void)registerResizer:(resizer)callBack
{
    _resizer = callBack;
}

+ (void)showString:(NSString *)message  Title:(NSString *)title
{
    _stringViewer(message, title);
}

+ (void)navigateTo:(NSString *)uri Title:(NSString *)title
{
    _urlNavigator(uri, title);
}

+ (void)resize:(NSNumber *)width Height:(NSNumber *)height
{
    _resizer(width, height);
}

+ (JSValue*) createHttpContext
    {
        return [_context evaluateScript:@"io.nodekit.createEmptyContext();"];
    }

+ (JSContext *)currentContext
{
    return _context;
}

+ (void) setJavascriptClosure:(JSValue *)httpContext key:(NSString *)key  callBack:(closure)callBack
{
    httpContext[key] = ^(){ callBack(); };
}

+ (void) setWorkingDirectory:(NSString *)directory
{
    _context[@"process"][@"workingDirectory"] = directory;
}

+ (void) setNodePaths:(NSString *)directory
{
    _context[@"process"][@"env"][@"NODE_PATH"] = directory;
}

+ (void) cancelHttpContext:(JSValue *)httpContext
    {
        [_context[@"io"][@"nodekit"][@"cancelContext"] callWithArguments:@[httpContext]];
    }
    
+ (void) invokeHttpContext:(JSValue *)httpContext callBack:(closure)callBack
    {
        [_context[@"io"][@"nodekit"][@"invokeContext"] callWithArguments:@[httpContext, callBack]];
    }
    @end
