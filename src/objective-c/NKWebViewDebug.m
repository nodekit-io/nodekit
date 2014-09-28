#ifdef DEBUG
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

#import "NKWebViewDebug.h"
#import "Webkit/Webkit.h"
#import "NKJSBridge.h"

@interface WebView ()
-(id)setScriptDebugDelegate:(id)delegate;
@end

@class WebFrame;

@interface WebScriptCallFrame
- (id)exception;
- (NSString*)functionName;
- (NSArray *)scopeChain;
- (id)evaluateWebScript:(NSString *)script;
    @end

@implementation NKWebViewDebug
    
    static NSString* const kSourceIDMapFilenameKey = @"filename";
    static NSString* const kSourceIDMapSourceKey = @"source";
    static NSMutableDictionary* sourceIDMap;
    static NSDictionary *currentException = nil;
    static bool debuggerStopped = NO;
    static bool throwIfHandled = YES;

    void (^_completionHandler)(JSContext*);

+ (bool) throwIfHandled;
{ @synchronized(self) { return throwIfHandled; } }
+ (void) setThrowIfHandled:(bool)val
{ @synchronized(self) { throwIfHandled = val; } }

- (id)init
    {
        
        self = [super init];
        if (self) {
            sourceIDMap = [NSMutableDictionary dictionary];
            
        }
        return self;
    }


-(id)initWithCallBack:(void(^)(JSContext*))jsCallback
{
    self = [super init];
    if (self) {
         sourceIDMap = [NSMutableDictionary dictionary];
        _completionHandler = jsCallback;
        
    }
    return self;
}

- (void) webView: (id) sender didCreateJavaScriptContext: (JSContext*) context forFrame: (id) frame
{
      //  [NLContext attachToContext:context];
    
        [sender setScriptDebugDelegate:self];
        
        context[@"process"][@"debugException"] = (NSDictionary*)^(){
            if (currentException == nil)
                currentException = @{ @"source" : @"",
                                      @"lineNumber" : @"",
                                      @"sourceLine" : @"",
                                      @"callStack" : [[NSMutableArray alloc] init],
                                      @"locals" : [[NSMutableArray alloc] init],
                                      @"exception" : @"",
                                      @"description" : @""};
            return currentException;
            
        };
    
   // id inspector = [sender performSelector:@selector(inspector)];
  //  [inspector performSelector:@selector(show:) withObject:nil];

         context.exceptionHandler = ^(JSContext *ctx, JSValue *e) {
            NSLog(@"JAVASCRIPT EXCEPTION: %@", e);
        };
        
        _completionHandler(context);
  //      _completionHandler = nil;

}
    

    
+ (NSString*)filenameForURL:(NSURL*)url {
    NSString* pathString = [url path];
    NSArray* pathComponents = [pathString pathComponents];
    return [pathComponents objectAtIndex:([pathComponents count] - 1)];
}
    
+ (NSString*)formatSource:(NSString*)source {
    NSMutableString* formattedSource = [NSMutableString stringWithCapacity:100];
    [formattedSource appendString:@"Source:\n"];
    int* lineNumber = malloc(sizeof(int));
    *lineNumber = 1;
    [source enumerateLinesUsingBlock:^(NSString* line, BOOL* stop) {
        [formattedSource appendFormat:@"%3d: %@", *lineNumber, line];
        (*lineNumber)++;
    }];
    free(lineNumber);
    [formattedSource appendString:@"\n\n"];
    
    return formattedSource;
}
    
