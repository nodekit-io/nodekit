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
 
 import JavaScriptCore

public class NKSocketTCP: NKSocketTCPConnection {
    
    /*
    * Creates _tcp JSValue that inherits from EventEmitter
    * _tcp.on("connection", function(_tcp))
    * _tcp.on("afterConnect", function())
    * _tcp.on('data', function(chunk))
    * _tcp.on('end')
    * _tcp.writeBytes(data)
    * _tcp.fd returns {}
    * _tcp.remoteAddress  returns {String addr, int port}
    * _tcp.localAddress returns {String addr, int port}
    * _tcp.bind(String addr, int port)
    * _tcp.listen(int backlog)
    * _tcp.connect(String addr, int port)
    * _tcp.close()
    *
    */
    
    let connections: NSMutableSet = NSMutableSet()
    
    public init()
    {
        self._port = 0
        self._addr = nil
        let socket = GCDAsyncSocket()
        
        super.init(socket: socket, server: nil)
        
        self._tcp!.setObject(unsafeBitCast(self.block_bind, AnyObject.self), forKeyedSubscript:"bind")
        self._tcp!.setObject(unsafeBitCast(self.block_listen, AnyObject.self), forKeyedSubscript:"listen")
        self._tcp!.setObject(unsafeBitCast(self.block_connect, AnyObject.self), forKeyedSubscript:"connect")
        
        socket.setDelegate(self, delegateQueue: dispatch_get_main_queue())
    
    }
    
    private func emitConnection(tcp: JSValue!)
    {
    if (self._tcp != nil)
    {
      dispatch_sync(NKGlobals.NKeventQueue, {
        self._tcp!.invokeMethod("emit", withArguments:["connection", tcp])
        return
        
        });
        }
     }
    
    private func emitAfterConnect()
    {
        dispatch_sync(NKGlobals.NKeventQueue, {
            self._tcp!.invokeMethod("emit", withArguments:["afterConnect", self._tcp!])
            return
            
        });
    }
    
    private var _addr: String!;
    private var _port: UInt16;
    
    lazy var block_bind : @convention(block) (NSString!, NSNumber) -> Void = {
        [unowned self] (address: NSString!, port: NSNumber) -> Void in
        
        self._addr = address as String!;
        self._port = port.unsignedShortValue
    }
    
    lazy var block_listen : @convention(block) (NSNumber) -> Void = {
        [unowned self] (backlog: NSNumber) -> Void in
        var err: NSError?
        
        if (self._addr != "0.0.0.0")
        {
            var success: Bool
            do {
                try self._socket!.acceptOnInterface(self._addr, port: self._port)
                success = true
            } catch var error as NSError {
                err = error
                success = false
            } catch {
                fatalError()
            }
        } else
        {
            var success: Bool
            do {
                try self._socket!.acceptOnPort( self._port)
                success = true
            } catch var error as NSError {
                err = error
                success = false
            } catch {
                fatalError()
            }
        }
              
    }
    
    lazy var block_connect : @convention(block) (NSString!, NSNumber) -> Void = {
        [unowned self] (address: NSString!, port: NSNumber) -> Void in
        var _addr : String! = address as String!
        var _port : UInt16 = port.unsignedShortValue
        var err: NSError?
        
        var success: Bool
        do {
            try self._socket!.connectToHost(_addr, onPort: _port)
            success = true
        } catch var error as NSError {
            err = error
            success = false
        } catch {
            fatalError()
        }
    }
    
    public func socket(socket: GCDAsyncSocket, didAcceptNewSocket newSocket: GCDAsyncSocket){
        let socketConnection = NKSocketTCPConnection(socket: newSocket, server: self)
        connections.addObject(socketConnection)
        newSocket.setDelegate(socketConnection, delegateQueue: dispatch_get_main_queue())
        self.emitConnection(socketConnection.TCP())
        newSocket.readDataWithTimeout(30, tag: 1)
    }
    
    public func socket(sock: GCDAsyncSocket!, didConnectToHost host: String!, port: UInt16) {
        self.emitAfterConnect()
        sock.readDataWithTimeout(30, tag: 1)
    }
    
    public func connectionDidClose(socketConnection: NKSocketTCPConnection) {
        connections.removeObject(socketConnection)
    }
}

public class NKSocketTCPConnection: NSObject, GCDAsyncSocketDelegate {
  
    private var _tcp : JSValue?
    private var _socket: GCDAsyncSocket?
    private var _server: NKSocketTCP?
    
