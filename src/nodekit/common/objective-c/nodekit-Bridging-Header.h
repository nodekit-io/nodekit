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

#import <Foundation/Foundation.h>

//! Project version number for NodeKit.
FOUNDATION_EXPORT double NodeKitVersionNumber;

//! Project version string for NodeKit.
FOUNDATION_EXPORT const unsigned char NodeKitVersionString[];

// In this header, you should import all the public headers of your framework using statements like #import <NodeKit/PublicHeader.h>


#import "GCDAsyncSocket.h"
#import "GCDAsyncUdpSocket.h"

#define NSLog(FORMAT, ...) printf("%s\n", [[NSString stringWithFormat:FORMAT, ##__VA_ARGS__] UTF8String]);