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

typealias SEReadingProgressClosure = (bytesReading: Int?, totalBytesReading: Int?) -> Void
typealias SEConnectionTerminatedCLousre = (error: NSError?) ->Void
typealias SEReceivedNetworkDataClosure = (data: NSData?) ->Void

let BuffSize = 1024

class NKSocketStream : NSObject, NSStreamDelegate {
    var host: CFString?
    var port: UInt32
    
    private var inputStream: NSInputStream!
    private var outputStream: NSOutputStream!
    
    private var incomingDataBuffer: NSMutableData
    private var outgoingDataBuffer: NSMutableData
    
    
    var readingProgressClosure: SEReadingProgressClosure?
    var terminatedClosure: SEConnectionTerminatedCLousre?
    var receivedNetworkDataClosure: SEReceivedNetworkDataClosure?
    
    init(host: CFString, port: UInt32) {
        
        self.host = host;
        self.port = port;
        
        self.incomingDataBuffer = NSMutableData();
        self.outgoingDataBuffer = NSMutableData();
        
        super.init()
        self.clean();
    }
    
    func connect() {
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0),  {() -> Void in
            var readStream:  Unmanaged<CFReadStream>?
            var writeStream: Unmanaged<CFWriteStream>?
            
            CFStreamCreatePairWithSocketToHost(kCFAllocatorDefault, self.host, self.port, &readStream, &writeStream)
            
            self.outputStream = writeStream!.takeRetainedValue()
            self.outputStream.delegate = self
            self.outputStream.scheduleInRunLoop(NSRunLoop.currentRunLoop(), forMode: NSRunLoopCommonModes)
            self.outputStream.open()
            
            self.inputStream = readStream!.takeRetainedValue()
            self.inputStream.delegate = self
            self.inputStream.scheduleInRunLoop(NSRunLoop.currentRunLoop(), forMode: NSRunLoopCommonModes)
            self.inputStream.open()
        })
    }
    
    
    func closeStream(var stream: NSStream?) {
        stream!.removeFromRunLoop(NSRunLoop.currentRunLoop(), forMode: NSRunLoopCommonModes)
        stream!.close()
        stream = nil
    }
    
    func clean (){
        self.closeStream(self.inputStream);
        self.closeStream(self.outputStream);
    }
    
    func sendNetworkPacket(data: NSData) {
        self.outgoingDataBuffer.appendData(data);
        self.writeOutgoingBufferToStream();
    }
    
    func writeOutgoingBufferToStream() {
        if 0 == self.outgoingDataBuffer.length {
            return
        }
        
        if self.outputStream!.hasSpaceAvailable {
            var readBytes = self.outgoingDataBuffer.mutableBytes
            var byteIndex = 0
            readBytes += byteIndex
            
            var data_len = self.outgoingDataBuffer.length
            var len = ((data_len - byteIndex >= BuffSize) ?
                BuffSize : (data_len-byteIndex))
            var buf = UnsafeMutablePointer<UInt8>.alloc(len)
            memcpy(buf, readBytes, UInt(len))
            len = self.outputStream!.write(buf, maxLength: BuffSize)
            if len > 0{
                self.outgoingDataBuffer.replaceBytesInRange(NSMakeRange(byteIndex, len), withBytes: nil, length: 0)
                byteIndex += len
            }else {
                self.closeStream(self.outputStream);
                 dispatch_async(dispatch_get_main_queue(), { () -> Void in
                    if self.terminatedClosure != nil {
                        self.terminatedClosure!(error: nil)
                    }
                })
            }
        }
    }
    
    func stream(aStream: NSStream, handleEvent eventCode: NSStreamEvent) {
        switch eventCode {
        case NSStreamEvent.OpenCompleted :
            break
        case NSStreamEvent.HasBytesAvailable :
            var buf = UnsafeMutablePointer<UInt8>.alloc(BuffSize)
            var len = 0
            len = self.inputStream!.read(buf, maxLength: BuffSize)
            if len > 0 {
                self.incomingDataBuffer.appendBytes(buf, length: len)
                var readingData = NSData(bytes: buf, length: len)
                
                 dispatch_async(dispatch_get_main_queue(), { () -> Void in
                    if self.readingProgressClosure != nil {
                        self.readingProgressClosure!(bytesReading: readingData.length ,totalBytesReading: self.incomingDataBuffer.length)
                    }
                    
                    if self.receivedNetworkDataClosure != nil {
                        self.receivedNetworkDataClosure!(data: readingData)
                    }
                });
            }else {
                self.incomingDataBuffer.resetBytesInRange(NSMakeRange(0, self.incomingDataBuffer.length));
                self.incomingDataBuffer.length = 0;
                
                 dispatch_async(dispatch_get_main_queue(), { () -> Void in
                    if self.terminatedClosure != nil {
                        self.terminatedClosure!(error: nil)
                    }
                })
            }
            break
        case NSStreamEvent.HasSpaceAvailable :
            self.writeOutgoingBufferToStream()
            break
        case NSStreamEvent.EndEncountered :
            self.closeStream(aStream);
            dispatch_async(dispatch_get_main_queue(), { () -> Void in
                if self.terminatedClosure != nil {
                    self.terminatedClosure!(error: nil)
                }
            })
            break
        case NSStreamEvent.ErrorOccurred :
            self.closeStream(aStream);
            dispatch_async(dispatch_get_main_queue(), { () -> Void in
                if self.terminatedClosure != nil {
                    self.terminatedClosure!(error: aStream.streamError)
                }
            })
            break
        default:
            break
        }
    }
}