    public init(socket: GCDAsyncSocket, server: NKSocketTCP?)
    {
        self._socket = socket
        self._server = server
        let tcp = NKJavascriptBridge.createNativeStream()
        self._tcp = tcp
        
        super.init()
        
        tcp.setObject(unsafeBitCast(self.block_writeString, AnyObject.self), forKeyedSubscript:"writeString")
        tcp.setObject(unsafeBitCast(self.block_fd, AnyObject.self), forKeyedSubscript:"fd")
        tcp.setObject(unsafeBitCast(self.block_remoteAddress, AnyObject.self), forKeyedSubscript:"remoteAddress")
        tcp.setObject(unsafeBitCast(self.block_localAddress, AnyObject.self), forKeyedSubscript:"localAddress")
        tcp.setObject(unsafeBitCast(self.block_disconnect, AnyObject.self), forKeyedSubscript:"disconnect")
    }
    
    public func TCP() -> JSValue!
    {
        return self._tcp!
    }
    
    private func emitData(data: NSData!)
    {
        
         dispatch_sync(NKGlobals.NKeventQueue, {
            let str : NSString! = data.base64EncodedStringWithOptions([])
            self._tcp!.invokeMethod( "emit", withArguments:["data", str])
        });
        
    }
    
    private func emitEnd()
    {
        if (self._tcp != nil)
        {
        let tcp = self._tcp!;
         dispatch_sync(NKGlobals.NKeventQueue, {
            tcp.invokeMethod( "emit", withArguments:["end", ""])
            return
        });
        }
    }
    
    lazy var block_fd : @convention(block) () -> NSNumber = {
        [unowned self]  () -> NSNumber in
        return self._socket!.hash
    }
    
    lazy var block_remoteAddress : @convention(block) () -> JSValue = {
        [unowned self] () -> JSValue in
        var address: NSString! = self._socket!.connectedHost
        var port : NSNumber = NSNumber(unsignedShort: self._socket!.connectedPort)
        var resultDictionary : NSDictionary = ["address": address, "port": port]
        var result = JSValue(object: resultDictionary, inContext: self._tcp!.context)
        return result
    }
    
    lazy var block_localAddress : @convention(block) () -> JSValue = {
        [unowned self] () -> JSValue in
        var address: NSString! = self._socket!.localHost
        var port : NSNumber = NSNumber(unsignedShort: self._socket!.localPort)
        var resultDictionary : NSDictionary
        if (address != nil)
        {
           resultDictionary = ["address": address, "port": port]
        }
        else
        {
            
            
            resultDictionary =  ["address": "", "port": 0]
       }
        var result = JSValue(object: resultDictionary, inContext: self._tcp!.context)
        return result
    }
    
    lazy var block_writeString : @convention(block) (NSString!) -> Void = {
         [unowned self]  (str : NSString!) -> Void in
         var data = NSData(base64EncodedString: str as String, options: NSDataBase64DecodingOptions(rawValue: 0))
        self._socket!.writeData(data, withTimeout: 10, tag: 1)
    }
    
    lazy var block_disconnect : @convention(block) () -> Void = {
        () -> Void in
        if (self._socket !== nil)
        {
          self._socket!.disconnect()
        }
    }
    
    public func socket(socket: GCDAsyncSocket!, didReadData data: NSData!, withTag tag: Int){
        self.emitData(data)
        socket.readDataWithTimeout(30, tag: 0)
    }
    
    public func socketDidDisconnect(socket: GCDAsyncSocket, withError err: NSError){
        self._socket = nil
        self.emitEnd()
        if (self._tcp != nil )
        {
        self._tcp!.setObject(nil, forKeyedSubscript:"writeString")
        self._tcp!.setObject(nil, forKeyedSubscript:"fd")
        self._tcp!.setObject(nil, forKeyedSubscript:"remoteAddress")
        self._tcp!.setObject(nil, forKeyedSubscript:"localAddress")
        self._tcp!.setObject(nil, forKeyedSubscript:"disconnect")
        } 
        
        if (self._server != nil) {
            self._server!.connectionDidClose(self)
        } else
        {
            if (self._tcp != nil )
            {
            self._tcp!.setObject(nil, forKeyedSubscript:"bind")
            self._tcp!.setObject(nil, forKeyedSubscript:"listen")
            self._tcp!.setObject(nil, forKeyedSubscript:"connect")
            }
        }
        
        self._tcp = nil;
        self._server = nil;
    }
}