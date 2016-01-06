// Copyright (c) 2014 Intel Corporation. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif

#import "NKExtension.h"

#import "NKInvocation.h"
#import "nodekit_sample-Swift.h"

@interface NKExtension()

@property(nonatomic, weak) NKChannel* channel;
@property(nonatomic, assign) NSInteger instance;

- (id)objectForKeyedSubscript:(NSString *)key;
- (void)setObject:(id)obj forKeyedSubscript:(id <NSCopying>)key;

@end

@implementation NKExtension {
    BOOL _sync;
}

- (NSString*)namespace {
    return self.channel ? self.channel.namespace : nil;
}

- (void)invokeNativeMethod:(NSString *)name arguments:(NSArray *)args {
    SEL selector = [self.channel.mirror getMethod:name];
    if (!selector) {
        NSLog(@"ERROR: Method '%@' is undefined in class '%@'.", name, NSStringFromClass(self.class));
        return;
    }

    NSValue *result = [NKInvocation call:self selector:selector arguments:args];
    if (result.isNumber && ((NSNumber *)result).boolValue == YES)
        [self releaseArguments:((NSNumber *)args[0]).unsignedIntValue];
}

- (void)setNativeProperty:(NSString *)name value:(id)value {
    SEL selector = [self.channel.mirror getSetter:name];
    if (!selector) {
        if ([self.channel.mirror hasProperty:name]){
            NSLog(@"ERROR: Property '%@' is readonly.", name);
            return;
        }
        
        NSLog(@"ERROR: Property '%@' is undefined in class '%@'.", name, NSStringFromClass(self.class));
        return;
    }
    
    _sync = NO;
    [NKInvocation call:self selector:selector, value];
    _sync = YES;
}

- (NSString*)didGenerateStub:(NSString*)stub {
    NSBundle* bundle = [NSBundle bundleForClass:self.class];
    NSString* className = NSStringFromClass(self.class);
    if (className.pathExtension.length) {
        className = className.pathExtension;
    }

    NSString* fileToReplace = [NSString stringWithFormat:@"%@-replace", className];
    NSString* replacePath = [bundle pathForResource:fileToReplace ofType:@"js"];
    NSString* fileToAppend = [NSString stringWithFormat:@"%@-append", className];
    NSString* appendPath = [bundle pathForResource:fileToAppend ofType:@"js"];
    if (replacePath) {
        NSString* content = [NSString stringWithContentsOfFile:replacePath encoding:NSUTF8StringEncoding error:nil];
        if (content)
            return content;
    } else if (appendPath) {
        NSString* content = [NSString stringWithContentsOfFile:appendPath encoding:NSUTF8StringEncoding error:nil];
        if (content)
            return [stub stringByAppendingString:content];
    }

    return stub;
}

- (void)didBindExtension:(NKChannel*)channel instance:(NSInteger)instance {
    assert(!self.channel);
    self.channel = channel;
    self.instance = instance;

    NSEnumerator* enumerator = [self.channel.mirror.allProperties objectEnumerator];
    NSString *name;
    while (name = [enumerator nextObject]) {
        NSString *key = NSStringFromSelector([self.channel.mirror getGetter:name]);
        [self addObserver:self forKeyPath:key options:NSKeyValueObservingOptionNew context:(__bridge void *)self];
        if (instance)
            [self setJavaScriptProperty:name value:self[name]];
    }
    _sync = YES;
}

- (void)didUnbindExtension {
    NSEnumerator* enumerator = [self.channel.mirror.allProperties objectEnumerator];
    id name;
    while (name = [enumerator nextObject]) {
        NSString *key = NSStringFromSelector([self.channel.mirror getGetter:name]);
        [self removeObserver:self forKeyPath:key context:(__bridge void *)self];
    }

    self.channel = nil;
    self.instance = 0;
}

- (void)setJavaScriptProperty:(NSString*)name value:(id)value {
    NSString* json = nil;
    if (value == nil || value == NSNull.null) {
        json = @"null";
    } else if ([value isKindOfClass:NSString.class]) {
        json = [NSString stringWithFormat:@"'%@'", (NSString*)value];
    } else if ([value isKindOfClass:NSNumber.class]) {
        json = [NSString stringWithFormat:@"%@", value];
    } else {
        NSError* error = nil;
        NSData* data = [NSJSONSerialization dataWithJSONObject:value options:NSJSONWritingPrettyPrinted error:&error];
        if (!data)
            [NSException exceptionWithName:@"InternalError" reason:@"InternalError" userInfo:error.userInfo];
        json = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    }
    NSString *script = [NSString stringWithFormat:@"%@%@.properties['%@'] = %@;", self.namespace,
            self.instance ? [NSString stringWithFormat:@"[%zd]", self.instance] : @"", name, json];
    [self evaluateJavaScript:script];
}