- (void) webView:(WebView*)webView didParseSource:(NSString*)source baseLineNumber:(unsigned int)baseLineNumber fromURL:(NSURL*)url sourceId:(int)sourceID forWebFrame:(WebFrame*)webFrame {
    NSString* filename = nil;
    if (url) {
        filename = [NKWebViewDebug filenameForURL:url];
    }
    NSMutableDictionary* mapEntry = [NSMutableDictionary dictionaryWithObject:source forKey:kSourceIDMapSourceKey];
    if (filename) {
        [mapEntry setObject:filename forKey:kSourceIDMapFilenameKey];
    }
    [sourceIDMap setObject:mapEntry forKey:[NSNumber numberWithInt:sourceID]];
    //NSLog(@"%@", [source substringToIndex:MIN(300, [source length])]);
}
    
    
- (void)webView:(WebView *)webView failedToParseSource:(NSString *)source baseLineNumber:(unsigned int)baseLineNumber fromURL:(NSURL *)url withError:(NSError *)error forWebFrame:(WebFrame *)webFrame {
    
    if (  debuggerStopped )
    return;
    
    NSDictionary* userInfo = [error userInfo];
    NSNumber* fileLineNumber = [userInfo objectForKey:@"WebScriptErrorLineNumber"];
    NSString* description = [userInfo objectForKey:@"WebScriptErrorDescription"];
    
    NSString* filename = @"";
    if (url) {
        filename = [NSString stringWithFormat:@"filename: %@, ", [NKWebViewDebug filenameForURL:url]];
    }
    
    
    NSArray* sourceLines = [source componentsSeparatedByString:@"\n"];
    NSString* sourceLine = [sourceLines objectAtIndex:([fileLineNumber intValue] - 1)];
    if ([sourceLine length] > 200) {
        sourceLine = [[sourceLine substringToIndex:200] stringByAppendingString:@"..."];
    }
    
    NSLog(@"Parse error - %@fileLineNumber: %@, sourceline: %@\n%@", filename, fileLineNumber, sourceLine, description);
    
    
    currentException = @{ @"source" :source,
                          @"lineNumber" : [fileLineNumber stringValue],
                          @"sourceLine" : sourceLine,
                          @"locals":     [[NSMutableArray alloc] init],
                          @"callStack" : [[NSMutableArray alloc] init],
                          @"exception" : @"Failed to Parse Source",
                          @"description" : description};
    debuggerStopped = YES;
    double delayInSeconds = 0.1;
    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));
    dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
    [self showDebugWindow:currentException];
    });
}
    
