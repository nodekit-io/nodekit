/*
 * nodekit.io
 *
 * Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
 * Portions Copyright (c) 2014 Intel Corporation.  All rights reserved.
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

@class NKChannel;

@protocol NKDelegate<NSObject>

@optional
- (void)invokeNativeMethod:(NSString *)name arguments:(NSArray *)args;
- (void)setNativeProperty:(NSString *)name value:(id)value;
- (NSString*)didGenerateStub:(NSString*)stub;
- (void)didBindExtension:(NKChannel*)channel instance:(NSInteger)instance;
- (void)didUnbindExtension;

@end
