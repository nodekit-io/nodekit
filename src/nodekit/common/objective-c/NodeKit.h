//
//  NodeKit.h
//  NodeKit
//
//  Created by Guy on 12/14/15.
//  Copyright © 2015 nodekit.io. All rights reserved.
//

#import <Foundation/Foundation.h>

//! Project version number for NodeKit.
FOUNDATION_EXPORT double NodeKitVersionNumber;

//! Project version string for NodeKit.
FOUNDATION_EXPORT const unsigned char NodeKitVersionString[];

// In this header, you should import all the public headers of your framework using statements like #import <NodeKit/PublicHeader.h>


#import "GCDAsyncSocket.h"
#import "GCDAsyncUdpSocket.h"

#define NSLog(FORMAT, ...) printf("%s\n", [[NSString stringWithFormat:FORMAT, ##__VA_ARGS__] UTF8String]);