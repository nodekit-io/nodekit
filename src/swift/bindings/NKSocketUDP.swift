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

public class NKSocketUDP: NKSocketUDPConnection {
    
    /*
    * Creates _udp JSValue that inherits from EventEmitter
    * _udp.on("connection", function(_udp))
    * _udp.on("afterConnect", function())
    * _udp.on('data', function(chunk))
    * _udp.on('end')
    * _udp.writeBytes(data)
    * _udp.fd returns {}
    * _udp.remoteAddress  returns {String addr, int port}
    * _udp.localAddress returns {String addr, int port}
    * _udp.bind(String addr, int port)
    * _udp.listen(int backlog)
    * _udp.connect(String addr, int port)
    * _udp.close()
    *
    */
    
    let connections: NSMutableSet = NSMutableSet()
    
    public init()
    {
        self._port = 0
        self._addr = nil
        var socket = GCDAsyncSocket()
        
        super.init(socket: socket, server: nil)
        
        self._udp!.setObject(unsafeBitCast(self.block_bind, AnyObject.self), forKeyedSubscript:"bind")
        self._udp!.setObject(unsafeBitCast(self.block_listen, AnyObject.self), forKeyedSubscript:"listen")
        self._udp!.setObject(unsafeBitCast(self.block_connect, AnyObject.self), forKeyedSubscript:"connect")
        
        socket.setDelegate(self, delegateQueue: dispatch_get_main_queue())
    }
    
    private func emitConnection(udp: JSValue!)
    {
        self._udp!.invokeMethod("emit", withArguments:["connection", udp])
    }
    
    private func emitAfterConnect()
    {
         self._udp!.invokeMethod("emit", withArguments:["afterConnect", self._udp!])
    }
    
    private var _addr: String!;
    private var _port: UInt16;
    
    lazy var block_bind : @objc_block (NSString!, NSNumber) -> Void = {
        [unowned self] (address: NSString!, port: NSNumber) -> Void in
        
        self._addr = address;
        self._port = port.unsignedShortValue
    }
    
    lazy var block_listen : @objc_block (NSNumber) -> Void = {
        [unowned self] (backlog: NSNumber) -> Void in
        var err: NSError?
        var success = self._socket!.acceptOnInterface(self._addr, port: self._port, error: &err)
    }
    
    lazy var block_connect : @objc_block (NSString!, NSNumber) -> Void = {
        [unowned self] (address: NSString!, port: NSNumber) -> Void in
        var _addr : String! = address
        var _port : UInt16 = port.unsignedShortValue
        var err: NSError?
        
        var success = self._socket!.connectToHost(_addr, onPort: _port, error: &err)
    }
    
    public func socket(socket: GCDAsyncSocket, didAcceptNewSocket newSocket: GCDAsyncSocket){
        var socketConnection = NKSocketUDPConnection(socket: newSocket, server: self)
        connections.addObject(socketConnection)
        newSocket.setDelegate(socketConnection, delegateQueue: dispatch_get_main_queue())
        self.emitConnection(socketConnection.UDP())
        newSocket.readDataWithTimeout(30, tag: 1)
    }
    
    public func socket(sock: GCDAsyncSocket!, didConnectToHost host: String!, port: UInt16) {
        self.emitAfterConnect()
        sock.readDataWithTimeout(30, tag: 1)
    }
    
    public func connectionDidClose(socketConnection: NKSocketUDPConnection) {
        connections.removeObject(socketConnection)
    }
}

public class NKSocketUDPConnection: NSObject, GCDAsyncSocketDelegate {
  
    private var _udp : JSValue?
    private var _socket: GCDAsyncSocket?
    private var _server: NKSocketUDP?
    
    public init(socket: GCDAsyncSocket, server: NKSocketUDP?)
    {
        self._socket = socket
        self._server = server
        var udp = NKJavascriptBridge.createNativeStream()
        self._udp = udp
        
        super.init()
        
        udp.setObject(unsafeBitCast(self.block_writeString, AnyObject.self), forKeyedSubscript:"writeString")
        udp.setObject(unsafeBitCast(self.block_fd, AnyObject.self), forKeyedSubscript:"fd")
        udp.setObject(unsafeBitCast(self.block_remoteAddress, AnyObject.self), forKeyedSubscript:"remoteAddress")
        udp.setObject(unsafeBitCast(self.block_localAddress, AnyObject.self), forKeyedSubscript:"localAddress")
        udp.setObject(unsafeBitCast(self.block_disconnect, AnyObject.self), forKeyedSubscript:"disconnect")
    }
    
    public func UDP() -> JSValue!
    {
        return self._udp!
    }
    
    private func emitData(data: NSData!)
    {
        var str : NSString! = data.base64EncodedStringWithOptions(.allZeros)
        self._udp!.invokeMethod( "emit", withArguments:["data", str])
    }
    
    private func emitEnd()
    {
        self._udp!.invokeMethod( "emit", withArguments:["end", ""])
       
    }
    
    lazy var block_fd : @objc_block () -> NSNumber = {
        [unowned self]  () -> NSNumber in
        return self._socket!.hash
    }
    
    lazy var block_remoteAddress : @objc_block () -> JSValue = {
        [unowned self] () -> JSValue in
        var address: NSString! = self._socket!.connectedHost
        var port : NSNumber = NSNumber(unsignedShort: self._socket!.connectedPort)
        var resultDictionary : NSDictionary = ["address": address, "port": port]
        var result = JSValue(object: resultDictionary, inContext: self._udp!.context)
        return result
    }
    
    lazy var block_localAddress : @objc_block () -> JSValue = {
        [unowned self] () -> JSValue in
        var address: NSString! = self._socket!.localHost
        var port : NSNumber = NSNumber(unsignedShort: self._socket!.localPort)
        var resultDictionary : NSDictionary = ["address": address, "port": port]
        var result = JSValue(object: resultDictionary, inContext: self._udp!.context)
        return result
    }
    
    lazy var block_writeString : @objc_block (NSString!) -> Void = {
         [unowned self]  (str : NSString!) -> Void in
         var data = NSData(base64EncodedString: str, options: .allZeros)
        self._socket!.writeData(data, withTimeout: 10, tag: 1)
    }
    
    lazy var block_disconnect : @objc_block () -> Void = {
        () -> Void in
        if (self._socket !== nil)
        {
          self._socket!.disconnect()
        }
    }
    
    public func socket(socket: GCDAsyncSocket, didReadData data: NSData, withTag tag: Double){
        self.emitData(data)
        socket.readDataWithTimeout(30, tag: 0)
    }
    
    public func socketDidDisconnect(socket: GCDAsyncSocket, withError err: NSError){
        self._socket = nil;
        self.emitEnd()
        self._udp!.setObject(nil, forKeyedSubscript:"writeString")
        self._udp!.setObject(nil, forKeyedSubscript:"fd")
        self._udp!.setObject(nil, forKeyedSubscript:"remoteAddress")
        self._udp!.setObject(nil, forKeyedSubscript:"localAddress")
        self._udp!.setObject(nil, forKeyedSubscript:"close")
        
        if (self._server? != nil) {
            self._server!.connectionDidClose(self)
        } else
        {
            self._udp!.setObject(nil, forKeyedSubscript:"bind")
            self._udp!.setObject(nil, forKeyedSubscript:"listen")
            self._udp!.setObject(nil, forKeyedSubscript:"connect")
        }
        
        self._udp = nil;
        self._server = nil;
    }
}