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

class NKE_Protocol: NSObject, NKScriptExport {
   static var registeredSchemes: Dictionary<String, NKScriptValue> = Dictionary<String, NKScriptValue>()
   static var activeRequests: Dictionary<Int, NKE_ProtocolCustom> = Dictionary<Int, NKE_ProtocolCustom>()
   static var registeredSchemeTypes: Dictionary<String, NKScriptValue> = Dictionary<String, NKScriptValue>()

   class func attachTo(context: NKScriptContext) {
        context.NKloadPlugin(NKE_Protocol(), namespace: "io.nodekit.electro.protocol", options: [String:AnyObject]())
    }

    func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
            let url = NSBundle(forClass: NKE_Menu.self).pathForResource("protocol", ofType: "js", inDirectory: "lib-electro")
            let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
            return "function loadplugin(){\n" + appjs! + "\n}\n" + stub + "\n" + "loadplugin();" + "\n"
        default:
            return stub
        }
    }

    override init() {
    }

    func registerCustomProtocol(scheme: String, handler: NKScriptValue, completion: NKScriptValue?) -> Void {
        let scheme = scheme.lowercaseString
        NKE_Protocol.registeredSchemes[scheme] = handler
        NKE_ProtocolCustom.registeredSchemes.insert(scheme)
        completion?.callWithArguments([], completionHandler: nil)
    }

    func unregisterCustomProtocol(scheme: String, completion: NKScriptValue?) -> Void {
        let scheme = scheme.lowercaseString

        if (NKE_Protocol.registeredSchemes[scheme] != nil) {
            NKE_Protocol.registeredSchemes.removeValueForKey(scheme)
        }
        NKE_ProtocolCustom.registeredSchemes.remove(scheme)
        completion?.callWithArguments([], completionHandler: nil)

    }

    class func _emitRequest(req: Dictionary<String, AnyObject>, nativeRequest: NKE_ProtocolCustom) -> Void {
        let scheme = req["scheme"] as! String
        let id = nativeRequest.id

        let handler = NKE_Protocol.registeredSchemes[scheme]
        NKE_Protocol.activeRequests[id] = nativeRequest
        handler?.callWithArguments([req], completionHandler: nil)

    }

    class func _cancelRequest(nativeRequest: NKE_ProtocolCustom) -> Void {
        let id = nativeRequest.id
        if (NKE_Protocol.activeRequests[id] != nil) {
           NKE_Protocol.activeRequests.removeValueForKey(id)
        }
    }

    func callbackWriteData(id: Int, res: Dictionary<String, AnyObject>) -> Void {
        guard let nativeRequest = NKE_Protocol.activeRequests[id] else {return;}
        nativeRequest.callbackWriteData(res)
    }

    func callbackEnd(id: Int, res: Dictionary<String, AnyObject>) -> Void {
       guard let nativeRequest = NKE_Protocol.activeRequests[id] else {return;}
        NKE_Protocol.activeRequests.removeValueForKey(id)
        nativeRequest.callbackEnd(res)
    }

    func isProtocolHandled(scheme: String, callback: NKScriptValue) -> Void {
        let isHandled: Bool = (NKE_Protocol.registeredSchemes[scheme] != nil)
        callback.callWithArguments([isHandled], completionHandler: nil)
    }
}

class NKE_ProtocolCustom: NSURLProtocol {
    static var registeredSchemes: Set<String> = Set<String>()

    private class var sequenceNumber: Int {
        struct sequence {
            static var number: Int = 0
        }
        return ++sequence.number
    }

    var isLoading: Bool = false
    var isCancelled: Bool = false
    var headersWritten: Bool = false
    var id: Int = NKE_ProtocolCustom.sequenceNumber

    override class func canInitWithRequest(request: NSURLRequest) -> Bool {

        guard let host = request.URL?.host?.lowercaseString else {return false;}
        guard let scheme = request.URL?.scheme.lowercaseString else {return false;}

        return (NKE_ProtocolCustom.registeredSchemes.contains(scheme) || NKE_ProtocolCustom.registeredSchemes.contains(host))
    }

    override class func canonicalRequestForRequest(request: NSURLRequest) -> NSURLRequest {
        return request
    }

    override class func requestIsCacheEquivalent(a: NSURLRequest?, toRequest: NSURLRequest?) -> Bool {
        return false
    }

