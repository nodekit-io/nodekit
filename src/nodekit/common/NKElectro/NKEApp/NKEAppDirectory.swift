/*
* nodekit.io
*
* Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
* Portions Copyright (c) 2013 GitHub, Inc. under MIT License
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

struct NKEAppDirectory {


    static func getPath(name: String) -> String {
        switch(name) {
            case "home":  return NSSearchPathForDirectoriesInDomains(.UserDirectory, .UserDomainMask, true)[0]
            case "appData":  return NSSearchPathForDirectoriesInDomains(.ApplicationSupportDirectory, .UserDomainMask, true)[0]
            case "userData":  return NSSearchPathForDirectoriesInDomains(.UserDirectory, .UserDomainMask, true)[0]
            case "temp":  return  NSTemporaryDirectory()
            case "exe": return NSBundle.mainBundle().bundlePath
            case "module": return ""
            case "desktop": return NSSearchPathForDirectoriesInDomains(.DesktopDirectory, .UserDomainMask, true)[0]
            case "documents": return NSSearchPathForDirectoriesInDomains(.DocumentDirectory, .UserDomainMask, true)[0]
            case "downloads": return NSSearchPathForDirectoriesInDomains(.DownloadsDirectory, .UserDomainMask, true)[0]
            case "music":  return NSSearchPathForDirectoriesInDomains(.MusicDirectory, .UserDomainMask, true)[0]
            case "pictures": return NSSearchPathForDirectoriesInDomains(.PicturesDirectory, .UserDomainMask, true)[0]
            case "videos": return NSSearchPathForDirectoriesInDomains(.MoviesDirectory, .UserDomainMask, true)[0]
        default: return ""
        }
    }

    static func getPackage() -> NSDictionary? {


        let mainBundle: NSBundle = NSBundle.mainBundle()
        let resourcePath: String! = mainBundle.resourcePath
        let fileManager = NSFileManager.defaultManager()

        let appPath = (mainBundle.bundlePath as NSString).stringByDeletingLastPathComponent
        let webPath = (resourcePath as NSString).stringByAppendingPathComponent("/app")

        let externalPackage = (appPath as NSString).stringByAppendingPathComponent("/package.json")
        let embeddedPackage = (webPath as NSString).stringByAppendingPathComponent("/package.json")

         if (fileManager.fileExistsAtPath(externalPackage)) {
            do {
             let packageJSON =  try NSData(contentsOfFile: externalPackage, options: .DataReadingMappedIfSafe)
             return try NSJSONSerialization.JSONObjectWithData(packageJSON, options: NSJSONReadingOptions.MutableContainers) as? NSDictionary
            } catch let error as NSError {
                log("!Error getting Package: \(error.localizedDescription)")
                return nil
            }
        } else {
            if (!fileManager.fileExistsAtPath(embeddedPackage)) {
                log("!Missing package.json in main bundle /Resources/app")
                log("!-->  \(resourcePath)")
                return nil
            }
           do {
            let packageJSON =  try NSData(contentsOfFile: externalPackage, options: .DataReadingMappedIfSafe)
            return try NSJSONSerialization.JSONObjectWithData(packageJSON, options: NSJSONReadingOptions.MutableContainers) as? NSDictionary

            } catch let error as NSError {
                log("!Error getting Package as JSON: \(error.localizedDescription)")
                return nil
            }
        }
    }
}
