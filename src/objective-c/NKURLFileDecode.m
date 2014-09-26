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

#import "NKURLFileDecode.h"

@implementation NKURLFileDecode
    
-(NKURLFileDecode *)initWithURLRequest:(NSURLRequest *)request
    {
        _resourcePath = nil;
        
        NSBundle *mainBundle = [NSBundle mainBundle];
        NSString *appPath = [[mainBundle bundlePath] stringByDeletingLastPathComponent];
        NSFileManager *fileManager = [NSFileManager defaultManager];
        
        NSDictionary *fileTypes = [NSDictionary dictionaryWithObjectsAndKeys:
                                   @"text/html", @"html",
                                   @"application/javascript", @"js",
                                   @"text/css", @"css",
                                   nil];
        
        _urlPath = [[[request URL] path] stringByDeletingLastPathComponent];
        _fileExtension= [[[request URL] pathExtension] lowercaseString];
        _fileName = [[request URL] lastPathComponent];
        if ([_fileExtension length] == 0)
        {
            _fileBase = _fileName;
            
        }
        else
        {
            _fileBase = [_fileName substringToIndex:([_fileName length] - ([_fileExtension length] + 1))];
        }
        
        if ([_fileName length] > 0) {
            
            _resourcePath = [[appPath stringByAppendingPathComponent:_urlPath] stringByAppendingPathComponent:_fileName];
            
            if ((![fileManager fileExistsAtPath:_resourcePath]))
               _resourcePath = nil;
            
            if ((_resourcePath == nil) && ([_fileExtension length] >0))
            _resourcePath = [mainBundle
                             pathForResource:_fileBase ofType:_fileExtension inDirectory: [@"app" stringByAppendingPathComponent:_urlPath]];
            
            if ((_resourcePath == nil) && ([_fileExtension length] >0))
            _resourcePath = [mainBundle
                             pathForResource:_fileBase ofType:_fileExtension inDirectory: [@"app-shared" stringByAppendingPathComponent:_urlPath]];
            
            
            if ((_resourcePath == nil) && ([_fileExtension length] ==0))
            _resourcePath = [mainBundle
                             pathForResource:_fileBase ofType:@"html" inDirectory: [@"app" stringByAppendingPathComponent:_urlPath]];
            
            if ((_resourcePath == nil) && ([_fileExtension length] ==0))
            _resourcePath = [mainBundle
                             pathForResource:@"index" ofType:@"html" inDirectory: [@"app" stringByAppendingPathComponent:[[request URL] path]]];
            
            _mimeType = nil;
            _textEncoding = nil;
            
            _mimeType = [fileTypes objectForKey:_fileExtension];
            
            if (_mimeType != nil) {
                if ([_mimeType hasPrefix:@"text"]) {
                    _textEncoding = @"utf-8";
                }
            }
        }
        
        return self;
    }
    
-(BOOL)exists
    {
        return (_resourcePath != nil);
    }
    
    @end
