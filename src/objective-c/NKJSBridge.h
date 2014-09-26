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

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>

typedef void (^nodeCallBack)(id error, id value);
typedef void (^stringViewer)(NSString *msg, NSString *title);
typedef void (^urlNavigator)(NSString *uri, NSString *title);

@interface NKJSBridge: NSObject
+ (void)attachToContext:(JSContext *)context;
+ (JSValue*) createOwinContext;
+ (void) invokeAppFunc:(JSValue *)owinContext callBack:(nodeCallBack)callBack;
+ (void) cancelOwinContext:(JSValue *)owinContext;
+ (void) createResponseStream:(JSValue *)owinContext;
+ (void)registerStringViewer:(stringViewer)callBack;
+ (void)registerNavigator:(urlNavigator)callBack;
+ (void)showString:(NSString *)message  Title:(NSString *)title;
+ (void)navigateTo:(NSString *)uri Title:(NSString *)title;
@end