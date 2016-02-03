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
        var methods = instanceMethods(forProtocol: NKC_SwiftSocketProtocol.self)
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
    private var _socket: NKC_SwiftSocket?
    private var _server: NKC_SocketTCP?

    override init() {
        self._socket = NKC_SwiftSocket(domain: NKC_DomainAddressFamily.INET, type: NKC_SwiftSocketType.Stream, proto: NKC_CommunicationProtocol.TCP)
        super.init()
        self._socket!.setDelegate(self, delegateQueue: NKScriptChannel.defaultQueue /* dispatch_get_main_queue() */)
    }


    init(socket: NKC_SwiftSocket, server: NKC_SocketTCP?) {
        self._socket = socket
        self._server = server
          super.init()
    }

    // public methods
    func bindSync(address: String, port: Int) -> Int {
        do {
            try self._socket!.bind(host: address, port: Int32(port))
        } catch let error as NKC_Error {
            print("!Socket Bind Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
            return error.associated.value as? Int ?? 500
        } catch {
            fatalError()
        }
        return 0
    }

    func connect(address: String, port: Int) -> Void {
        do {
            try self._socket!.connect(host: address, port: Int32(port))
        } catch let error as NKC_Error {
            print("!Socket Connect Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
        } catch {
            fatalError()
        }
 
    }

    func listen(backlog: Int) -> Void {
        do {
            try self._socket!.listen(Int32(backlog))
        } catch let error as NKC_Error {
            print("!Socket Connect Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
        } catch {
            fatalError()
        }
        
     }

    func fdSync() -> Int {
        return Int(self._socket!.fd)
    }

    func remoteAddressSync() -> Dictionary<String, AnyObject> {
        let address: String = self._socket?.connectedHost ?? ""
        let port: Int = Int(self._socket?.connectedPort ?? 0)
        return ["address": address, "port": port]
    }

    func localAddressSync() -> Dictionary<String, AnyObject> {
        let address: String = self._socket!.localHost ?? ""
        let port: Int = Int(self._socket!.localPort ?? 0)
        return ["address": address, "port": port]
    }

    func writeString(string: String) -> Void {
        guard let data = NSData(base64EncodedString: string, options: NSDataBase64DecodingOptions(rawValue: 0)) else {return;}
        do {
            try self._socket?.write(data)
        } catch let error as NKC_Error {
            print("!Socket Send Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
        } catch {
            fatalError()
        }
        
    }

    func close() -> Void {
        if (self._socket !== nil) {
            
            do {
               try self._socket!.close()
            } catch let error as NKC_Error {
                print("!Socket Close Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
            } catch {
                fatalError()
            }
        }
        if (self._server !== nil) {
            self._server!.close()
        }
        self._socket = nil
        self._server = nil
    }
 }

 // DELEGATE METHODS FOR NKC_SwiftSocket
 extension NKC_SocketTCP: NKC_SwiftSocketProtocol {
    func socket(socket: NKC_SwiftSocket, didAcceptNewSocket newSocket: NKC_SwiftSocket) {
        let socketConnection = NKC_SocketTCP(socket: newSocket, server: self)
        connections.addObject(socketConnection)
        newSocket.setDelegate(socketConnection, delegateQueue: NKScriptChannel.defaultQueue /* dispatch_get_main_queue() */)
        
        self.emitConnection(socketConnection)
         do {
            try newSocket.beginReceiving(tag: 1)
        } catch let error as NKC_Error {
            print("!Socket Accept Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
        } catch {
            fatalError()
        }

    }
    
    func socket(socket: NKC_SwiftSocket, didConnectToHost host: String!, port: Int32) {
        self.emitAfterConnect(host, port: Int(port))
        do {
            try socket.beginReceiving(tag: 1)
        } catch let error as NKC_Error {
            print("!Socket Connect Receive Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
        } catch {
            fatalError()
        }
    }
    
    func socket(socket: NKC_SwiftSocket, didReceiveData data: NSData!, withTag tag: Int) {
        self.emitData(data)
    }
    
    func socket(socket: NKC_SwiftSocket, didReceiveData data: NSData!, sender host: String?, port: Int32) {
        self.emitData(data)
    }
    
    func socket(socket: NKC_SwiftSocket, didDisconnectWithError err: NSError) {
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

    private func emitAfterConnect(host: String, port: Int) {
        self.NKscriptObject?.invokeMethod("emit", withArguments:["afterConnect", host, port], completionHandler: nil)
    }

    private func emitData(data: NSData!) {
       let str: NSString! = data.base64EncodedStringWithOptions([])
        self.NKscriptObject?.invokeMethod("emit", withArguments: ["data", str], completionHandler: nil)
    }

    private func emitEnd() {
         self.NKscriptObject?.invokeMethod("emit", withArguments: ["end", ""], completionHandler: nil)
    }
 }