    override func startLoading() {
        let request = self.request
        var req: Dictionary<String, AnyObject> = Dictionary<String, AnyObject>()
        req["id"] = self.id

        guard let host = request.URL?.host?.lowercaseString else {return;}
        guard let scheme = request.URL?.scheme.lowercaseString else {return;}
        req["host"] = host
        if (!NKE_ProtocolCustom.registeredSchemes.contains(scheme) && NKE_ProtocolCustom.registeredSchemes.contains(host)) {
            req["scheme"] = host
        } else {
            req["scheme"] = scheme
        }

       var path = request.URL!.relativePath ?? ""
        let query = request.URL!.query ?? ""

        if (path == "") { path = "/" }

        let pathWithQuery: String

        if (query != "") {
            pathWithQuery = path + "?" + query
        } else {
            pathWithQuery = path
        }

        req["url"] = pathWithQuery
        req["method"] = request.HTTPMethod
        req["headers"] = request.allHTTPHeaderFields

        if (request.HTTPMethod == "POST") {

            let body = NSString(data:request.HTTPBody!, encoding: NSUTF8StringEncoding)!
            req["body"] = body
            req["length"] = body.length.description
        }

        isLoading = true
        headersWritten = false


        NKE_Protocol._emitRequest(req, nativeRequest: self)
    }

    override func stopLoading() {

        if (self.isLoading) {
            NKE_Protocol._cancelRequest(self)
            self.isCancelled = true
            log("+Custom Url Protocol Request Cancelled")
        }
    }

   func callbackWriteData(res: Dictionary<String, AnyObject>) -> Void {
        guard let chunk = res["_chunk"] as? String else {return;}
        let data: NSData? =  NSData(base64EncodedString: chunk, options: NSDataBase64DecodingOptions.IgnoreUnknownCharacters)

        if (!headersWritten) {
            _writeHeaders(res)
            self.client!.URLProtocol(self, didLoadData: data!)
        }
    }

    func callbackFile(res: Dictionary<String, AnyObject>) {
        if (self.isCancelled) {return}
        guard let path = res["path"] as? String else {return;}
        guard let url = NSURL(string: path) else {return;}
        let urlDecode = NKE_ProtocolFileDecode(url: url)

        if (urlDecode.exists()) {
            let data: NSData! = NSData(contentsOfFile: urlDecode.resourcePath! as String)

            if (!self.headersWritten) {
                _writeHeaders(res)
            }

            self.isLoading = false

            let response: NSURLResponse = NSURLResponse(URL: request.URL!, MIMEType: urlDecode.mimeType as String?, expectedContentLength: data.length, textEncodingName: urlDecode.textEncoding as String?)

            self.client!.URLProtocol(self, didReceiveResponse: response, cacheStoragePolicy: NSURLCacheStoragePolicy.AllowedInMemoryOnly)
            self.client!.URLProtocol(self, didLoadData: data)
            self.client!.URLProtocolDidFinishLoading(self)

        } else {
            log("!Missing File \(path)")
            self.client!.URLProtocol(self, didFailWithError: NSError(domain: NSURLErrorDomain, code: NSURLErrorFileDoesNotExist, userInfo:  nil))
        }
    }

    func callbackEnd(res: Dictionary<String, AnyObject>) {
        if (self.isCancelled) {return}
        if let _ = res["path"] as? String { return callbackFile(res);}

        guard let chunk = res["_chunk"] as? String else {return;}

        let data: NSData =  NSData(base64EncodedString: chunk, options: NSDataBase64DecodingOptions.IgnoreUnknownCharacters)!

        if (!self.headersWritten) {
            _writeHeaders(res)
        }

        self.isLoading = false

        self.client!.URLProtocol(self, didLoadData: data)
        self.client!.URLProtocolDidFinishLoading(self)
    }

    private func _writeHeaders(res: Dictionary<String, AnyObject>) {
        self.headersWritten = true
        let headers: Dictionary<String, String> = res["headers"] as? Dictionary<String, String> ?? Dictionary<String, String>()
        let version: String = "HTTP/1.1"
        let statusCode: Int = res["statusCode"] as? Int ?? 200

        if (statusCode == 302) {
            let location = headers["location"]!
            let url: NSURL = NSURL(string: location)!

            log("+Redirection location to \(url.absoluteString)")

            let response = NSHTTPURLResponse(URL: url, statusCode: statusCode, HTTPVersion: version, headerFields: headers)!

            self.client?.URLProtocol(self, wasRedirectedToRequest: NSURLRequest(URL: url), redirectResponse: response)
            self.isLoading = false
            self.client?.URLProtocolDidFinishLoading(self)

        } else {
            let response = NSHTTPURLResponse(URL: self.request.URL!, statusCode: statusCode, HTTPVersion: version, headerFields: headers)!
            self.client?.URLProtocol(self, didReceiveResponse: response, cacheStoragePolicy: NSURLCacheStoragePolicy.NotAllowed)
        }
    }
}
