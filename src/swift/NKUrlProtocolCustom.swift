/*
* nodekit.io
*
* Copyright (c) 2015 Domabo. All Rights Reserved.
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
import Cocoa

class NKUrlProtocolCustom: NSURLProtocol {
    
    
    var httpContext : JSValue? = nil;
    
    var isLoading: Bool = false;
    var isCancelled: Bool = false;
    var headersWritten: Bool = false;
    
    override class func canInitWithRequest(request: NSURLRequest) -> Bool {
        
        if (request.URL.host == nil)
        { return false;}
        
        if ((request.URL.scheme?.caseInsensitiveCompare("node") == NSComparisonResult.OrderedSame)
            || (request.URL.host?.caseInsensitiveCompare("node") == NSComparisonResult.OrderedSame)
            )
        {
            return true
        }
        else
        {
            return false
        }
        
    }
    override class func canonicalRequestForRequest(request: NSURLRequest) -> NSURLRequest {
        return request;
    }
    
    override class func requestIsCacheEquivalent(a: NSURLRequest?, toRequest:NSURLRequest?) -> Bool {
        return false
    }
    
    override func startLoading() {
        
        let hostRequest: NSURLRequest = self.request
        let client: NSURLProtocolClient = self.client!
        
        println(hostRequest.URL.absoluteString!)
        
        httpContext = NKJavascriptBridge.createHttpContext()
        
        let req: JSValue = httpContext!.valueForProperty("req");
        let res: JSValue = httpContext!.valueForProperty("res");
        
        var path = request.URL.relativePath
        var query = request.URL.query
        
        if (path == "")
        {
            path = "/"
        }
        
        if (query == nil) {query = ""}
        
        var pathWithQuery = path!;
        
        if (query != "")
        {
            pathWithQuery = pathWithQuery + "?" + query!;
        }
    
        req.setValue(hostRequest.HTTPMethod, forProperty: "method")
        req.setValue(pathWithQuery, forProperty: "url")
        req.setValue(hostRequest.allHTTPHeaderFields, forProperty: "headers")
        
        if (request.HTTPMethod == "POST")
        {
            
            let body : NSString = NSString(data:request.HTTPBody!, encoding: NSUTF8StringEncoding)!
            let length : String = body.length.description
            
            req.valueForProperty("headers").setValue( length, forKey: "Content-Length")
            req.valueForProperty("body").valueForProperty("setData").callWithArguments([body])
        }
        
        isLoading = true
        headersWritten = false
        
        let this = self
        
        NKJavascriptBridge.setJavascriptClosure(res, key: "_writeString",  callBack: { () -> Void in
            
            var str : NSString = this.httpContext!.valueForProperty("_chunk").toString();
            var data : NSData? = str.dataUsingEncoding(NSUTF8StringEncoding)
            
            if (!this.headersWritten)
            {
                this.writeHeaders()
                this.client!.URLProtocol(this, didLoadData: data!)
                data = nil
            }
        })
     
        NKJavascriptBridge.invokeHttpContext(httpContext!, callBack: response_end)
    }
    
    override func stopLoading() {
        
        if (self.isLoading)
        {
            self.isCancelled = true
            NSLog("CANCELLED")
            NKJavascriptBridge.cancelHttpContext(self.httpContext!)
        }
        self.httpContext = nil;
        
    }
    
    func response_end() {
        
        if (self.isCancelled)  {return};
        
        var str : NSString = self.httpContext!.valueForProperty("_chunk").toString();
        var data : NSData! = str.dataUsingEncoding(NSUTF8StringEncoding)
        
        if (!self.headersWritten)
        {
            self.writeHeaders()
        }
        
        self.isLoading = false;
        
        self.client!.URLProtocol(self, didLoadData: data)
        self.client!.URLProtocolDidFinishLoading(self)
        
        self.httpContext = nil
    }
    
    func writeHeaders() {
        let res: JSValue = self.httpContext!.valueForProperty("res");
        
        self.headersWritten = true;
        var headers : NSDictionary? = res.valueForProperty("headers").toDictionary()
        var version : String = "HTTP/1.1"
        var statusCode : Int = (res.valueForProperty("statusCode").toString() as NSString).integerValue
      
        if (statusCode == 302)
        {
            var location = headers!.valueForKey("location") as NSString
            
            var url : NSURL = NSURL(string: location)!
            
             NSLog("Redirection location to %@", url)
            
            var response = NSHTTPURLResponse(URL: url, statusCode: statusCode, HTTPVersion: version, headerFields: headers)!
      
            self.client?.URLProtocol(self, wasRedirectedToRequest: NSURLRequest(URL: url), redirectResponse: response)
            self.isLoading = false
            self.client?.URLProtocolDidFinishLoading(self)

        }
        else
        {
            
            var response = NSHTTPURLResponse(URL: self.request.URL, statusCode: statusCode, HTTPVersion: version, headerFields: headers)!
            self.client?.URLProtocol(self, didReceiveResponse: response, cacheStoragePolicy: NSURLCacheStoragePolicy.NotAllowed)
            
        }
    }
}