- (void)invokeCallback:(UInt32)callbackId key:(NSString*)key, ... {
    NSMutableArray *args = [[NSMutableArray alloc] init];
    va_list ap;
    id arg;
    va_start(ap, key);
    while ((arg = va_arg(ap, id)) != nil) {
        [args addObject:arg];
    }
    va_end(ap);
    [self invokeJavaScript:@".invokeCallback", @(callbackId), key ?: NSNull.null, args, nil];
}

- (void)invokeCallback:(UInt32)callbackId key:(NSString*)key arguments:(NSArray*)arguments {
    [self invokeJavaScript:@".invokeCallback", @(callbackId), key ?: NSNull.null, arguments, nil];
}

- (void)releaseArguments:(UInt32)callId {
    [self invokeJavaScript:@".releaseArguments", @(callId), nil];
}

- (void)invokeJavaScript:(NSString*)function, ... {
    NSMutableArray *args = [[NSMutableArray alloc] init];
    va_list ap;
    id arg;
    va_start(ap, function);
    while ((arg = va_arg(ap, id)) != nil) {
        [args addObject:arg];
    }
    [self invokeJavaScript:function arguments:args];
    va_end(ap);
}

- (void)invokeJavaScript:(NSString*)function arguments:(NSArray*)arguments {
    NSString *this = nil;
    if ([function characterAtIndex:0] == '.') {
        // Invoke a method of this object
        this = self.instance ? [self.namespace stringByAppendingFormat:@"[%zd]", self.instance] : self.namespace;
    }

    NSString* args = @"[]";
    if (arguments) {
        NSError *error;
        NSData* data = [NSJSONSerialization dataWithJSONObject:arguments options:0 error:&error];
        if (!data)
            [NSException exceptionWithName:@"InternalError" reason:@"InternalError" userInfo:error.userInfo];
        args = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    }

    NSString *script = [NSString stringWithFormat:@"%@%@.apply(%@, %@);", this ?: @"", function, this ?: @"null", args];
    [self evaluateJavaScript:script];
}

- (void)evaluateJavaScript:(NSString*)string {
    [self.channel evaluateJavaScript:string completionHandler:^void(id obj, NSError* err) {
        if (err) {
            NSLog(@"ERROR: Failed to execute script, %@\n------------\n%@\n------------", err, string);
        }
    }];
}

- (void)evaluateJavaScript:(NSString*)string onSuccess:(void(^)(id))onSuccess onError:(void(^)(NSError*))onError {
    [self.channel evaluateJavaScript:string completionHandler:^void(id obj, NSError*err) {
        err ? onSuccess(obj) : onError(err);
    }];
}

- (id)objectForKeyedSubscript:(NSString *)key {
    SEL selector = [self.channel.mirror getGetter:key];
    if (selector) {
        NSValue* result = [NKInvocation call:self selector:selector];
        if (result.isObject)
            return result.nonretainedObjectValue;
        else if (result.isNumber)
            return result;
        else
            [NSException raise:@"PropertyError" format:@"Type of property '%@' is unknown.", key];
    } else {
        [NSException raise:@"PropertyError" format:@"Property '%@' is undefined.", key];
    }
    return nil;
}

- (void)setObject:(id)obj forKeyedSubscript:(id <NSCopying>)key {
    NSString* name = (NSString*)key;
    SEL selector = [self.channel.mirror getSetter:name];
    if (selector) {
        if (!_sync)
            [self setJavaScriptProperty:name value:obj];
        [NKInvocation call:self selector:selector, obj];
    } else if ([self.channel.mirror hasProperty:name]) {
        [NSException raise:@"PropertyError" format:@"Property '%@' is readonly.", name];
    } else {
        [NSException raise:@"PropertyError" format:@"Property '%@' is undefined.", name];
    }
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context {
    // FIXME: This class should not know the mapping between selector and property name.
    if (context == (__bridge void *)(self) && _sync)
        [self setJavaScriptProperty:[keyPath substringFromIndex:7] value:change[NSKeyValueChangeNewKey]];
}

@end
