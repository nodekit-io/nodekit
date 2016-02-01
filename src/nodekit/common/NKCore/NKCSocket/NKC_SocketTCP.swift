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


 class NKC_SocketTCP: NSObject, NKScriptExport {
    
    // NKScripting

    class func attachTo(context: NKScriptContext) {
        context.NKloadPlugin(NKC_SocketTCP.self, namespace: "io.nodekit.platform.TCP", options: [String:AnyObject]())
    }

    class func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
            let url = NSBundle(forClass: NKC_SocketTCP.self).pathForResource("tcp", ofType: "js", inDirectory: "lib/platform")
            let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
            return "function loadplugin(){\n" + appjs! + "\n}\n" + stub + "\n" + "loadplugin();" + "\n"
        default:
            return stub
        }
    }

    private static let exclusion: Set<Selector> = {
        var methods = instanceMethods(forProtocol: GCDAsyncSocketDelegate.self)
        //    methods.remove(Selector("invokeDefaultMethodWithArguments:"))
        return methods.union([
            //       Selector(".cxx_construct"),
            ])
    }()

    class func  isSelectorExcludedFromScript(selector: Selector) -> Bool {
        return exclusion.contains(selector)
    }

    class func scriptNameForSelector(selector: Selector) -> String? {
        return selector == Selector("init") ? "" : nil
    }

    // local variables and init

    private let connections: NSMutableSet = NSMutableSet()
    private var _addr: String!
    private var _port: Int
    private var _socket: GCDAsyncSocket?
    private var _server: NKC_SocketTCP?

    override init() {
        self._port = 0
        self._addr = nil
        self._socket = GCDAsyncSocket()
        super.init()
        self._socket!.setDelegate(self, delegateQueue: NKScriptChannel.defaultQueue /* dispatch_get_main_queue() */)
    }


    init(socket: GCDAsyncSocket, server: NKC_SocketTCP?) {
        self._socket = socket
        self._server = server
        self._port = 0
        self._addr = nil
        super.init()
    }

    // public methods
    func bind(address: String, port: Int) -> Void {
        self._addr = address as String!
        self._port = port
    }

    func connect(address: String, port: Int) -> Void {
        _ = try? self._socket!.connectToHost(address, onPort: UInt16(port))
    }

    func listen(backlog: Int) -> Void {
        if (self._addr != "0.0.0.0") {
            _ = try? self._socket!.acceptOnInterface(self._addr, port: UInt16(self._port))
        } else {
            _ = try? self._socket!.acceptOnPort( UInt16(self._port))
        }
    }

    func fdSync() -> Int {
        return self._socket!.hash
    }

    func remoteAddressSync() -> Dictionary<String, AnyObject> {
        let address: String = self._socket!.connectedHost
        let port: NSNumber = NSNumber(unsignedShort: self._socket!.connectedPort)
        return ["address": address, "port": port]
    }

    func localAddressSync() -> Dictionary<String, AnyObject> {
        let address: String? = self._socket!.localHost
        let port: Int = Int(self._socket!.localPort)
        if (address != nil) {
            return ["address": address!, "port": port]
        } else {
            return ["address": "", "port": 0]
        }
    }

    func writeString(string: String) -> Void {
        let data = NSData(base64EncodedString: string, options: NSDataBase64DecodingOptions(rawValue: 0))
        self._socket?.writeData(data, withTimeout: 10, tag: 1)
    }

    func close() -> Void {
        if (self._socket !== nil) {
            self._socket!.disconnect()
        }
        if (self._server !== nil) {
            self._server!.close()
        }
        self._socket = nil
        self._server = nil
        self._port = 0
        self._addr = nil
    }
 }

 // DELEGATE METHODS FOR GCDAsyncSocket
 extension NKC_SocketTCP {
    


    func socket(socket: GCDAsyncSocket, didAcceptNewSocket newSocket: GCDAsyncSocket) {
        let socketConnection = NKC_SocketTCP(socket: newSocket, server: self)
        connections.addObject(socketConnection)
        newSocket.setDelegate(socketConnection, delegateQueue: NKScriptChannel.defaultQueue /* dispatch_get_main_queue() */)

        self.emitConnection(socketConnection)
        newSocket.readDataWithTimeout(30, tag: 1)
    }

    func socket(sock: GCDAsyncSocket!, didConnectToHost host: String!, port: UInt16) {
        self.emitAfterConnect()
        sock.readDataWithTimeout(30, tag: 1)
    }

    func socket(socket: GCDAsyncSocket!, didReadData data: NSData!, withTag tag: Int) {
        self.emitData(data)
        socket.readDataWithTimeout(30, tag: 0)
    }

    func socketDidDisconnect(socket: GCDAsyncSocket, withError err: NSError) {
        self._socket = nil
        self.emitEnd()

        if (self._server != nil) {
            self._server!.connectionDidClose(self)
        }

        self._server = nil
    }

    // private methods

    private func connectionDidClose(socketConnection: NKC_SocketTCP) {
        connections.removeObject(socketConnection)
    }

    private func emitConnection(tcp: NKC_SocketTCP) -> Void {
        self.NKscriptObject?.invokeMethod("emit", withArguments: ["connection", tcp], completionHandler: nil)
    }

    private func emitAfterConnect() {
        self.NKscriptObject?.invokeMethod("emit", withArguments:["afterConnect", ""], completionHandler: nil)
    }

    private func emitData(data: NSData!) {
        let str: NSString! = data.base64EncodedStringWithOptions([])
        self.NKscriptObject?.invokeMethod("emit", withArguments: ["data", str], completionHandler: nil)
    }

    private func emitEnd() {
        self.NKscriptObject?.invokeMethod("emit", withArguments: ["end", ""], completionHandler: nil)
    }
 }
