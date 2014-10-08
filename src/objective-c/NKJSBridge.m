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

#import "NKJSBridge.h"
#import "NodeKitMac-swift.h"

static JSContext *_context = nil;
static stringViewer  _stringViewer = nil;
static urlNavigator _urlNavigator = nil;

@implementation NKJSBridge

+ (void)attachToContext:(JSContext *)context
    {
        _context = context;
        
        JSValue *process = [JSValue valueWithObject:@{
                                        @"platform": @"darwin",
                                        
                                        @"argv":     @[@"nodekit"],
                                        
                                        @"env":      NSProcessInfo.processInfo.environment,
                                                  @"execPath": NSBundle.mainBundle.executablePath
                                                  } inContext:context];
        
   /*     context.exceptionHandler = ^(JSContext *ctx, JSValue *e) {
             NSLog(@"Context exception thrown: %@; sourceURL: %@, stack: %@", e, e[@"sourceURL"],[e valueForProperty:@"stack"]);
        };*/
        
        context[@"process"] = process;
        
        JSValue *fs = [JSValue valueWithObject:@{  @"platform": @"darwin"                                                         } inContext:context];
        
        JSValue *console = [JSValue valueWithObject:@{  @"platform": @"darwin"                                                         } inContext:context];
        
        fs[@"stat"] = (NSDictionary*)^(NSString* path){
            return [NKFileSystem stat:path];
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
        fs[@"getDirectory"] = (NSArray*)^(NSString* path, nodeCallBack callBack){
            [NKFileSystem getDirectory:path ];
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
        fs[@"getContentAsync"] = ^(NSDictionary* storageItem, nodeCallBack callBack){
            [NKFileSystem getContentAsync: storageItem completionHandler:callBack];
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
        
        console[@"setTimeout"] = ^(long delayInSeconds, JSValue *callBack){
            
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, delayInSeconds * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
                [callBack callWithArguments:@[]];
            });
        
        };
        
        console[@"loadString"] = ^(NSString* html, NSString* title){
            dispatch_async(dispatch_get_main_queue(), ^{
                [NKJSBridge showString:html Title: title];
            });
        };
        
        console[@"navigateTo"] = ^(NSString* url, NSString* title){
            dispatch_async(dispatch_get_main_queue(), ^{
                [NKJSBridge navigateTo: url Title: title];
            });
        };
        
        JSValue *io_nodekit = [JSValue valueWithObject:@{
                                                         @"fs": fs,
                                                         @"console": console
                                                         } inContext:context];
        
        
        JSValue *io = [JSValue valueWithObject:@{@"nodekit": io_nodekit} inContext:context];
        
        context[@"io"] = io;

    }

+ (void)registerStringViewer:(stringViewer)callBack
{
    _stringViewer = callBack;
}

+ (void)registerNavigator:(urlNavigator)callBack
{
    _urlNavigator = callBack;
}

+ (void)showString:(NSString *)message  Title:(NSString *)title
{
    _stringViewer(message, title);
}

+ (void)navigateTo:(NSString *)uri Title:(NSString *)title
{
    _urlNavigator(uri, title);
}

+ (JSValue*) createOwinContext
    {
        return [_context evaluateScript:@"process.owinJS.createEmptyContext();"];
    }
    
+ (void) createResponseStream:(JSValue *)owinContext 
    {
        [_context[@"process"][@"owinJS"][@"createResponseStream"] callWithArguments:@[owinContext]];
    }
    
+ (void) cancelOwinContext:(JSValue *)owinContext
    {
        [_context[@"process"][@"owinJS"][@"cancelContext"] callWithArguments:@[owinContext]];
    }
    
+ (void) invokeAppFunc:(JSValue *)owinContext callBack:(nodeCallBack)callBack
    {
        [_context[@"process"][@"owinJS"][@"invokeContext"] callWithArguments:@[owinContext, callBack]];
    }
    @end
