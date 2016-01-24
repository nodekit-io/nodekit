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
 
 class NKC_SocketUDP: NSObject, NKScriptExport {
    
    class func attachTo(context: NKScriptContext) {
        let principal = NKC_SocketUDP()
        context.NKloadPlugin(principal, namespace: "io.nodekit.socket.Udp", options: [String:AnyObject]());
    }
    
    class func rewriteGeneratedStub(stub: String, forKey: String) -> String {
        switch (forKey) {
        case ".global":
            let url = NSBundle(forClass: NKC_SocketUDP.self).pathForResource("socket-udp", ofType: "js", inDirectory: "lib/nk-core")
            let appjs = try? NSString(contentsOfFile: url!, encoding: NSUTF8StringEncoding) as String
            return "function loadplugin(){\n" + appjs! + "\n}\n" + stub + "\n" + "loadplugin();" + "\n"
        default:
            return stub;
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
        return exclusion.contains(selector);
    }
    
    class func scriptNameForSelector(selector: Selector) -> String? {
        return selector == Selector("initWithId:") ? "" : nil
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
    
    private var _socket: GCDAsyncUdpSocket?
    private var _addr: String!;
    private var _port: UInt16;
    
    override init()
    {
        self._port = 0
        self._addr = nil
        self._socket = GCDAsyncUdpSocket()
        
        super.init()
        
        self._socket?.setDelegate(self, delegateQueue: dispatch_get_main_queue())
    }
 
    func bindSync(address: String, port: Int, flags: Int) -> String {
        self._addr = address as String;
        self._port = UInt16(port)
        var err: NSError? = nil
        
        if (flags == 4)
        {  do {
            try self._socket?.enableReusePort(true)
        } catch let error as NSError {
            err = error
        } catch {
            fatalError()
            }
        }
        
        if (self._addr != "0.0.0.0")
        {
            do {
                try self._socket?.bindToPort(self._port, interface: self._addr)
            } catch let error as NSError {
                err = error
            } catch {
                fatalError()
            }
        } else
        {
            do {
                try self._socket?.bindToPort(self._port)
            } catch let error as NSError {
                err = error
            } catch {
                fatalError()
            }
            
        }
        
        if ((err) != nil)
        {
            return err!.description
        }
        
        return "OK"
    }
    
    func recvStart() -> Void {
        
        var err: NSError? = nil
        do {
            try self._socket?.beginReceiving()
        } catch let error as NSError {
            err = error
        } catch {
            fatalError()
        }
        
        if ((err) != nil)
        {
            log("!UDP Error: \(err!.description)")
        }
    }
    
    func recvStop() -> Void {
        self._socket?.pauseReceiving()
        return
    }
    
    func send(str: String,  address: String, port: Int) -> Void {
        let data = NSData(base64EncodedString: str as String, options: NSDataBase64DecodingOptions(rawValue: 0))
        self._socket!.sendData(data, toHost: address, port: UInt16(port), withTimeout: -1, tag: 0)
    }
    
    func localAddressSync() -> Dictionary<String, AnyObject> {
        let address: String = self._socket!.localHost()
        let port : Int = Int(self._socket!.localPort())
        return  ["address": address, "port": port]
    }
    
    func addMembership(mcastAddr: String, ifaceAddr: String) -> Void {
         _ = try? self._socket?.joinMulticastGroup(mcastAddr as String!, onInterface: ifaceAddr as String!)
        // self._socket?.beginReceiving(&err)
    }
    
    func dropMembership(mcastAddr: String, ifaceAddr: String) -> Void {
       _ = try? self._socket?.leaveMulticastGroup(mcastAddr as String!, onInterface: ifaceAddr as String!)
        // self._socket?.beginReceiving(&err)
    }
    
    func setMulticastTTL(ttl: Int) -> Void {
        self.setSocketIPOptions(IP_MULTICAST_TTL, setting: ttl )
    }
    
    func setMulticastLoopback(flag: Bool) -> Void {
        self.setSocketIPOptions(IP_MULTICAST_LOOP, setting: (flag) ? 1 : 0 )
    }
    
    func setTTL(ttl: Int) -> Void {
        self.setSocketIPOptions(IP_TTL, setting: ttl )
    }
    
    func setBroadcast(flag: Bool) -> Void {
       _ = try? self._socket?.enableBroadcast(flag)
    }
    
    func close() -> Void {
        if (self._socket !== nil)
        {
            self._socket!.close()
            self._socket = nil;
        }
    }
    
    private func emitRecv(data: NSData!, host: String?, port: Int)
    {
        guard let host: String = host! else {return; }
        let str : String = data.base64EncodedStringWithOptions([])
        _ = try? self.NKscriptObject?.invokeMethod("emit", withArguments:["recv", str, host, port ])
    }
    
    private func setSocketIPOptions(option: Int32, setting: Int) -> Void
    {
        guard let socket : GCDAsyncUdpSocket = self._socket! else {return;}
        var value : Int32 = Int32(setting)
        
        socket.performBlock({
            if (socket.isIPv4())
            {
                setsockopt(socket.socketFD(), IPPROTO_IP, option, &value, socklen_t(sizeof(Int32)))
            }
            else
            {
                setsockopt(socket.socketFD(), IPPROTO_IPV6, option, &value, socklen_t(sizeof(Int32)))
            }
            
        })
    }

 }
 
 // GCDAsyncUdpSocket Delegate Methods
 extension NKC_SocketUDP: GCDAsyncUdpSocketDelegate {
    func udpSocket(sock: GCDAsyncUdpSocket!, didReceiveData data: NSData!, fromAddress address: NSData!, withFilterContext filterContext: AnyObject!) {
        
        var host:NSString?
        var port:UInt16 = 0
        GCDAsyncUdpSocket.getHost(&host, port: &port, fromAddress: address)
        self.emitRecv(data, host: host as String?, port: Int(port))
    }
 }