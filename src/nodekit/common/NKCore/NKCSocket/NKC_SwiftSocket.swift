/*
* nodekit.io {NK} Core Swift Sockets
*
* Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
* Portions Copyright © 2016 Pilot Foundation. All rights reserved.
* Portions Copyright © 2015 Andrew Thompson. All rights reserved
* Based on Pilot/Connection Socket.Swift by Jeremy Tregunna on 2016-01-27.
* and MrWerdo/Socket Socket.Swift by Andrew Thompson on 10/12/2015.
* Portions Copyright © 2015 Wess Cope. All rights reserved.
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

import Darwin
import Dispatch
import Foundation
import CoreFoundation

@objc protocol NKC_SwiftSocketProtocol: class {
    func socket(socket: NKC_SwiftSocket, didAcceptNewSocket newSocket: NKC_SwiftSocket)
    func socket(socket: NKC_SwiftSocket, didConnectToHost host: String!, port: Int32)
    func socket(socket: NKC_SwiftSocket, didReceiveData data: NSData!, withTag tag: Int)
    func socket(socket: NKC_SwiftSocket, didReceiveData data: NSData!, sender host: NSString?, port: Int32)
    func socket(socket: NKC_SwiftSocket, didDisconnectWithError err: NSError)
}

class NKC_SwiftSocket: NSObject {
    
    var fd      : Int32
    var isValid: Bool { return fd >= 0 }

    var address : NKC_AddrInfo
    
    private(set)    lazy var peerAddress: NKC_AddrInfo? = {
        [unowned self] in
        return self._getPeerAddress()
        }()
    private(set)    lazy var connectedHost: String? = {
        [unowned self] in
        return self.peerAddress?.hostname
        }()
    private(set)    lazy var connectedPort: Int32? = {
        [unowned self] in
         return self.peerAddress?.port
        }()
    private(set)    lazy var localHost: String? = {
        [unowned self] in
        return self.address.hostname
        }()
    private(set)    lazy var localPort: Int32? = {
        [unowned self] in
        return self.address.port
        }()
    
    private var closed  : Bool = true
    private var shouldReuseAddress: Bool = false
    
    var queue: dispatch_queue_t?  = nil
    var sendCount: Int = 0
    var closeRequested: Bool = false
    var didCloseRead: Bool = false
    var nkDelegate: NKC_SwiftSocketProtocol? = nil
    var nkDelegateQueue: dispatch_queue_t?  = nil
    
    var readSource: dispatch_source_t? = nil
    var listenSource: dispatch_source_t? = nil
    
    var readTag: Int? = nil
    var readBufferPtr  = UnsafeMutablePointer<CChar>.alloc(4096 + 2)
    var readBufferSize : Int = 4096 {
        didSet {
            if readBufferSize != oldValue {
                readBufferPtr.dealloc(oldValue + 2)
                readBufferPtr = UnsafeMutablePointer<CChar>.alloc(readBufferSize + 2)
            }
        }
    }
    
    /// Constructs an instance from a pre-exsisting file descriptor and address.
    init(socket: Int32, address addr: addrinfo,
        shouldReuseAddress: Bool = false) {
            fd = socket
            address = NKC_AddrInfo(copy: addr)
            closed = true
            self.shouldReuseAddress = shouldReuseAddress
      }
    
    /// Constructs a socket from the given requirements.
    init(
        domain: NKC_DomainAddressFamily,
        type: NKC_SwiftSocketType,
        proto: NKC_CommunicationProtocol
         ) {
            fd = Darwin.socket(
                domain.systemValue,
                type.systemValue,
                proto.systemValue
            )
            address = NKC_AddrInfo()
            address.addrinfo.ai_family = domain.systemValue
            address.addrinfo.ai_socktype = type.systemValue
            address.addrinfo.ai_protocol = proto.systemValue
            closed = true
    }
    
    /// Copys `address` and initalises the socket from the `fd` given.
    private init(copy address: NKC_AddrInfo, fd: Int32) {
        self.address = address
        self.closed = true
        self.fd = fd
    }
    
    func setDelegate(delegate: NKC_SwiftSocketProtocol, delegateQueue: dispatch_queue_t) {
        self.nkDelegate = delegate
        self.nkDelegateQueue = delegateQueue
    }
    
    /// Re-initalises the socket to a 'new' state
   private func initaliseSocket() throws {
        if !closed {
            try close()
        }
        fd = Darwin.socket(
            address.addrinfo.ai_family,
            address.addrinfo.ai_socktype,
            address.addrinfo.ai_protocol
        )
        guard fd != -1 else {
            throw NKC_SwiftSocketError.CreationFailed(errno)
        }
        closed = false
        try setShouldReuseAddress(shouldReuseAddress)
    }

    
    /// Shuts down the socket, signaling that either all reading has finished,
    /// all writing has finished, or both reading and writing have finished.
    func shutdown(method: NKC_ShutdownMethod) throws {
        guard Darwin.shutdown(
            fd,
            method.systemValue
            ) == 0 else {
                throw NKC_SwiftSocketError.ShutdownFailed(errno)
        }
    }
    
    /// Closes the socket.  No further operations allowed
    func close() throws {
        nkDelegate = nil;
        
        guard isValid else {
            return
        }
        
        if readSource != nil {
            stopReadEvents()
            try self.shutdown(NKC_ShutdownMethod.PreventRead)
        }
        
        if sendCount > 0 {
            closeRequested = true
            // will re-enter close after writing complete
            return
        }
        
        queue = nil
        
        if listenSource != nil {
            closeRequested = true;
            dispatch_source_cancel(listenSource!)
            listenSource = nil
        }
        
        if !closed {
            guard Darwin.close(
                fd
                ) == 0 else {
                    throw NKC_SwiftSocketError.CloseFailed(errno)
            }
            closed = true
        }
    }
    
    deinit {
        if !closed {
            do { try close() } catch {}
        }
        readBufferPtr.dealloc(readBufferSize + 2)
    }
    
    /// Binds the socket to the given address and port without performing any
    /// name resolution.
    func bind(address address: NKC_AddrInfo, port: Int32) throws {
        guard port >= 0 else {
            throw NKC_SwiftSocketError.ParameterError(
                "Invalid port number - port cannot be negative"
            )
        }
        try address.setPort(port)
        guard Darwin.bind(fd,
            address.addrinfo.ai_addr,
            address.addrinfo.ai_addrlen
            ) == 0 else {
                throw NKC_SwiftSocketError.BindFailed(errno)
        }
        self.address = self._getLocalAddress()!
    }
    
    /// Binds the socket to the given hostname and port, performing host name
    /// resolution.
    func bind(host hostname: String, port: Int32) throws {
        guard port >= 0 else {
            throw NKC_SwiftSocketError.ParameterError(
                "Invalid port number - port cannot be negative"
            )
        }
        
        var hints = Darwin.addrinfo()
        hints.ai_socktype   = address.addrinfo.ai_socktype
        hints.ai_protocol   = address.addrinfo.ai_protocol
        hints.ai_family     = address.addrinfo.ai_family
        hints.ai_flags      = address.addrinfo.ai_flags
        
        var errors: [Int32] = []
        let hosts = try getaddrinfo(host: hostname, service: nil, hints: &hints)
        for host in hosts
        {
            try host.setPort(port)
            try initaliseSocket()
            
            guard Darwin.bind(
                fd,
                host.addrinfo.ai_addr,
                host.addrinfo.ai_addrlen
                ) == 0 else {
                    errors.append(errno)
                    try close()
                    continue
            }
            
            self.address = self._getLocalAddress()!
            return
        }
        throw NKC_SwiftSocketError.NoAddressesAvailable(errors)
    }
    
    /// Binds the socket to the given address on the file system. Use this for Local
    /// (aka Unix) socket connections.
    func bind(file file: String, shouldUnlink unlinkFile: Bool = true)
        throws {
            let length = file.lengthOfBytesUsingEncoding(NSUTF8StringEncoding)
            var addr_un = sockaddr_un()
            addr_un.sun_family = UInt8(address.addrinfo.ai_family)
            addr_un.setPath(file, length: length)
            
            UnsafeMutablePointer<Darwin.sockaddr_un>(
                address.addrinfo.ai_addr
                ).memory = addr_un
            address.addrinfo.ai_addrlen = UInt32(sizeof(sockaddr_un))
            
            if unlinkFile {
                try unlink(file, errorOnFNF: false)
            }
            
            guard Darwin.bind(
                fd,
                address.addrinfo.ai_addr,
                address.addrinfo.ai_addrlen
                ) == 0
                else {
                    throw NKC_SwiftSocketError.BindFailed(errno)
            }
    }
    
    
    func listen( backlog: Int32 = 5) throws
    {
        guard backlog >= 0 else {
            throw NKC_SwiftSocketError.ParameterError(
                "Backlog cannot be less than zero."
            )
        }
        
        if queue == nil {
            queue = dispatch_queue_create("io.nodekit.platform.socket", DISPATCH_QUEUE_CONCURRENT)
        }
        
        guard let listenSource = dispatch_source_create(
            DISPATCH_SOURCE_TYPE_READ,
            UInt(fd),
            0,
            queue
            )
            else {
                throw NKC_SwiftSocketError.DispatchFailed(errno)
        }
        self.listenSource = listenSource;

        listenSource.onEvent {  _, _  in
            repeat {
            
            let sockStorage = UnsafeMutablePointer<sockaddr_storage>.alloc(
            sizeof(sockaddr_storage)
            )
            
            let sockAddr = UnsafeMutablePointer<Darwin.sockaddr>(sockStorage)
            var length = socklen_t(sizeof(sockaddr_storage))
            
            let success = Darwin.accept(self.fd, sockAddr, &length)
            
            if success != -1 {
                var addrinfo = Darwin.addrinfo()
                addrinfo.ai_socktype   = self.address.addrinfo.ai_socktype
                addrinfo.ai_protocol   = self.address.addrinfo.ai_protocol
                addrinfo.ai_family     = self.address.addrinfo.ai_family
                addrinfo.ai_flags      = self.address.addrinfo.ai_flags
                addrinfo.ai_canonname = nil
                addrinfo.ai_addr = sockAddr
                
                let addr = NKC_AddrInfo(claim: addrinfo)

                let newSocket = NKC_SwiftSocket(copy: addr, fd: success)
                
                if let delegate = self.nkDelegate
                {
                    dispatch_async(self.nkDelegateQueue!) {
                        delegate.socket(self, didAcceptNewSocket: newSocket)
                    }
                }
            }
            else if errno == EWOULDBLOCK {
                break;
            }
            else {
            if (!self.closeRequested) {
                    log("!Failed to accept() socket: \(self) \(errno)")
                }
                break;
            }
        
            } while (true);
        }
        
        dispatch_resume(listenSource)
        
        guard Darwin.listen(
            fd,
            backlog
            ) == 0 else {
            dispatch_source_cancel(listenSource)
            throw NKC_SwiftSocketError.ListenFailed(errno)
        }
        
    }
    
    /// Connects the socket to the given hostname and port number.
    func connect(host hostname: String, port: Int32) throws {
    
        guard port >= 0 else {
            throw NKC_SwiftSocketError.ParameterError(
                "Invalid port number - port cannot be negative"
            )
        }
        
        /// This function uses `getaddrinfo(hostname:service:hints:)` for obtaining
        /// an address, and passes a copy of `self.address` as the parameter for
        /// hints. To pass any hints to `getaddrinfo(host:service:hints)`
        /// set them on `self.address`. Upon a successful call to connect,
        /// `self.address` will be updated with the new address assigned.
        
        var hints = addrinfo()
        hints.ai_socktype   = address.addrinfo.ai_socktype
        hints.ai_protocol   = address.addrinfo.ai_protocol
        hints.ai_family     = address.addrinfo.ai_family
        hints.ai_flags      = address.addrinfo.ai_flags
        
        var errors: [Int32] = []
        let hosts = try getaddrinfo(host: hostname, service: nil, hints: &hints)
        for host in hosts
        {
            try host.setPort(port)
            try initaliseSocket()
            
            guard Darwin.connect(
                fd,
                host.addrinfo.ai_addr,
                host.addrinfo.ai_addrlen
                ) == 0 else {
                    errors.append(errno)
                    try close()
                    continue
            }
            
             self.address = self._getLocalAddress()!
            if let delegate = self.nkDelegate
            {
                dispatch_async(nkDelegateQueue!) {
                        delegate.socket(self, didConnectToHost: host.hostname!, port: port )
                }
            }
     
            
        }
        throw NKC_SwiftSocketError.NoAddressesAvailable(errors)
    }
    
    /// Connects the socket to the given address and port number.
     func connect(address address: NKC_AddrInfo, port: Int32) throws {
        guard port >= 0 else {
            throw NKC_SwiftSocketError.ParameterError(
                "Invalid port number - port cannot be negative"
            )
        }
        try address.setPort(port)
        address.addrinfo.ai_addrlen = UInt32(
            sizeofValue(address.addrinfo.ai_addr.memory)
        )
        guard Darwin.connect(
            fd,
            address.addrinfo.ai_addr,
            address.addrinfo.ai_addrlen
            ) == 0 else {
                throw NKC_SwiftSocketError.ConnectFailed(errno)
        }
        self.address = address
        if let delegate = self.nkDelegate
        {
            dispatch_async(nkDelegateQueue!) {
                delegate.socket(self, didConnectToHost: address.hostname!, port: port )
            }
        }
    }
    
    /// Connects the socket given file address on the system.
    func connect(file file: String) throws {
        let length = file.lengthOfBytesUsingEncoding(NSUTF8StringEncoding)
        var addr_un = sockaddr_un()
        addr_un.sun_family = sa_family_t(address.addrinfo.ai_family)
        addr_un.setPath(file, length: length)
        
        UnsafeMutablePointer<Darwin.sockaddr_un>(
            address.addrinfo.ai_addr
            ).memory = addr_un
        address.addrinfo.ai_addrlen = socklen_t(sizeof(sockaddr_un))
        
        guard Darwin.connect(
            fd,
            address.addrinfo.ai_addr,
            address.addrinfo.ai_addrlen
            ) == 0
            else {
                throw NKC_SwiftSocketError.ConnectFailed(errno)
        }
        
    }
    
    private func _write(data: dispatch_data_t) {
        sendCount++
        
        dispatch_write(fd, data, queue!) {
            asyncData, error in
            
            self.sendCount = self.sendCount - 1
            
            if self.sendCount == 0 && self.closeRequested {
                  _ = try? self.close()
                self.closeRequested = false
            }
        }
    }
    
    func writeAsync<T>(buffer: [T]) -> Bool {
        
        let writelen = buffer.count
        let bufsize  = writelen * sizeof(T)
        guard bufsize > 0 else {
            return true
        }
        
        if queue == nil {
            queue = dispatch_get_main_queue()
        }
        
        guard let asyncData = dispatch_data_create(buffer,bufsize, queue,nil) else {
            return false
        }
        
        _write(asyncData)
        return true
    }
    
    func writeAsync<T>(buffer: UnsafePointer<T>, length:Int) -> Bool {
        
        let writelen = length
        let bufsize  = writelen * sizeof(T)
        guard bufsize > 0 else {
            return true
        }
        
        if queue == nil {
             queue = dispatch_get_main_queue()
        }
        
        guard let asyncData = dispatch_data_create(buffer,bufsize, queue,nil) else {
            return false
        }
        
        _write(asyncData)
        return true
    }

    
    /// Sends `data` to the connected peer
    func write(data: UnsafePointer<Void>, length: Int, flags: Int32 = 0,
        maxSize: Int = 1024) throws -> Int {
            var data = data
            var bytesLeft = length
            var bytesSent = 0
            
            loop: while (length > bytesSent) {
                let len = bytesLeft < maxSize ? bytesLeft : maxSize
                let success = Darwin.sendto(
                    fd,
                    data,
                    len,
                    flags,
                    nil, // When nil, the address parameter is autofilled,
                    // if it exsists
                    0
                )
                guard success != -1 else {
                    throw NKC_SwiftSocketError.SendToFailed(errno)
                }
                data = data.advancedBy(success)
                bytesSent += success
                bytesLeft -= success
            }
            return bytesSent
    }
    
    /// Sends `data` to the specified peer.
   func write(address: NKC_AddrInfo, data: UnsafePointer<Void>,
        length: Int, flags: Int32 = 0, maxSize: Int = 1024) throws -> Int {
            var data = data
            var bytesleft = length
            var bytesSent = 0
            
            loop: while (length > bytesSent) {
                let len = bytesleft < maxSize ? bytesleft : maxSize
                let success = Darwin.sendto(
                    fd,
                    data,
                    len,
                    flags,
                    address.addrinfo.ai_addr,
                    UInt32(address.addrinfo.ai_addr.memory.sa_len)
                )
                guard success != -1 else {
                    throw NKC_SwiftSocketError.SendToFailed(errno)
                }
                data = data.advancedBy(success)
                bytesSent += success
                bytesleft -= success
            }
            return bytesSent
    }
    
    /// Sends a string to the peer.
    func write(str: String, flags: Int32 = 0, maxSize: Int = 1024) throws -> Int {
        let length = str.lengthOfBytesUsingEncoding(NSUTF8StringEncoding)
        return try self.write(str, length: length, flags: flags, maxSize: maxSize)
    }
    
    /// Sends `data` to the peer.
     func write(data: NSData, flags: Int32 = 0, maxSize: Int = 1024) throws -> Int {
        let len = data.length
        return try self.write(data.bytes, length: len, flags: flags, maxSize: maxSize)
    }


    func readDataWithTimeout(timeout:NSTimeInterval?, tag: Int?) throws -> Self {
        let hadCB    = readTag != nil
        
        if hadCB {
            stopReadEvents()
        }
        
        readTag = tag
        
        if tag != nil {
            try startReadEvents(timeout)
        }
        
        return self
    }
    
    
    private func _read(flags: Int32 = 0) ->  Bool {

        let bptr = UnsafePointer<CChar>(readBufferPtr)
    
        let bufsize = readBufferSize
        
        var addrLen = socklen_t(sizeof(sockaddr))
        let sockAddr = UnsafeMutablePointer<sockaddr>.alloc(sizeof(sockaddr))
        
        let readCount = Darwin.recvfrom(
            fd,
            readBufferPtr,
            bufsize,
            flags,
            sockAddr,
            &addrLen
        )
        
        var addrinfo = Darwin.addrinfo()
        addrinfo.ai_socktype   = self.address.addrinfo.ai_socktype
        addrinfo.ai_protocol   = self.address.addrinfo.ai_protocol
        addrinfo.ai_family     = self.address.addrinfo.ai_family
        addrinfo.ai_flags      = self.address.addrinfo.ai_flags
        addrinfo.ai_canonname = nil
        addrinfo.ai_addr = sockAddr
        
        let addr = NKC_AddrInfo(claim: addrinfo)
        
        if (readCount == 0) {
            stopReadEvents();
            dispatch_async(nkDelegateQueue!) {
                self.nkDelegate?.socket(self, didDisconnectWithError: NSError(domain: "Socket Empty", code: 0, userInfo: nil))
            }
            
            return false;
        }
        
        guard readCount >= 0 else {
            readBufferPtr[0] = 0
            
           if errno == EWOULDBLOCK {
               return true;
            }
            else {
                dispatch_async(nkDelegateQueue!) {
                    self.nkDelegate?.socket(self, didDisconnectWithError: NSError(domain: "Socket Error", code: Int(errno), userInfo: nil))
                }
              return false;
            }
        } 
        
        readBufferPtr[readCount] = 0
        let data = NSData(bytes: bptr, length: readCount)
        if (addrLen > 0)
        {
            dispatch_async(nkDelegateQueue!) {
                self.nkDelegate?.socket(self, didReceiveData: data, sender: addr.hostname, port: addr.port)
            }
            return true;
        }
        
        dispatch_async(nkDelegateQueue!) {
            self.nkDelegate?.socket(self, didReceiveData: data, withTag: self.readTag ?? 0)
        }
        return true;
    }
    
    private func stopReadEvents() {
        if readSource != nil {
            dispatch_source_cancel(readSource!)
            readSource = nil
        }
    }
    
    private func startReadEvents(timeout:NSTimeInterval?) throws -> Void {
        guard readSource == nil else {
            throw NKC_SwiftSocketError.ParameterError(
                "Read source already setup"
            )
        }
        
        if queue == nil {
             queue = dispatch_get_main_queue()
        }
        
        readSource = dispatch_source_create(
            DISPATCH_SOURCE_TYPE_READ,
            UInt(self.fd),
            0,
            queue
        )
        guard let readSource = self.readSource else {
            throw NKC_SwiftSocketError.DispatchFailed(errno)
        }
        
        readSource.onEvent { [unowned self]
            _, readCount in
            
           if self.nkDelegate != nil
            {
              let success = self._read()
                if !success {
                    dispatch_source_cancel(readSource)
                    return;
                }
            }
        }
        
        dispatch_resume(readSource)
    }

 
    /// Sets whether the system is allowed to reuse the address if it's
    /// already in use.
   func setShouldReuseAddress(value: Bool) throws {
        var number: CInt = value ? 1 : 0
        shouldReuseAddress = value
        guard Darwin.setsockopt(
            fd,
            SOL_SOCKET,
            SO_REUSEADDR,
            &number,
            socklen_t(sizeof(CInt))
            ) != -1 else {
                throw NKC_SwiftSocketError.SetSocketOptionFailed(errno)
        }
    }
    
    /// Sets the specified socket option.
    func setSocketOption(layer: Int32 = SOL_SOCKET, option: Int32,
        value: UnsafePointer<Void>, valueLen: socklen_t) throws {
            guard Darwin.setsockopt(
                fd,
                layer,
                option,
                value,
                valueLen
                ) == 0 else {
                    throw NKC_SwiftSocketError.SetSocketOptionFailed(errno)
            }
    }
    
    /// Gets the specified socket option.
   func getSocketOption(layer: Int32 = SOL_SOCKET, option: Int32,
        value: UnsafeMutablePointer<Void>, inout valueLen: socklen_t) throws {
            guard Darwin.getsockopt(
                fd,
                layer,
                option,
                value,
                &valueLen
                ) == 0 else {
                    throw NKC_SwiftSocketError.SetSocketOptionFailed(errno)
            }
    }
    
    /// Set a socket into nonblocking mode.
    func setNonblocking() -> Void
    {
        _fcntl(fd: fd, cmd: F_SETFL, value: _fcntl(fd: fd, cmd: F_GETFL, value: 0))
        
    }
    
    /// Unlinks the file at the given url.
    ///
    /// - parameter path:   The file to be removed.
    /// - parameter errorOnFNF: Setting this to `false` causes this function
    ///                         not to error when there is no file to unlink.
    private func unlink(path: String, errorOnFNF: Bool = true) throws {
        guard Darwin.unlink(
            path
            ) == 0 else {
                if !(!errorOnFNF && errno == ENOENT) {
                    throw NKC_SwiftSocketError.UnlinkFailed(errno)
                } else {
                    return
                }
        }
    }
    
    private func _getLocalAddress() -> NKC_AddrInfo? {
        let size = sizeof(Darwin.sockaddr_storage)
        let sockStorage = UnsafeMutablePointer<sockaddr_storage>.alloc(size)
        let sockAddr = UnsafeMutablePointer<Darwin.sockaddr>(sockStorage)
        var length = socklen_t(size)
        
        guard Darwin.getsockname(self.fd, sockAddr, &length) == 0 else {
            sockStorage.dealloc(size)
            return nil
        }
        
        var addrinfo = Darwin.addrinfo()
        addrinfo.ai_socktype   = address.addrinfo.ai_socktype
        addrinfo.ai_protocol   = address.addrinfo.ai_protocol
        addrinfo.ai_family     = address.addrinfo.ai_family
        addrinfo.ai_flags      = address.addrinfo.ai_flags
        addrinfo.ai_canonname = nil
        addrinfo.ai_addr = sockAddr
       
        let addr = NKC_AddrInfo(claim: addrinfo)
        return addr
    }
    
    private func _getPeerAddress() -> NKC_AddrInfo? {
        let size = sizeof(Darwin.sockaddr_storage)
        let sockStorage = UnsafeMutablePointer<sockaddr_storage>.alloc(size)
        let sockAddr = UnsafeMutablePointer<Darwin.sockaddr>(sockStorage)
        var length = socklen_t(size)
        
        guard Darwin.getpeername(self.fd, sockAddr, &length) == 0 else {
            sockStorage.dealloc(size)
            return nil
        }
        
        var addrinfo = Darwin.addrinfo()
        addrinfo.ai_socktype   = address.addrinfo.ai_socktype
        addrinfo.ai_protocol   = address.addrinfo.ai_protocol
        addrinfo.ai_family     = address.addrinfo.ai_family
        addrinfo.ai_flags      = address.addrinfo.ai_flags
        addrinfo.ai_canonname = nil
        addrinfo.ai_addr = sockAddr
        
        let addr = NKC_AddrInfo(claim: addrinfo)
    
        return addr
    }
}

/// The `type` of socket, which specifies the semantics of communication.
enum NKC_SwiftSocketType {
    /// Sends packets reliably and ensures they arrive in the same order that
    /// they were sent in.
    case Stream
    /// Sends packets unreliably and quickly, not guarenteeing the arival or
    /// the arival order of any packets sent.
    case Datagram
    /// Provides access to the raw communication model. This is restricted to
    /// the super-user. It creates no additional header information, and as
    /// such, can be used to inspect and send packets of all protocol types.
    case Raw
    /// Returns the integer associated with `self` listed in the
    /// `<sys/socket.h>` header file.
    var systemValue: Int32 {
        switch self {
        case .Stream:
            return SOCK_STREAM
        case .Datagram:
            return SOCK_DGRAM
        case .Raw:
            return SOCK_RAW
        }
    }
}

/// The currently understood communication domains within which communication
/// will take place. These parameters are defined in <sys/socket.h>
enum NKC_DomainAddressFamily {
    /// Host-internal protocols, formerly UNIX
    case Local
    /// Host-internal protocls, deprecated, use Local
    @available(OSX, deprecated=10.11, renamed="Local")
    case UNIX
    /// Internet Version 4 Protocol
    case INET
    /// Internet Version 6 Protocol
    case INET6
    /// The unspecified protocl, signifying that any protocol is accepted.
    case Unspecified
    /// Used to specify different protocol to use.
    case Other(Int32)
    
    /// Returns the integer associated with `self` for use with the networking
    /// calls.
    var systemValue: Int32 {
        switch self {
        case .Local:
            return PF_LOCAL
        case .UNIX:
            return PF_UNIX
        case .INET:
            return PF_INET
        case .INET6:
            return PF_INET6
        case .Unspecified:
            return PF_UNSPEC
        case .Other(let n):
            return n
        }
    }
}

/// The specific protocol methods used for transfering data. The very common
/// protocols are listed below. For all the protocols, see /etc/protocols and
/// <inet/in.h>.
enum NKC_CommunicationProtocol {
    /// Transmission Control Protocol
    case TCP
    /// User Datagram Protocol
    case UDP
    /// Raw Protocol
    case RAW
    /// Used to specify another protocol to use.
    case Other(Int32)
    
    /// Returns the integer associated with `self` for use with the networking
    /// calls.
    var systemValue: Int32 {
        switch self {
        case .TCP:
            return IPPROTO_TCP
        case .UDP:
            return IPPROTO_UDP
        case .RAW:
            return IPPROTO_RAW
        case .Other(let n):
            return n
        }
    }
}


enum NKC_ShutdownMethod {
    case PreventRead
    case PreventWrite
    case PreventRW
    var systemValue: Int32 {
        switch self {
        case .PreventRead:
            return SHUT_RD
        case .PreventWrite:
            return SHUT_WR
        case .PreventRW:
            return SHUT_RDWR
        }
    }
}

enum NKC_SwiftSocketError : ErrorType {
    /// Thrown when a call to `Darwin.socket()` fails. The associate value holds
    /// the error number returned.
    case CreationFailed(Int32)
    /// Thrown when a call to `Darwin.close()` fails. The associate value holds
    /// the error number returned.
    case CloseFailed(Int32)
    /// Thrown when an invalid parameter is detected. The associate value holds
    /// a description of the error. This is considered a programming error.
    case ParameterError(String)
    /// Thrown by `bind()` or `connect()` when all possible addresses with the
    /// given information have been exhausted. The associate string holds a
    /// description of the error, and the array holds errors returned from the
    /// system call.
    @available(OSX, deprecated=10.10, renamed="NoAddressesAvailable")
    case NoAddressesFound(String, [Int32])
    /// Thrown by `bind()` or `connect()` when all possible addresses with the
    /// given information has been exhausted. The associate array holds the
    /// errors returned from the system call.
    case NoAddressesAvailable([Int32])
    /// Thrown when binding to a `Local` (aka `Unix`) file address. The
    /// associate value holds the error number returned from `Darwin.unlink()`.
    case UnlinkFailed(Int32)
    /// Thrown when a call to `Darwin.bind()` fails. The associate value holds
    /// the error number returned.
    case BindFailed(Int32)
    /// Thrown when a call to `Darwin.connect()` fails. The associate value
    /// holds the error number returned.
    case ConnectFailed(Int32)
    /// Thrown when a call to `Darwin.sendto()` fails. The associate value holds
    /// the error number returned.
    case SendToFailed(Int32)
    /// Thrown when a call to `Darwin.sendmsg()` fails. The associate value
    /// holds the error number returned.
    case SendMSGFailed(Int32)
    /// Thrown when no data is available on a non-blocking socket. A subsequent
    /// call may yield data.
    case RecvTryAgain
    /// Thrown when a call to `Darwin.recvfrom()` fails. The associate value
    /// holds the error number returned.
    case RecvFromFailed(Int32)
    /// Thrown when a call to `Darwin.accept()` fails. The associate value holds
    /// the error number returned.
    case AcceptFailed(Int32)
    /// Thrown when a call to `Darwin.listen()` fails. The associate value holds
    /// the error number returned.
    case ListenFailed(Int32)
    /// Thrown when a call to `Darwin.setsockopt()` fails. The associate value
    /// holds the error number returned.
    case SetSocketOptionFailed(Int32)
    /// Thrown when a call to `Darwin.getsockopt()` fails. The associate value
    /// holds the error number returned.
    case GetSocketOptionFailed(Int32)
    /// Thrown when a call to `Darwin.shutdown()` fails. The associate value
    /// holds the error number returned.
    case ShutdownFailed(Int32)
    /// Thrown when a call to `Darwin.select()` fails. The associate value holds
    /// the error number returned.
    case SelectFailed(Int32)
    /// Thrown when a call to dispatch queue fails. The associate value holds
    /// the error number returned.
    case DispatchFailed(Int32)
}

/// NKC_AddrInfo contains a references to address structures and socket address
/// structures.
class NKC_AddrInfo {
    var addrinfo: Darwin.addrinfo
    var sockaddr: UnsafeMutablePointer<Darwin.sockaddr> {
        get {
            return UnsafeMutablePointer(sockaddr_storage)
        }
    }
    var sockaddr_storage: UnsafeMutablePointer<Darwin.sockaddr_storage>
    var hostname: String? {
        if let hostname = String.fromCString(addrinfo.ai_canonname) {
            return hostname
        }
        if let hostname = try? getnameinfo(self).hostname {
            return hostname
        }
        return nil
    }

    private(set)    lazy var port: Int32! = {
    [unowned self] in
        return try? self._getPort() ?? 0
     }()

    @available(*, unavailable, renamed="hostname")
    var canonname: String? {
        fatalError("unavailable function call")
    }
    /// Constructs the addresses so they all reference each other internally.
    init() {
        addrinfo = Darwin.addrinfo()
        sockaddr_storage = UnsafeMutablePointer<Darwin.sockaddr_storage>.alloc(
            sizeof(Darwin.sockaddr_storage)
        )
        addrinfo.ai_canonname = nil
        addrinfo.ai_addr = sockaddr
    }
    /// Claims ownership of the address provided. It must have been created
    /// by performing:
    ///
    ///      let size = sizeof(sockaddr_storage)
    ///      let addr = UnsafeMutablePointer<sockaddr_storage>.alloc(size)
    init(claim addr: Darwin.addrinfo) {
        addrinfo = addr
        sockaddr_storage = UnsafeMutablePointer<Darwin.sockaddr_storage>(
            addr.ai_addr
        )
    }
    init(copy addr: Darwin.addrinfo) {
        addrinfo = addr
        sockaddr_storage = UnsafeMutablePointer.alloc(
            sizeof(Darwin.sockaddr_storage)
        )
        if addr.ai_addr != nil {
            sockaddr_storage.memory = UnsafeMutablePointer(addr.ai_addr).memory
        }
        addrinfo.ai_addr = sockaddr
        if addr.ai_canonname != nil {
            let length = Int(strlen(addr.ai_canonname) + 1)
            addrinfo.ai_canonname = UnsafeMutablePointer<Int8>.alloc(length)
            strcpy(addrinfo.ai_canonname, addr.ai_canonname)
        }
    }
    deinit {
        sockaddr_storage.dealloc(sizeof(Darwin.sockaddr_storage))
        if addrinfo.ai_canonname != nil {
            let length = Int(strlen(addrinfo.ai_canonname) + 1)
            addrinfo.ai_canonname.dealloc(length)
        }
    }
    
    private func _getPort() throws -> Int32 {
        switch addrinfo.ai_family {
        case PF_INET:
            let ipv4 = UnsafeMutablePointer<sockaddr_in>(addrinfo.ai_addr)
            return Int32(ntohs(ipv4.memory.sin_port))
        case PF_INET6:
            let ipv6 = UnsafeMutablePointer<sockaddr_in6>(addrinfo.ai_addr)
            return Int32(htons(ipv6.memory.sin6_port))
        default:
            throw NKC_SwiftSocketError.ParameterError("Trying to get a port on a"
                + " structure which does not use ports.")
        }
    }
    
    func setPort(port: Int32) throws {
        switch addrinfo.ai_family {
        case PF_INET:
            let ipv4 = UnsafeMutablePointer<sockaddr_in>(addrinfo.ai_addr)
            ipv4.memory.sin_port = htons(CUnsignedShort(port))
        case PF_INET6:
            let ipv6 = UnsafeMutablePointer<sockaddr_in6>(addrinfo.ai_addr)
            ipv6.memory.sin6_port = htons(CUnsignedShort(port))
        default:
            throw NKC_SwiftSocketError.ParameterError("Trying to set a port on a"
                + " structure which does not use ports.")
        }
    }
}

enum NetworkUtilitiesError : ErrorType {
    case GetHostNameFailed(Int32)
    case SetHostnameFailed(Int32)
    case GetAddressInfoFailed(Int32)
    case GetNameInfoFailed(Int32)
    case GetHostByNameFailed(Int32)
    case ParameterError(String)
}

/// Returns the address of `obj`.
func unsafeAddressOfCObj<T: Any>(obj: UnsafeMutablePointer<T>) ->
    UnsafeMutablePointer<T> {
        return obj
}

/// Converts the bytes of `value` from network order to host order.
func ntohs(value: CUnsignedShort) -> CUnsignedShort {
    return CFSwapInt16BigToHost(value)
    
}
/// Converts the bytes of `value` from host order to network order.
func htons(value: CUnsignedShort) -> CUnsignedShort {
    // Network byte order is always `bigEndain`.
    return CFSwapInt16HostToBig(value)
}

extension String {
    /// Returns an underlying c buffer.
    /// - Warning: Deallocate the pointer when done to aviod memory leaks.
    public var getCString: (ptr: UnsafeMutablePointer<Int8>, len: Int) {
        return self.withCString { (ptr: UnsafePointer<Int8>) ->
            (UnsafeMutablePointer<Int8>, Int) in
            let len = self.utf8.count
            let buffer = UnsafeMutablePointer<Int8>.alloc(len+1)
            for i in 0..<len {
                buffer[i] = ptr[i]
            }
            buffer[len] = 0
            return (buffer, len)
        }
    }
}

/// Obtains a list of IP addresses and port number, given the requirements
/// `hostname`, `serviceName` and `hints`.
func getaddrinfo(host hostname: String?, service serviceName: String?,
    hints: UnsafePointer<addrinfo>) throws -> [NKC_AddrInfo] {
        
        guard !(hostname == nil && serviceName == nil) else {
            throw NetworkUtilitiesError.ParameterError(
                "Host name and server name cannot be nil at the same time!"
            )
        }
        
        var res = addrinfo()
        var res_ptr: UnsafeMutablePointer<addrinfo> = unsafeAddressOfCObj(&res)
        let hostname_val: (ptr: UnsafeMutablePointer, len: Int) =
        hostname?.getCString ?? (nil, 0)
        let servname_val: (ptr: UnsafeMutablePointer, len: Int) =
        serviceName?.getCString ?? (nil, 0)
        
        defer {
            if hostname_val.len > 0 {
                hostname_val.ptr.dealloc(hostname_val.len)
            }
            if servname_val.len > 0 {
                hostname_val.ptr.dealloc(hostname_val.len)
            }
        }
        
        let error = Darwin.getaddrinfo(
            hostname_val.ptr,
            servname_val.ptr,
            hints, &res_ptr
        )
        guard error == 0 else {
            throw NetworkUtilitiesError.GetAddressInfoFailed(error)
        }
        
        var addresses: [NKC_AddrInfo] = []
        var ptr = res_ptr
        while ptr != nil {
            addresses.append(NKC_AddrInfo(copy: ptr.memory))
            ptr = ptr.memory.ai_next
        }
        
        freeaddrinfo(res_ptr)
        return addresses
}

func getnameinfo(addr: UnsafeMutablePointer<Darwin.sockaddr>, flags: Int32 = 0) throws
    -> (hostname: String?, servicename: String?) {
        var hostnameBuff = UnsafeMutablePointer<Int8>.alloc(Int(NI_MAXHOST))
        var servicenameBuff = UnsafeMutablePointer<Int8>.alloc(Int(NI_MAXSERV))
        
        memset(hostnameBuff, 0, Int(NI_MAXHOST))
        memset(servicenameBuff, 0, Int(NI_MAXSERV))
        
        defer {
            hostnameBuff.dealloc(Int(NI_MAXHOST))
            servicenameBuff.dealloc(Int(NI_MAXSERV))
        }
        
        let success = Darwin.getnameinfo(
            addr,
            UInt32(addr.memory.sa_len),
            hostnameBuff,
            UInt32(NI_MAXHOST) * UInt32(sizeof(Int8)),
            servicenameBuff,
            UInt32(NI_MAXSERV) * UInt32(sizeof(Int8)),
            flags
        )
        
        guard success == 0 else {
            throw NetworkUtilitiesError.GetNameInfoFailed(success)
        }
        
        return (
            String.fromCString(hostnameBuff),
            String.fromCString(servicenameBuff)
        )
}


func getnameinfo(address: NKC_AddrInfo, flags: Int32 = 0) throws
    -> (hostname: String?, servicename: String?) {
        var hostnameBuff = UnsafeMutablePointer<Int8>.alloc(Int(NI_MAXHOST))
        var servicenameBuff = UnsafeMutablePointer<Int8>.alloc(Int(NI_MAXSERV))
        
        memset(hostnameBuff, 0, Int(NI_MAXHOST))
        memset(servicenameBuff, 0, Int(NI_MAXSERV))
        
        defer {
            hostnameBuff.dealloc(Int(NI_MAXHOST))
            servicenameBuff.dealloc(Int(NI_MAXSERV))
        }
        
        let success = Darwin.getnameinfo(
            address.sockaddr,
            UInt32(address.sockaddr.memory.sa_len),
            hostnameBuff,
            UInt32(NI_MAXHOST) * UInt32(sizeof(Int8)),
            servicenameBuff,
            UInt32(NI_MAXSERV) * UInt32(sizeof(Int8)),
            flags
        )
        
        guard success == 0 else {
            throw NetworkUtilitiesError.GetNameInfoFailed(success)
        }
        
        return (
            String.fromCString(hostnameBuff),
            String.fromCString(servicenameBuff)
        )
}

/// Performs the call `Darwin.gethostname()`.
func gethostname() throws -> String? {
    let maxlength = Int(sysconf(_SC_HOST_NAME_MAX))
    var cstring: [Int8] = [Int8](count: maxlength, repeatedValue: 0)
    let result = Darwin.gethostname(
        &cstring,
        maxlength
    )
    guard result == 0 else {
        throw NetworkUtilitiesError.GetHostNameFailed(errno)
    }
    return String.fromCString(&cstring)
}

/// Performs the call `Darwin.sethostname()`.
func sethostname(hostname: String) throws {
    let maxlength = Int(sysconf(_SC_HOST_NAME_MAX))
    let len = hostname.lengthOfBytesUsingEncoding(NSUTF8StringEncoding)
    guard len <= maxlength else {
        throw NetworkUtilitiesError.ParameterError(
            "The length of hostname cannot be greater than sysconf(_SC_HOST_NAME_MAX)"
        )
    }
    try hostname.withCString { (cstring: UnsafePointer<Int8>) -> Void in
        let result = Darwin.sethostname(cstring, Int32(len))
        guard result == 0 else {
            throw NetworkUtilitiesError.SetHostnameFailed(errno)
        }
    }
}

extension String {
    /// Returns a `String` given a c error `number`.
    public static func fromCError(number: Int32) -> String {
        return String.fromCString(strerror(number))!
    }
}

struct HostEntry {
    var name: String? = ""
    var aliases: [String] = []
    var type: NKC_DomainAddressFamily?
    var addresses: [String] = []
}

/// Returns host information associated with the given `hostname`.
func gethostbyname(hostname: String, family: NKC_DomainAddressFamily) throws
    -> HostEntry {
        switch family {
        case .INET, .INET6: break
        default:
            NetworkUtilitiesError.ParameterError("Only IPv4 and IPv6 addresses are supported")
        }
        let ent = Darwin.gethostbyname2(hostname, family.systemValue)
        guard ent != nil else {
            throw NetworkUtilitiesError.GetHostByNameFailed(h_errno)
        }
        
        var record = HostEntry()
        record.name = String.fromCString(ent.memory.h_name)
        switch ent.memory.h_addrtype {
        case PF_INET:
            record.type = .INET
        case PF_INET6:
            record.type = .INET6
        default:
            break
            //preconditionFailure(
            // "Found an address which is not listed in the documentation"
            //)
        }
        var counter = 0
        while ent.memory.h_aliases[counter] != nil {
            if let str = String.fromCString(ent.memory.h_aliases[counter]) {
                record.aliases.append(str)
            }
            counter += 1
        }
        
        counter = 0
        typealias InAddrPtrType = UnsafeMutablePointer<Darwin.in_addr>
        let addr_list = UnsafeMutablePointer<InAddrPtrType>(
            ent.memory.h_addr_list
        )
        while addr_list[counter] != nil {
            var address = addr_list[counter].memory
            if let str = inet_ntop(&address, type: family) {
                record.addresses.append(str)
            }
            counter += 1
        }
        
        return record
}

/// Returns a string representation of `address`, or nil if it could not be
/// converted. Currently understood address formats are `INET` and `INET6`.
func inet_ntop(address: UnsafePointer<in_addr>, type: NKC_DomainAddressFamily)
    -> String? {
        var length: Int32
        switch type {
        case .INET:
            length = INET_ADDRSTRLEN
        case .INET6:
            length = INET6_ADDRSTRLEN
        default:
            return nil
        }
        var cstring: [Int8] = [Int8](count: Int(length), repeatedValue: 0)
        let result = Darwin.inet_ntop(
            type.systemValue,
            address,
            &cstring,
            socklen_t(length)
        )
        return String.fromCString(result)
}

private let __DARWIN_NFDBITS = Int32(sizeof(Int32)) * __DARWIN_NBBY
private let __DARWIN_NUMBER_OF_BITS_IN_SET: Int32 = { () -> Int32 in
    func howmany(x: Int32, _ y: Int32) -> Int32 {
        return (x % y) == 0 ? (x / y) : (x / (y + 1))
    }
    return howmany(__DARWIN_FD_SETSIZE, __DARWIN_NFDBITS)
}()

extension fd_set {
    
    /// Returns the index of the highest bit set.
    private mutating func highestDescriptor() -> Int32 {
        var highestFD: Int32 = 0
        for index in (__DARWIN_NUMBER_OF_BITS_IN_SET * Int32(sizeof(__int32_t)) - 1).stride(through: 0, by: -1) {
            if isset(index) != 0 {
                highestFD = index
                break
            }
        }
        return highestFD
    }
    
    /// Clears the `bit` index given.
    private mutating func clear(bit: Int32) {
        let i = Int(bit / __DARWIN_NFDBITS)
        let v = ~Int32(1 << (bit % __DARWIN_NFDBITS))
        
        let array = unsafeAddressOfCObj(&self.fds_bits.0)
        array[i] &= v
    }
    /// Sets the `bit` index given.
    private mutating func set(bit: Int32) {
        let i = Int(bit / __DARWIN_NFDBITS)
        let v = Int32(1 << (bit % __DARWIN_NFDBITS))
        
        let array = unsafeAddressOfCObj(&self.fds_bits.0)
        array[i] |= v
    }
    /// Returns non-zero if `bit` is set.
    private mutating func isset(bit: Int32) -> Int32 {
        let i = Int(bit / __DARWIN_NFDBITS)
        let v = Int32(1 << (bit % __DARWIN_NFDBITS))
        
        let array = unsafeAddressOfCObj(&self.fds_bits.0)
        return array[i] & v
    }
    /// Zeros `self`, so no bits are set.
    mutating func zero() {
        let bits = unsafeAddressOfCObj(&self.fds_bits.0)
        bzero(bits, Int(__DARWIN_NUMBER_OF_BITS_IN_SET))
    }
    /// Returns `true` if `socket` is in the set.
    mutating func isSet(socket: NKC_SwiftSocket) -> Bool {
        return isset(socket.fd) != 0
    }
    /// Adds `socket` to the set.
    mutating func add(socket: NKC_SwiftSocket) {
        self.set(socket.fd)
    }
    /// Removes `socket` from the set.
    mutating func remove(socket: NKC_SwiftSocket) {
        self.clear(socket.fd)
    }
}

/// Waits efficiently until a file descriptor(s) specified is marked as having
/// either pending data, a penidng error, or the ability to write.
func select(read: fd_set?, write: fd_set?, error: fd_set?, timeout: UnsafeMutablePointer<timeval>) throws -> (numberChanged: Int32, read: fd_set!, write: fd_set!, error: fd_set!) {
    
    var read_out = read
    var write_out = write
    var error_out = error
    
    var highestFD: Int32 = 0
    highestFD = read_out?.highestDescriptor() ?? highestFD
    highestFD = write_out?.highestDescriptor() ?? highestFD
    highestFD = error_out?.highestDescriptor() ?? highestFD
    
    
    let rptr = read_out != nil ? unsafeAddressOfCObj(&(read_out!)) : UnsafeMutablePointer(nil)
    let wptr = write_out != nil ? unsafeAddressOfCObj(&(write_out!)) : UnsafeMutablePointer(nil)
    let eptr = error_out != nil ? unsafeAddressOfCObj(&(error_out!)) : UnsafeMutablePointer(nil)
    
    let result = Darwin.select(
        highestFD + 1,
        rptr,
        wptr,
        eptr,
        timeout
    )
    
    guard result != -1 else {
        throw NKC_SwiftSocketError.SelectFailed(errno)
    }
    return (result, read_out, write_out, error_out)
}


extension sockaddr_un {
    /// Copies `path` into `sun_path`. Values located over the 104th index are
    /// not copied.
    mutating func setPath(path: UnsafePointer<Int8>, length: Int) {
        var array = [Int8](count: 104, repeatedValue: 0)
        for i in 0..<length {
            array[i] = path[i]
        }
        setPath(array)
    }
    
    /// Copies a `path` into `sun_path`
    /// - Warning: Path must be at least 104 in length.
    mutating func setPath(path: [Int8]) {
        
        precondition(path.count >= 104, "Path must be at least 104 in length")
        
        sun_path.0 = path[0]
        // and so on for infinity ...
        // ... python is handy
        sun_path.1 = path[1]
        sun_path.2 = path[2]
        sun_path.3 = path[3]
        sun_path.4 = path[4]
        sun_path.5 = path[5]
        sun_path.6 = path[6]
        sun_path.7 = path[7]
        sun_path.8 = path[8]
        sun_path.9 = path[9]
        sun_path.10 = path[10]
        sun_path.11 = path[11]
        sun_path.12 = path[12]
        sun_path.13 = path[13]
        sun_path.14 = path[14]
        sun_path.15 = path[15]
        sun_path.16 = path[16]
        sun_path.17 = path[17]
        sun_path.18 = path[18]
        sun_path.19 = path[19]
        sun_path.20 = path[20]
        sun_path.21 = path[21]
        sun_path.22 = path[22]
        sun_path.23 = path[23]
        sun_path.24 = path[24]
        sun_path.25 = path[25]
        sun_path.26 = path[26]
        sun_path.27 = path[27]
        sun_path.28 = path[28]
        sun_path.29 = path[29]
        sun_path.30 = path[30]
        sun_path.31 = path[31]
        sun_path.32 = path[32]
        sun_path.33 = path[33]
        sun_path.34 = path[34]
        sun_path.35 = path[35]
        sun_path.36 = path[36]
        sun_path.37 = path[37]
        sun_path.38 = path[38]
        sun_path.39 = path[39]
        sun_path.40 = path[40]
        sun_path.41 = path[41]
        sun_path.42 = path[42]
        sun_path.43 = path[43]
        sun_path.44 = path[44]
        sun_path.45 = path[45]
        sun_path.46 = path[46]
        sun_path.47 = path[47]
        sun_path.48 = path[48]
        sun_path.49 = path[49]
        sun_path.50 = path[50]
        sun_path.51 = path[51]
        sun_path.52 = path[52]
        sun_path.53 = path[53]
        sun_path.54 = path[54]
        sun_path.55 = path[55]
        sun_path.56 = path[56]
        sun_path.57 = path[57]
        sun_path.58 = path[58]
        sun_path.59 = path[59]
        sun_path.60 = path[60]
        sun_path.61 = path[61]
        sun_path.62 = path[62]
        sun_path.63 = path[63]
        sun_path.64 = path[64]
        sun_path.65 = path[65]
        sun_path.66 = path[66]
        sun_path.67 = path[67]
        sun_path.68 = path[68]
        sun_path.69 = path[69]
        sun_path.70 = path[70]
        sun_path.71 = path[71]
        sun_path.72 = path[72]
        sun_path.73 = path[73]
        sun_path.74 = path[74]
        sun_path.75 = path[75]
        sun_path.76 = path[76]
        sun_path.77 = path[77]
        sun_path.78 = path[78]
        sun_path.79 = path[79]
        sun_path.80 = path[80]
        sun_path.81 = path[81]
        sun_path.82 = path[82]
        sun_path.83 = path[83]
        sun_path.84 = path[84]
        sun_path.85 = path[85]
        sun_path.86 = path[86]
        sun_path.87 = path[87]
        sun_path.88 = path[88]
        sun_path.89 = path[89]
        sun_path.90 = path[90]
        sun_path.91 = path[91]
        sun_path.92 = path[92]
        sun_path.93 = path[93]
        sun_path.94 = path[94]
        sun_path.95 = path[95]
        sun_path.96 = path[96]
        sun_path.97 = path[97]
        sun_path.98 = path[98]
        sun_path.99 = path[99]
        sun_path.100 = path[100]
        sun_path.101 = path[101]
        sun_path.102 = path[102]
        sun_path.103 = path[103]
    }
    // Retrieves `sun_path` into an arary.
    func getPath() -> [Int8] {
        var path = [Int8](count: 104, repeatedValue: 0)
        
        path[0] = sun_path.0
        path[1] = sun_path.1
        path[2] = sun_path.2
        path[3] = sun_path.3
        path[4] = sun_path.4
        path[5] = sun_path.5
        path[6] = sun_path.6
        path[7] = sun_path.7
        path[8] = sun_path.8
        path[9] = sun_path.9
        path[10] = sun_path.10
        path[11] = sun_path.11
        path[12] = sun_path.12
        path[13] = sun_path.13
        path[14] = sun_path.14
        path[15] = sun_path.15
        path[16] = sun_path.16
        path[17] = sun_path.17
        path[18] = sun_path.18
        path[19] = sun_path.19
        path[20] = sun_path.20
        path[21] = sun_path.21
        path[22] = sun_path.22
        path[23] = sun_path.23
        path[24] = sun_path.24
        path[25] = sun_path.25
        path[26] = sun_path.26
        path[27] = sun_path.27
        path[28] = sun_path.28
        path[29] = sun_path.29
        path[30] = sun_path.30
        path[31] = sun_path.31
        path[32] = sun_path.32
        path[33] = sun_path.33
        path[34] = sun_path.34
        path[35] = sun_path.35
        path[36] = sun_path.36
        path[37] = sun_path.37
        path[38] = sun_path.38
        path[39] = sun_path.39
        path[40] = sun_path.40
        path[41] = sun_path.41
        path[42] = sun_path.42
        path[43] = sun_path.43
        path[44] = sun_path.44
        path[45] = sun_path.45
        path[46] = sun_path.46
        path[47] = sun_path.47
        path[48] = sun_path.48
        path[49] = sun_path.49
        path[50] = sun_path.50
        path[51] = sun_path.51
        path[52] = sun_path.52
        path[53] = sun_path.53
        path[54] = sun_path.54
        path[55] = sun_path.55
        path[56] = sun_path.56
        path[57] = sun_path.57
        path[58] = sun_path.58
        path[59] = sun_path.59
        path[60] = sun_path.60
        path[61] = sun_path.61
        path[62] = sun_path.62
        path[63] = sun_path.63
        path[64] = sun_path.64
        path[65] = sun_path.65
        path[66] = sun_path.66
        path[67] = sun_path.67
        path[68] = sun_path.68
        path[69] = sun_path.69
        path[70] = sun_path.70
        path[71] = sun_path.71
        path[72] = sun_path.72
        path[73] = sun_path.73
        path[74] = sun_path.74
        path[75] = sun_path.75
        path[76] = sun_path.76
        path[77] = sun_path.77
        path[78] = sun_path.78
        path[79] = sun_path.79
        path[80] = sun_path.80
        path[81] = sun_path.81
        path[82] = sun_path.82
        path[83] = sun_path.83
        path[84] = sun_path.84
        path[85] = sun_path.85
        path[86] = sun_path.86
        path[87] = sun_path.87
        path[88] = sun_path.88
        path[89] = sun_path.89
        path[90] = sun_path.90
        path[91] = sun_path.91
        path[92] = sun_path.92
        path[93] = sun_path.93
        path[94] = sun_path.94
        path[95] = sun_path.95
        path[96] = sun_path.96
        path[97] = sun_path.97
        path[98] = sun_path.98
        path[99] = sun_path.99
        path[100] = sun_path.100
        path[101] = sun_path.101
        path[102] = sun_path.102
        path[103] = sun_path.103
        
        return path
    }
}

internal func _fcntl(fd fd: CInt, cmd: CInt, value: CInt) -> CInt {
    typealias FcntlType = @convention(c) (CInt, CInt, CInt) -> CInt
    let fcntlAddr       = dlsym(UnsafeMutablePointer<Void>(bitPattern: Int(-2)), "fcntl")
    let fcntl           = unsafeBitCast(fcntlAddr, FcntlType.self)
    
    return fcntl(fd, cmd, value)
}


/* ***********************************************************************
* DISPATCH UTILITIES                                                     *
* ********************************************************************* */
extension dispatch_source_t {
    func onEvent(cb: (dispatch_source_t, CUnsignedLong) -> Void) {
        dispatch_source_set_event_handler(self) {
            let data = dispatch_source_get_data(self)
            cb(self, data)
        }
    }
}
