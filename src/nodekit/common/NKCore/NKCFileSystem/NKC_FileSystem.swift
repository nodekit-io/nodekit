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

class NKC_FileSystem: NSObject, NKScriptExport {
    
    class func attachTo(context: NKScriptContext) {
        context.NKloadPlugin(NKC_FileSystem(), namespace: "io.nodekit.fs", options: [String:AnyObject]());
    }
    
    class func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
            let url = NSBundle(forClass: NKC_FileSystem.self).pathForResource("fs", ofType: "js", inDirectory: "lib/platform")
            let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
            return "function loadplugin(){\n" + appjs! + "\n}\n" + stub + "\n" + "loadplugin();" + "\n"
        default:
            return stub;
        }
    }
    
     func stat(module: String) -> Dictionary<String, AnyObject>  {
        
        let path=module; //self.getPath(module)
        var storageItem  = Dictionary<String, NSObject>()
        
        let attr: [String : AnyObject]
        do
        {
            attr = try NSFileManager.defaultManager().attributesOfItemAtPath(path)
            
        } catch _
        {
            return storageItem
        }
        
        storageItem["birthtime"] = attr[NSFileCreationDate] as! NSDate
        storageItem["size"] = attr[NSFileSize] as! NSNumber
        storageItem["mtime"] = attr[NSFileModificationDate] as! NSDate
        storageItem["path"] = path as String
        
        switch attr[NSFileType] as! String
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
    
    func statAsync(module: String, completionHandler: NKScriptValue) -> Void {
        let ret = self.stat(module)
        if (ret.count > 0)
        {
            completionHandler.callWithArguments([NSNull(), ret])
        } else
        {
            completionHandler.callWithArguments(["stat error"])
        }
    }
    
    
    func exists (path: String) -> Bool {
        return NSFileManager().fileExistsAtPath(path)
    }
    
    func getDirectoryAsync(module: String, completionHandler: NKScriptValue) -> Void  {
        completionHandler.callWithArguments([NSNull(), self.getDirectory(module)])
    }
    
    func getDirectory(module: String) -> [String] {
        let path=module; //self.getPath(module)
        let dirContents = (try? NSFileManager.defaultManager().contentsOfDirectoryAtPath(path)) ?? [String]()
        return dirContents
    }
    
    func getTempDirectory() -> String? {
        let fileURL: NSURL = NSURL.fileURLWithPath(NSTemporaryDirectory())
        return fileURL.path
    }

    
    func getContentAsync(storageItem:  Dictionary<String, AnyObject>, completionHandler: NKScriptValue) -> Void {
          completionHandler.callWithArguments([NSNull(), self.getContent(storageItem)])
    }
    
    func getContent(storageItem: Dictionary<String, AnyObject>) -> String {
        guard let path = storageItem["path"] as? String else {return ""}
        var data: NSData?
        do {
          data = try NSData(contentsOfFile: path as String, options: NSDataReadingOptions(rawValue: 0))
        }
        catch _ {
            log("!ERROR reading file");
            
            return ""
        }
        
        return (data!.base64EncodedStringWithOptions(NSDataBase64EncodingOptions(rawValue: 0)))
    }
    
    func writeContent(storageItem: Dictionary<String, AnyObject>, str: String) -> Bool {
        guard let path = storageItem["path"] as? String else {return false}
        let data = NSData(base64EncodedString: str, options: NSDataBase64DecodingOptions(rawValue:0))
        return data!.writeToFile(path, atomically: false)
    }
    
    func writeContentAsync(storageItem: Dictionary<String, AnyObject>, str: String, completionHandler: NKScriptValue)  {
        completionHandler.callWithArguments([ NSNull(),  self.writeContent(storageItem, str: str)])
    }

    func getSource(module: String) -> String {
        
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
    
    func mkdir (path: String) -> Bool {
        
        
        do {
            try NSFileManager.defaultManager().createDirectoryAtPath(path, withIntermediateDirectories: true, attributes: nil)
            return true
        } catch _ {
            return false
        }

    }
    
    func rmdir (path: String) -> Bool {
        
        
        do {
            try NSFileManager.defaultManager().removeItemAtPath(path)
            return true
        } catch _ {
            return false
        }
            
        
    }

    func move (path: String, path2: String) -> Bool {
        
        
        do {
            try NSFileManager.defaultManager().moveItemAtPath(path, toPath: path2)
            return true
        } catch _ {
            return false
        }
    }
    
    func unlink (path: String) -> Bool {
        
         do {
            try NSFileManager.defaultManager().removeItemAtPath(path)
            return true
        } catch _ {
            return false
        }
        
        
    }
    
    func getPath(module: String) -> String {
        
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
                
            log("!Error - source file not found: \(directory + "/" + fileName + "." + fileExtension)")
            return ""
            }
        }
        
        return path!;
        
    }
    
    func getFullPath(parentModule: String, module: String) -> String!{
        
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