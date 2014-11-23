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

import Foundation

class NKUrlFileDecode: NSObject {

    var resourcePath : NSString?   // The path to the bundle resource
    var urlPath : NSString  // The relative path from root
    var fileName : NSString // The filename, with extension
    var fileBase : NSString   // The filename, without the extension
    var fileExtension : NSString // The file extension
    var mimeType : NSString?    // The mime type
    var textEncoding : NSString?   // The text encoding
    
    init(request: NSURLRequest)
    {
        resourcePath = nil;
        
        var _mainBundle: NSBundle = NSBundle.mainBundle()
        var _appPath : NSString = _mainBundle.bundlePath.stringByDeletingLastPathComponent
        var _fileManager : NSFileManager = NSFileManager.defaultManager()
        var _fileTypes: [NSString : NSString] = ["html": "text/html" ,
            "js" : "application/javascript" ,
            "css": "text/css" ]
        
        urlPath = request.URL.path!.stringByDeletingLastPathComponent
        
        fileExtension = request.URL.pathExtension!.lowercaseString
        fileName = request.URL.lastPathComponent!
        if (fileExtension.length == 0)
        {
            fileBase = fileName
        }
        else
        {
            fileBase = fileName.substringToIndex(fileName.length - fileExtension.length - 1)
            }
        
        mimeType = nil
        textEncoding = nil
        
        
        super.init()
        
        
        
        if (fileName.length > 0) {
            
            resourcePath = _appPath.stringByAppendingPathComponent(urlPath).stringByAppendingPathComponent(fileName)
            
            if (!_fileManager.fileExistsAtPath(resourcePath!))
            {
                resourcePath = nil;
            }
            
            if ((resourcePath == nil) && (fileExtension.length > 0))
            {
                resourcePath = _mainBundle.pathForResource(fileBase, ofType:fileExtension, inDirectory: "app".stringByAppendingPathComponent(urlPath))
            }
            
            if ((resourcePath == nil) && (fileExtension.length > 0))
            {
                resourcePath = _mainBundle.pathForResource(fileBase, ofType:fileExtension, inDirectory: "app-shared".stringByAppendingPathComponent(urlPath))
            }
            
            if ((resourcePath == nil) && (fileExtension.length == 0))
            {
                resourcePath = _mainBundle.pathForResource(fileBase, ofType:"html", inDirectory: "app".stringByAppendingPathComponent(urlPath))
            }
            
            if ((resourcePath == nil) && (fileExtension.length == 0))
            {
                resourcePath = _mainBundle.pathForResource("index", ofType:"html", inDirectory: "app".stringByAppendingPathComponent(urlPath))
            }
            
            
            mimeType = _fileTypes[fileExtension]
            
            if (mimeType != nil) {
                if mimeType!.hasPrefix("text") {
                    textEncoding = "utf-8";
                }
            }
        }

    }
    
    func exists() -> Bool
    {
        return (resourcePath? != nil);
    }
}