- (void)webView:(WebView *)webView   exceptionWasRaised:(WebScriptCallFrame *)frame
         hasHandler:(BOOL)hasHandler
           sourceId:(int)sourceID
               line:(int)lineNumber
        forWebFrame:(WebFrame *)webFrame {
   
     WebScriptObject* exception = [frame exception];
    
    NSString *exceptionName = @"";
    NSString *exceptionMessage = @"";
    
    @try {
        exceptionName =[exception valueForKey:@"name"] ;
        exceptionMessage =[exception valueForKey:@"message"] ;
    }
    @catch (NSException *e) {
        exceptionName = (NSString*)exception;
    }
   
    
    if (hasHandler  && !throwIfHandled)
    {
      return;
    }
   
    NSMutableArray *callStack = [[NSMutableArray alloc] init];
    
    bool tryFilePackage = NO;
    

    if (([exceptionMessage rangeOfString:@"no such file or directory"].location != NSNotFound) && (tryFilePackage))
    return;
    
    if (([exceptionMessage rangeOfString:@"no such file or directory"].location != NSNotFound) )
        return;
    
    NSLog(@"%@", exceptionMessage);
    
    
    NSDictionary* sourceLookup = [sourceIDMap objectForKey:[NSNumber numberWithInt:sourceID]];
    NSString* filename = [sourceLookup objectForKey:kSourceIDMapFilenameKey];
    NSString* source = [sourceLookup objectForKey:kSourceIDMapSourceKey];
    
    NSMutableString *message = [NSMutableString stringWithCapacity:100];
    
    [message appendFormat:@"Exception\n\nName: %@", exceptionName];
  //  NSMutableString *stack = [exception valueForKey:@"stack"];
    
    if (filename) {
        [message appendFormat:@", filename: %@", filename];
    }
    
    [message appendFormat:@"\nMessage: %@\n\n", exceptionMessage];
    
    NSArray* sourceLines = [source componentsSeparatedByString:@"\n"];
    NSString* sourceLine = [sourceLines objectAtIndex:(lineNumber)];
    if ([sourceLine length] > 200) {
        sourceLine = [[sourceLine substringToIndex:200] stringByAppendingString:@"..."];
    }
    
    if ([sourceLine rangeOfString:@"delete Module._cache"].location != NSNotFound)
    return;
    
    if (([exceptionMessage rangeOfString:@"no such file or directory"].location != NSNotFound) && ([sourceLine rangeOfString:@"binding.stat"].location!= NSNotFound))
    {
    return;
    }
     
    NSMutableDictionary *locals = [[NSMutableDictionary alloc] init];
    
    /*
    WebScriptObject *scope = [[frame scopeChain] objectAtIndex:0]; // local is always first
    NSArray *localScopeVariableNames = [NAKWebViewDebug webScriptAttributeKeysForScriptObject:scope];
    
    for (int i = 0; i < [localScopeVariableNames count]; ++i) {
        
            NSString* key =[localScopeVariableNames objectAtIndex:i];
        @try{
            
             NSString* value=[NAKWebViewDebug valueForScopeVariableNamed:key inCallFrame:frame];
            
            if ([value length] > 200) {
                value = [[value substringToIndex:200] stringByAppendingString:@"..."];
            }
            
            [locals setObject:value forKey:key];
        }
        @catch (NSException * e) {
            [locals setObject:@"[not available]" forKey:key];
        }
        @finally {
         }
    }
     */
    
    [message appendString:@"Offending function:\n"];
    [message appendFormat:@"  %d: %@\n", lineNumber + 1, sourceLine];
    
    NSLog(@"%@", message);
    
   /*  [[webFrame windowObject] setValue:[frame exception] forKey:@"__GC_frame_exception"];
    
   id objectRef = [[webFrame windowObject] evaluateWebScript:@"__GC_frame_exception.constructor.name"];
    [[webFrame windowObject] setValue:nil forKey:@"__GC_frame_exception"];
    
    NSLog(objectRef);*/
    
    
   if (  debuggerStopped )
   return;

    currentException = @{ @"source" : source,
                          @"lineNumber" : [@(lineNumber+1) stringValue],
                          @"sourceLine" : sourceLine,
                          @"callStack" : callStack,
                          @"locals" : locals,
                          @"exception" : exceptionName,
                          @"description" : exceptionMessage};
    debuggerStopped = YES;
    
        double delayInSeconds = 0.1;
    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));
    dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
    [self showDebugWindow:currentException];
    });
    
}
    
+ (NSArray *)webScriptAttributeKeysForScriptObject:(WebScriptObject *)object
    {
        
        
        WebScriptObject *enumerateAttributes = [object evaluateWebScript:@"(function () { var result = new Array(); for (var x in this) { result.push(x); } return result; })"];
        
        NSMutableArray *result = [[NSMutableArray alloc] init];
        WebScriptObject *variables = [enumerateAttributes callWebScriptMethod:@"call" withArguments:[NSArray arrayWithObject:object]];
        unsigned length = [[variables valueForKey:@"length"] intValue];
        for (unsigned i = 0; i < length; i++) {
            NSString *key = [variables webScriptValueAtIndex:i];
            [result addObject:key];
        }
        
        [result sortUsingSelector:@selector(compare:)];
        return result;
    }
    
    
    
