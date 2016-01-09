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

import Foundation

internal class NKFileSystem: NSObject {
    
    class func exists (path: String) -> Bool {
        return NSFileManager().fileExistsAtPath(path)
    }
    
    class func getDirectoryAsync(module: String, completionHandler: NKNodeCallBack) {
       
        dispatch_async(NKGlobals.NKeventQueue,{
            completionHandler(error: NSNull(), value: self.getDirectory(module))
        });
    }
    
    class func getDirectory(module: String) -> NSArray {
           let path=module; //self.getPath(module)
        
            let dirContents = (try? NSFileManager.defaultManager().contentsOfDirectoryAtPath(path)) as NSArray!
        
            return dirContents
    }
    
    class func statAsync(module: String, completionHandler: NKNodeCallBack) {
        
        let ret = self.stat(module)
        if (ret != nil)
        {
            completionHandler(error: NSNull(), value: ret!)
            
        } else
        {
            completionHandler(error: "stat error", value: NSNull())
        }
    }
    
    class func stat(module: String) -> Dictionary<String, NSObject>? {
        
        let path=module; //self.getPath(module)
        var storageItem  = Dictionary<String, NSObject>()
        
        let attr: NSDictionary!
        do
        {
             attr = try NSFileManager.defaultManager().attributesOfItemAtPath(path)
            
        } catch _
        {
            return nil
        }
        
        storageItem["birthtime"] = attr[NSFileCreationDate] as! NSDate!
        storageItem["size"] = attr[NSFileSize] as! NSNumber!
        storageItem["mtime"] = attr[NSFileModificationDate] as! NSDate!
        storageItem["path"] = path as NSString!
        
        switch attr[NSFileType] as! NSString!
        {
        case NSFileTypeDirectory:
            storageItem["filetype"] = "Directory"
            break
        case NSFileTypeRegular:
            storageItem["filetype"] = "File"
            break
        case NSFileTypeSymbolicLink:
            storageItem["filetype"] = "SymbolicLink"
            break
        default:
            storageItem["filetype"] = "File"
            break
        }
        
        return storageItem
    }
    
    class func getContentAsync(storageItem: NSDictionary! , completionHandler: NKNodeCallBack) {
        dispatch_async(NKGlobals.NKeventQueue, {
            completionHandler(error: NSNull(), value: self.getContent(storageItem))
        });
    }
    
    class func getContent(storageItem: NSDictionary!) -> NSString {
        
        
        let path = storageItem["path"] as! NSString!;
        var data: NSData?
        do {
          data = try NSData(contentsOfFile: path as String, options: NSDataReadingOptions(rawValue: 0))
        }
        catch _ {
            log("ERROR reading file");
            
            return ""
        }
        
        var content: NSString!
         content =  (data!.base64EncodedStringWithOptions(NSDataBase64EncodingOptions(rawValue: 0)))
        
         return content!
    }
    
    
    class func writeContent(storageItem: NSDictionary!, str: NSString!) -> Bool {
        
        let path = storageItem["path"] as! NSString!
        let data = NSData(base64EncodedString: str as String, options: NSDataBase64DecodingOptions(rawValue:0))
        return data!.writeToFile(path as String, atomically: false)
        }
    
    class func writeContentAsync(storageItem: NSDictionary!, str: NSString!, completionHandler: NKNodeCallBack)  {
        dispatch_async(NKGlobals.NKeventQueue, {
      
            completionHandler(error: NSNull(), value: self.writeContent(storageItem, str: str))
        });
    }


    class func getSource(module: String) -> String! {
        
        let path=getPath(module);
        
        if (path=="")
        {
          return ""
        }
        
        let originalEncoding: UnsafeMutablePointer<UInt> = nil
        
        var content: String?
        do {
            content = try String(contentsOfFile: path, usedEncoding: originalEncoding)
        } catch _ {
            content = nil
        }
        
        return content!
    }
    
    class func mkdir (path: String) -> Bool {
        
        
        do {
            try NSFileManager.defaultManager().createDirectoryAtPath(path, withIntermediateDirectories: true, attributes: nil)
            return true
        } catch _ {
            return false
        }

    }
    
    class func rmdir (path: String) -> Bool {
        
        
        do {
            try NSFileManager.defaultManager().removeItemAtPath(path)
            return true
        } catch _ {
            return false
        }
            
        
    }

    class func move (path: String, path2: String) -> Bool {
        
        
        do {
            try NSFileManager.defaultManager().moveItemAtPath(path, toPath: path2)
            return true
        } catch _ {
            return false
        }
    }
    
    class func unlink (path: String) -> Bool {
        
         do {
            try NSFileManager.defaultManager().removeItemAtPath(path)
            return true
        } catch _ {
            return false
        }
        
        
    }
    
   class func getPath(module: String) -> String {
        
        let directory = (module as NSString).stringByDeletingLastPathComponent
        var fileName = (module as NSString).lastPathComponent
        var fileExtension = (fileName as NSString).pathExtension
        fileName = (fileName as NSString).stringByDeletingPathExtension
        
        if (fileExtension=="") {
            fileExtension = "js"
        }
        
        let mainBundle : NSBundle = NSBundle.mainBundle()
   //     var resourcePath:String! = mainBundle.resourcePath
        
        var path = mainBundle.pathForResource(fileName, ofType: fileExtension, inDirectory: directory)
        
        if (path == nil)
        {
            let _nodeKitBundle: NSBundle = NSBundle(forClass: NKNodeKit.self)
            
            path = _nodeKitBundle.pathForResource(fileName, ofType: fileExtension, inDirectory: directory)
            
            if (path == nil)
            {
                
            NSLog("Error - source file not found: %@", directory + "/" + fileName + "." + fileExtension)
            return ""
            }
        }
        
        return path!;
        
    }
    
    class func getFullPath(parentModule: String, module: String) -> String!{
        
        if (parentModule != "")
        {
            let parentPath = (parentModule as NSString).stringByDeletingLastPathComponent
            
            let id = parentPath + module
            return id
        }
        else
        {
            return module
        }
    }
    
    
}