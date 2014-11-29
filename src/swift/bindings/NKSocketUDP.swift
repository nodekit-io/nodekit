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

 public class NKSocketUDP : NSObject, GCDAsyncUdpSocketDelegate {
    
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
    
    private var _udp : JSValue?
    private var _socket: GCDAsyncUdpSocket?

    private var _addr: String!;
    private var _port: UInt16;
    
    public override init()
    {
        self._port = 0
        self._addr = nil
        self._socket = GCDAsyncUdpSocket()
        
        self._udp  = NKJavascriptBridge.createNativeSocket()
        
        super.init()
        
        self._udp!.setObject(unsafeBitCast(self.block_bind, AnyObject.self), forKeyedSubscript:"bind")
        self._udp!.setObject(unsafeBitCast(self.block_recvStart, AnyObject.self), forKeyedSubscript:"recvStart")
        self._udp!.setObject(unsafeBitCast(self.block_recvStop, AnyObject.self), forKeyedSubscript:"recvStop")
        self._udp!.setObject(unsafeBitCast(self.block_send, AnyObject.self), forKeyedSubscript:"send")
        self._udp!.setObject(unsafeBitCast(self.block_localAddress, AnyObject.self), forKeyedSubscript:"localAddress")
        self._udp!.setObject(unsafeBitCast(self.block_addMembership, AnyObject.self), forKeyedSubscript:"addMembership")
        self._udp!.setObject(unsafeBitCast(self.block_dropMembership, AnyObject.self), forKeyedSubscript:"dropMembership")
        self._udp!.setObject(unsafeBitCast(self.block_setMulticastTTL, AnyObject.self), forKeyedSubscript:"setMulticastTTL")
        self._udp!.setObject(unsafeBitCast(self.block_setMulticastLoopback, AnyObject.self), forKeyedSubscript:"setMulticastLoopback")
        self._udp!.setObject(unsafeBitCast(self.block_setBroadcast, AnyObject.self), forKeyedSubscript:"setBroadcast")
        self._udp!.setObject(unsafeBitCast(self.block_setTTL, AnyObject.self), forKeyedSubscript:"setTTL")
        self._udp!.setObject(unsafeBitCast(self.block_close, AnyObject.self), forKeyedSubscript:"close")
        
        self._socket?.setDelegate(self, delegateQueue: dispatch_get_main_queue())
    }
    
    
    public func UDP() -> JSValue!
    {
        return self._udp!
     }
    
    private func emitRecv(data: NSData!, host: NSString!, port: NSNumber!)
    {
        var str : NSString! = data.base64EncodedStringWithOptions(.allZeros)
        dispatch_sync(NKGlobals.NKeventQueue, {
            
        self._udp!.invokeMethod( "emit", withArguments:["recv", str, host, port ])
            return
            
        });
    }
    
    lazy var block_bind : @objc_block (NSString!, NSNumber, NSNumber) -> NSString! = {
        (address: NSString!, port: NSNumber, flags: NSNumber) -> NSString! in
        
        self._addr = address;
        self._port = port.unsignedShortValue
        var err: NSError? = nil
        //TODO Use Flags = reuse address
        
        if (self._addr != "0.0.0.0")
        {
            self._socket?.bindToPort(self._port, interface: self._addr, error: &err)
        } else
        {
            self._socket?.bindToPort(self._port, error: &err)
            
        }
        
        if ((err) != nil)
        {
            return err!.description
        }
        
        return "OK"
    }
    
    lazy var block_recvStart : @objc_block () -> Void = {
        [unowned self] () -> Void in
        
        var err: NSError? = nil
        self._socket?.beginReceiving(&err)
        
        if ((err) != nil)
        {
            println(err!.description)
        }
    }
    
    lazy var block_recvStop : @objc_block () -> Void = {
        [unowned self] () -> Void  in
        self._socket?.pauseReceiving()
        return
    }
    
    lazy var block_close : @objc_block () -> Void = {
        () -> Void in
        if (self._socket !== nil)
        {
            self._socket!.close()
            self._socket = nil;
        }
    }
    
    public func setSocketIPOptions(option: Int32, setting: Int32) -> Void
    {
        var socket : GCDAsyncUdpSocket = self._socket!
        var value : Int32 = setting
        
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
    
    
    lazy var block_send : @objc_block (NSString!, NSString!, NSNumber) -> Void = {
        [unowned self] (str: NSString!,  address: NSString!, port: NSNumber) -> Void in
        
        var _addr : String! = address
        var _port : UInt16 = port.unsignedShortValue
        
        var data = NSData(base64EncodedString: str, options: .allZeros)
        self._socket!.sendData(data, toHost: _addr, port: _port, withTimeout: -1, tag: 0)
    }
    
    
    lazy var block_addMembership : @objc_block (NSString!, NSString!) -> Void = {
        [unowned self] (mcastAddr: NSString!, ifaceAddr: NSString!) -> Void in
        var err: NSError? = nil
        self._socket?.joinMulticastGroup(mcastAddr, onInterface: ifaceAddr, error: &err)
        // self._socket?.beginReceiving(&err)
    }
    
    lazy var block_dropMembership : @objc_block (NSString!, NSString!) -> Void = {
        [unowned self] (mcastAddr: NSString!, ifaceAddr: NSString!) -> Void in
        var err: NSError? = nil
        self._socket?.leaveMulticastGroup(mcastAddr, onInterface: ifaceAddr, error: &err)
       // self._socket?.beginReceiving(&err)
    }
    
    
    lazy var block_setMulticastTTL : @objc_block (NSNumber!) -> Void = {
        [unowned self] (ttl: NSNumber!) -> Void in
        
        self.setSocketIPOptions(IP_MULTICAST_TTL, setting: ttl.intValue )
        
    }
    lazy var block_setMulticastLoopback : @objc_block (NSNumber!) -> Void = {
        [unowned self] (flag: NSNumber!) -> Void in
        
            self.setSocketIPOptions(IP_MULTICAST_LOOP, setting: (flag.boolValue) ? 1 : 0 )
         }
    
    lazy var block_setTTL : @objc_block (NSNumber!) -> Void = {
        [unowned self] (ttl: NSNumber!) -> Void in
        
        self.setSocketIPOptions(IP_TTL, setting: ttl.intValue )
        
    }
    lazy var block_setBroadcast : @objc_block (NSNumber!) -> Void = {
        [unowned self] (flag: NSNumber!) -> Void in
        var err: NSError? = nil
        
        self._socket?.enableBroadcast(flag.boolValue, error: &err)
    }
    
    lazy var block_localAddress : @objc_block () -> JSValue = {
        [unowned self] () -> JSValue in
        var address: NSString! = self._socket!.localHost()
        var port : NSNumber = NSNumber(unsignedShort: self._socket!.localPort())
        var resultDictionary : NSDictionary = ["address": address, "port": port]
        var result = JSValue(object: resultDictionary, inContext: self._udp!.context)
        return result
    }
    
    // GCDAsyncUdpSocket Delegate Methods
    
    public func udpSocket(sock: GCDAsyncUdpSocket!, didReceiveData data: NSData!, fromAddress address: NSData!,      withFilterContext filterContext: AnyObject!) {
        
        var host:NSString?
        var port:UInt16 = 0
        GCDAsyncUdpSocket.getHost(&host, port: &port, fromAddress: address)
       self.emitRecv(data, host: host!, port: NSNumber(unsignedShort: port))
    }
    
}