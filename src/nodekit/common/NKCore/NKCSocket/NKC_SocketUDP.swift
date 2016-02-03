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
 
  class NKC_SocketUDP: NSObject, NKScriptExport {

    class func attachTo(context: NKScriptContext) {
         context.NKloadPlugin(NKC_SocketUDP.self, namespace: "io.nodekit.platform.UDP", options: [String:AnyObject]())
    }

    class func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
            let url = NSBundle(forClass: NKC_SocketUDP.self).pathForResource("udp", ofType: "js", inDirectory: "lib/platform")
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

    /* NKSocketUDP
    * Creates _udp JSValue that inherits from EventEmitter
    *
    * _udp.bind(ip, port)
    * _udp.recvStart()
    * _udp.send(string, port, address)
    * _udp.recvStop()
    * _udp.localAddress returns {String addr, int port}
    * _udp.remoteAddress  returns {String addr, int port}
    * _udp.addMembership(mcastAddr, ifaceAddr)
    * _udp.setMulticastTTL(ttl)
    * _udp.setMulticastLoopback(flag);
    * _udp.setBroadcast(flag);
    * _udp.setTTL(ttl);
    *
    * emits 'recv'  (base64 chunk)
    *
    */

    private var _socket: NKC_SwiftSocket?
    private var _addr: String!
    private var _port: UInt16

    override init() {
        self._port = 0
        self._addr = nil
        self._socket = NKC_SwiftSocket(domain: NKC_DomainAddressFamily.INET, type: NKC_SwiftSocketType.Datagram, proto: NKC_CommunicationProtocol.UDP)
        
        super.init()

        self._socket?.setDelegate(self, delegateQueue: dispatch_get_main_queue())
    }

    func bindSync(address: String, port: Int, flags: Int) -> Int {
        self._addr = address as String
        self._port = UInt16(port)
 
        if (flags == 4) {  do {
            try self._socket?.setShouldReuseAddress(true)
        } catch let error as NKC_Error {
             print("!Socket Bind Socket Option: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
            return error.associated.value as? Int ?? 500
        } catch {
            fatalError()
            }
        }
        
        do {
            try self._socket?.bind(host: self._addr, port: Int32(port))
        } catch let error as NKC_Error {
            print("!Socket Bind Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
            return error.associated.value as? Int ?? 500
        } catch {
            fatalError()
        }

        return 0
    }

    func recvStart() -> Void {

       do {
            try self._socket?.beginReceiving(tag: nil)
        } catch let error as NKC_Error {
            print("Socket Error Receive Start: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
        } catch {
            fatalError()
        }
    }

    func recvStop() -> Void {
        self._socket?.pauseReceiving()
        return
    }

    func send(str: String,  address: String, port: Int) -> Void {
        guard let data = NSData(base64EncodedString: str, options: NSDataBase64DecodingOptions(rawValue: 0)) else {return;}
        do {
            try self._socket!.write(host: address, port: Int32(port), data: data, flags: 0, maxSize: 1024)
        } catch let error as NKC_Error {
            print("Socket Send Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
        } catch {
            fatalError()
        }
        
     }

    func localAddressSync() -> Dictionary<String, AnyObject> {
        let address: String = self._socket!.localHost ?? ""
        let port: Int = Int(self._socket!.localPort ?? 0)
        return ["address": address, "port": port]
    }

    func addMembership(mcastAddr: String, ifaceAddr: String) -> Void {
        do {
            try  self._socket?.addMembership(mcastAddr, ifaceAddr: ifaceAddr)
        } catch let error as NKC_Error {
            print("Socket Options Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
        } catch {
            fatalError()
        }
    }

    func dropMembership(mcastAddr: String, ifaceAddr: String) -> Void {
       do {
            try  self._socket?.addMembership(mcastAddr, ifaceAddr: ifaceAddr)
        } catch let error as NKC_Error {
            print("Socket Options Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
        } catch {
            fatalError()
        }

    }

    func setMulticastTTL(ttl: Int) -> Void {
        do {
            try  self._socket?.setSocketOption( IPPROTO_IP, option: IP_MULTICAST_TTL, setting: ttl)
        } catch let error as NKC_Error {
            print("Socket Options Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
        } catch {
            fatalError()
        }

    }

    func setMulticastLoopback(flag: Bool) -> Void {
        do {
            try  self._socket?.setSocketOption( IPPROTO_IP, option: IP_MULTICAST_LOOP,  setting: (flag) ? 1 : 0)
        } catch let error as NKC_Error {
            print("Socket Options Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
        } catch {
            fatalError()
        }

    }
    
    func setTTL(ttl: Int) -> Void {
        do {
            try self._socket?.setSocketOption( SOL_SOCKET, option: IP_TTL,  setting: ttl)
        } catch let error as NKC_Error {
            print("Socket Options Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
        } catch {
            fatalError()
        }

    }

    func setBroadcast(flag: Bool) -> Void {
       _ = try? self._socket?.setBroadcast(flag)
        do {
            try  self._socket?.setBroadcast(flag)
        } catch let error as NKC_Error {
            print("Socket Options Error: \(error.associated.value) \(error.associated.label) \(error.associated.posix)")
        } catch {
            fatalError()
        }

    }

    func disconnect() -> Void {
        if (self._socket !== nil) {
            _ = try? self._socket!.close()
            self._socket = nil
        }
    }

    private func emitRecv(data: NSData!, host: String?, port: Int) {
        guard let host: String = host! else {return; }
        let str: String = data.base64EncodedStringWithOptions([])
        self.NKscriptObject?.invokeMethod("emit", withArguments:["recv", str, host, port ], completionHandler: nil)
    }
 }

 // NKC_SwiftSocketProtocol Delegate Methods
 extension NKC_SocketUDP: NKC_SwiftSocketProtocol {
    func socket(socket: NKC_SwiftSocket, didReceiveData data: NSData!, sender host: String?, port: Int32) {
          self.emitRecv(data, host: host, port: Int(port))
    }
 }
 