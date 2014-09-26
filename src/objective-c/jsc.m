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

JSValue *getJSVinJSC(JSContext *ctx, NSString *key) {
    return ctx[key];
}
void setJSVinJSC(JSContext *ctx, NSString *key, id val) {
    ctx[key] = val;
}

void setJSV2inJSC(JSContext *ctx, NSString *key,  NSString *key2, id val) {
    ctx[key][key2] = val;
}

void setJSV3inJSC(JSContext *ctx, NSString *key,  NSString *key2, NSString *key3, id val) {
    ctx[key][key2][key3] = val;
}


void setB0JSVinJSC(JSContext *ctx, NSString *key,
                   id (^block)()) {
    ctx[key] = block;
}
void setB1JSVinJSC(JSContext *ctx, NSString *key,
                   id (^block)(id)) {
    ctx[key] = block;
}
void setB2JSVinJSC(JSContext *ctx, NSString *key,
                   id (^block)(id, id)) {
    ctx[key] = block;
}