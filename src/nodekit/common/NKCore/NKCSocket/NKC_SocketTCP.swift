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
 
 /*
 * Creates _tcp javascript value that inherits from EventEmitter
 * _tcp.on("connection", function(_tcp))
 * _tcp.on("afterConnect", function())
 * _tcp.on('data', function(chunk))
 * _tcp.on('end')
 * _tcp.writeBytes(data)
 * _tcp.fd returns {fd}
 * _tcp.remoteAddress  returns {String addr, int port}
 * _tcp.localAddress returns {String addr, int port}
 * _tcp.bind(String addr, int port)
 * _tcp.listen(int backlog)
 * _tcp.connect(String addr, int port)
 * _tcp.close()
 *
 */
 
 import JavaScriptCore
 
 class NKC_SocketTCPConnection: NSObject {
    
    class func attachTo(context: NKScriptContext) {
        context.NKloadPlugin(NKC_SocketTCPConnection.self, namespace: "io.nodekit.socket._TcpConnection", options: [String:AnyObject]());
    }
    
    class func scriptNameForSelector(selector: Selector) -> String? {
        return selector == Selector("initWithId:") ? "" : nil
    }
    
    private var _tcp : JSValue?
    private var _socket: GCDAsyncSocket?
    private var _server: NKC_SocketTCP?
    
    override init()
    {
    }
    
    init(id: Int)
    {
        
    }
    
    init(socket: GCDAsyncSocket, server: NKC_SocketTCP?)
    {
        self._socket = socket
        self._server = server
        super.init()
    }
    
    private func emitData(data: NSData!)
    {
        dispatch_sync(NKGlobals.NKeventQueue, {
            let str : NSString! = data.base64EncodedStringWithOptions([])
                self.NKscriptObject?.invokeMethod("emit", withArguments: ["data", str], completionHandler: nil)
        });
    }
    
    private func emitEnd()
    {
        dispatch_sync(NKGlobals.NKeventQueue, {
            self.NKscriptObject?.invokeMethod("emit", withArguments: ["end", ""], completionHandler: nil)
        });
    }
 }
 
 // METHODS EXPOSED TO JAVASCRIPT
 extension NKC_SocketTCPConnection: NKC_SocketTCPConnection_Protocol {
    func fd() -> Int {
        return self._socket!.hash
    }
    
    func remoteAddress() -> Dictionary<String, AnyObject> {
        let address: String = self._socket!.connectedHost
        let port : NSNumber = NSNumber(unsignedShort: self._socket!.connectedPort)
        return ["address": address, "port": port]
    }
    
    func localAddress() -> Dictionary<String, AnyObject> {
        let address: String? = self._socket!.localHost
        let port : Int = Int(self._socket!.localPort)
        if (address != nil)
        {
            return ["address": address!, "port": port]
        }
        else
        {
            return ["address": "", "port": 0]
        }
    }
    
    func writeString(string: String) -> Void {
        let data = NSData(base64EncodedString: string, options: NSDataBase64DecodingOptions(rawValue: 0))
        self._socket!.writeData(data, withTimeout: 10, tag: 1)
    }
    func disconnect() -> Void {
        if (self._socket !== nil)
        {
            self._socket!.disconnect()
        }
        
    }
 }
 
 // DELEGATE METHODS FOR GCDAsyncSocket
 extension NKC_SocketTCPConnection: GCDAsyncSocketDelegate {
    func socket(socket: GCDAsyncSocket!, didReadData data: NSData!, withTag tag: Int){
        self.emitData(data)
        socket.readDataWithTimeout(30, tag: 0)
    }
    
    func socketDidDisconnect(socket: GCDAsyncSocket, withError err: NSError){
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
 
 class NKC_SocketTCP: NKC_SocketTCPConnection, NKC_SocketTCP_Protocol {
    
    override class func attachTo(context: NKScriptContext) {
        let principal = NKC_SocketTCP()
        context.NKloadPlugin(principal, namespace: "io.nodekit.socket._Tcp", options: [String:AnyObject]());
    }
    
    func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
            let url = NSBundle(forClass: NKE_WebContentsBase.self).pathForResource("socket-tcp", ofType: "js", inDirectory: "lib/nk-core")
            let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
            return "function loadplugin(){\n" + appjs! + "\n}\n" + stub + "\n" + "loadplugin();" + "\n"
        default:
            return stub;
        }
    }
    
    override class func scriptNameForSelector(selector: Selector) -> String? {
        return selector == Selector("init:") ? "" : nil
    }

    let connections: NSMutableSet = NSMutableSet()
    
    override init()
    {
        self._port = 0
        self._addr = nil
        let socket = GCDAsyncSocket()
        
        super.init(socket: socket, server: nil)
        
        socket.setDelegate(self, delegateQueue: dispatch_get_main_queue())
    }
    
    private func emitConnection(tcp: JSValue!) -> Void
    {
        _ = try? self.NKscriptObject?.invokeMethod("emit", withArguments:["connection", tcp]);
    }
    
    private func emitAfterConnect()
    {
        _ = try? self.NKscriptObject?.invokeMethod("emit", withArguments:["afterConnect", self._tcp!])
    }
    
    private var _addr: String!;
    private var _port: Int;
    
    func bind(address: String, port: Int) -> Void {
        self._addr = address as String!;
        self._port = port
    }
    
    func connect(address: String, port: Int) -> Void {
        _ = try? self._socket!.connectToHost(address, onPort: UInt16(port))
    }
    
    func listen(backlog: Int) -> Void {
        if (self._addr != "0.0.0.0")
        {
            _ = try? self._socket!.acceptOnInterface(self._addr, port: UInt16(self._port))
        } else
        {
            _ = try? self._socket!.acceptOnPort( UInt16(self._port))
        }
    }
 }
 
 // DELEGATE METHODS FOR GCDAsyncSocket (protocol conformance already declared in base class below)
 extension NKC_SocketTCP {
   func socket(socket: GCDAsyncSocket, didAcceptNewSocket newSocket: GCDAsyncSocket){
        let socketConnection = NKC_SocketTCPConnection(socket: newSocket, server: self)
        connections.addObject(socketConnection)
        newSocket.setDelegate(socketConnection, delegateQueue: dispatch_get_main_queue())
        self.emitConnection(socketConnection.TCP())
        newSocket.readDataWithTimeout(30, tag: 1)
    }
    
    func socket(sock: GCDAsyncSocket!, didConnectToHost host: String!, port: UInt16) {
        self.emitAfterConnect()
        sock.readDataWithTimeout(30, tag: 1)
    }
    
    func connectionDidClose(socketConnection: NKC_SocketTCPConnection) {
        connections.removeObject(socketConnection)
    }
 }
 