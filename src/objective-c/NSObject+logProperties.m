//
//  NSObject+logProperties.m
//  NodeKitMac
//
//  Created by Guy Barnard on 9/16/14.
//  Copyright (c) 2014 nodekit.io. All rights reserved.
//

#import "NSObject+logProperties.h"
#import <objc/runtime.h>

@implementation NSObject (logProperties)

- (void) logProperties {
    
    NSLog(@"----------------------------------------------- Properties for object %@", self);
    
    @autoreleasepool {
        unsigned int numberOfProperties = 0;
        objc_property_t *propertyArray = class_copyPropertyList([self class], &numberOfProperties);
        for (NSUInteger i = 0; i < numberOfProperties; i++) {
            objc_property_t property = propertyArray[i];
            NSString *name = [[NSString alloc] initWithUTF8String:property_getName(property)];
            NSLog(@"Property %@ Value: %@", name, [self valueForKey:name]);
        }
        free(propertyArray);
    }
    NSLog(@"-----------------------------------------------");
}

@end