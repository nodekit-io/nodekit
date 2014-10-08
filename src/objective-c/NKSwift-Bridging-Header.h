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

#import <JavaScriptCore/JavaScriptCore.h>
#import "NKURLFileDecode.h"
#import "NKJSBridge.h"
JSValue *getJSVinJSC(JSContext *ctx, NSString *key);
void setJSVinJSC(JSContext *ctx, NSString *key, id val);
void setJSV2inJSC(JSContext *ctx, NSString *key,NSString *key2, id val);
void setJSV3inJSC(JSContext *ctx, NSString *key,NSString *key2,NSString *key3, id val);
void setB0JSVinJSC(JSContext *ctx, NSString *key,id(^block)());
void setB1JSVinJSC(JSContext *ctx, NSString *key,id(^block)(id));
void setB2JSVinJSC(JSContext *ctx, NSString *key,id(^block)(id,id));