+ (NSString *)valueForScopeVariableNamed:(NSString *)key inCallFrame:(WebScriptCallFrame *)frame
    {
        
        if (![[frame scopeChain] count])
        return nil;
        
        unsigned scopeCount = (int)[[frame scopeChain] count];
        for (unsigned i = 0; i < scopeCount; i++) {
            WebScriptObject *scope = [[frame scopeChain] objectAtIndex:i];
            id value = [scope valueForKey:key];
            
            if ([value isKindOfClass:NSClassFromString(@"WebScriptObject")])
            return [value callWebScriptMethod:@"toString" withArguments:nil];
            if (value && ![value isKindOfClass:[NSString class]])
            return [value callWebScriptMethod:@"toString" withArguments:nil];
            return [NSString stringWithFormat:@"%@", value];
        }
        
        return nil;
    }
      
    // about to execute some code
    //- (void)webView:(WebView *)webView willExecuteStatement:(WebScriptCallFrame *)frame sourceId:(int)sid line:(int)lineno forWebFrame:(WebFrame *)webFrame;
    
    // about to leave a stack frame (i.e. return from a function)
    //- (void)webView:(WebView *)webView willLeaveCallFrame:(WebScriptCallFrame *)frame sourceId:(int)sid line:(int)lineno forWebFrame:(WebFrame *)webFrame;


- (void) showDebugWindow: (NSDictionary*)e
{
        NSMutableString *message = [NSMutableString stringWithCapacity:1000];
        [message appendString:@"<head></head>"];
        [message appendString:@"<body>"];
        [message appendString:@"<h1>Exception</h1>"];
        NSArray *callStack =e[@"callStack"];
        NSDictionary *locals = e[@"locals"];
        NSString *fileName;
        NSString *source = e[@"source"];
        if ([locals count] >0)
        {
            fileName = e[@"locals"][@"__filename"];
        }
        
        if (!fileName)
        {
            NSRange r1 = [source rangeOfString:@"sourceURL="];
            if (r1.location == NSNotFound)
            {
                fileName = @"n/a";
            }
            else
            {
                NSRange r2 = NSMakeRange(r1.location + r1.length,  [source length] - r1.location -r1.length);
                NSRange r3 = [source rangeOfString:@"\n" options:0 range:r2];
                if (r1.location == NSNotFound)
                {
                    fileName = @"n/a";
                }
                else
                {
                    NSRange rsub = NSMakeRange(r2.location,  r3.location -r2.location);
                    fileName = [source substringWithRange:rsub];
                }
            }
        }
        
        [message appendFormat:@"<h2>%@</h2>", e[@"exception"]];
        [message appendFormat:@"<p><i>%@</i> in file %@ at line %@</p>" , e[@"description"], fileName, e[@"lineNumber"]];
        [message appendFormat:@"<h3>Source Line</h3><pre style='font-family: monospace;'>%@</pre>" , e[@"sourceLine"]];
        
        if ([callStack count] >0)
        {
            [message appendString:@"<h3>Call Stack</h3>"];
            [message appendString:@"<pre id='preview' style='font-family: monospace;'><ul>"];
            [callStack enumerateObjectsUsingBlock: ^(NSString* line, NSUInteger idx, BOOL* stop) {
                [message appendFormat:@"<li>%@</li>", line];
            }];
            [message appendString:@"</ul></pre>"];
        }
        
        if ([source length] >0)
        {
            [message appendString:@"<h3>Source</h3>"];
            
            [message appendString:@"<pre id='preview' style='font-family: monospace; tab-size: 3; -moz-tab-size: 3; -o-tab-size: 3; -webkit-tab-size: 3;'><ol>"];
            
            
            [source enumerateLinesUsingBlock:^(NSString* line, BOOL* stop) {
                [message appendFormat:@"<li>%@</li>", line];
            }];
            [message appendString:@"</ol></pre>"];
        }
        
        if ([locals count] >0)
        {
            [message appendString:@"<h3>Locals</h3>"];
            [message appendString:@"<pre style='font-family: monospace;'><table>"];
            
            [locals enumerateKeysAndObjectsUsingBlock:^(NSString* key, NSString* obj, BOOL* stop) {
                [message appendFormat:@"<tr><td>%@</td><td>%@</td></tr>", key,obj];
            }];
            [message appendString:@"</table></pre>"];
        }
   
        [message appendString:@"</body>"];
    [NKJSBridge showString:message Title: @"Debug"];
    
}

    @end

#endif