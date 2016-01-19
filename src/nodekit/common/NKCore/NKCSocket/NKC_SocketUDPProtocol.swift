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
 
 @objc protocol NKC_SocketUDPProtocol: NKScriptExport {
    func bind (address: String, port: Int, flags: Int) -> String
    func recvStart() -> Void
    func recvStop() -> Void
    func send(str: String,  address: String, port: Int) -> Void
    func localAddress() -> Dictionary<String, AnyObject>
    func addMembership(mcastAddr: String, ifaceAddr: String) -> Void
    func dropMembership(mcastAddr: String, ifaceAddr: String) -> Void
    func setMulticastTTL(ttl: Int) -> Void
    func setMulticastLoopback(flag: Bool) -> Void
    func setTTL(ttl: Int) -> Void
    func setBroadcast(flag: Bool) -> Void
    func close() -> Void
  }