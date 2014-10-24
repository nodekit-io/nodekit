
public class NFSocketServer: NSObject, GCDAsyncSocketDelegate {
    
    private var socket: GCDAsyncSocket?
    
    public func startListening( port: UInt16, forever awake: Bool){
        
        if socket != nil
        {
            socket = GCDAsyncSocket(delegate: self, delegateQueue: dispatch_get_main_queue())
        }
        
        var error:NSError?
        
        if !socket!.acceptOnInterface(nil, port: port, error: &error)
        {
            println("Couldn't start socket: \(error)")
        }
        else
        {
            println("Listening on \(port).")
        }
    }
    
    public func stopListening() {
        socket!.disconnect()
    }
    
    // GCDAsyncSocketDelegate methods
    

    public func socket(socket: GCDAsyncSocket, didAcceptNewSocket newSocket: GCDAsyncSocket){
        newSocket.readDataWithTimeout(10, tag: 1)
    }
    
    public func socket(socket: GCDAsyncSocket, didReadData data: NSData, withTag tag: Double){
       
        //Handle Data
        socket.readDataWithTimeout(10, tag: 0)

    }
    
    public func socketDidDisconnect(socket: GCDAsyncSocket, withError err: NSError){
        
    }
    

   /* func sendResponse(data: NSData)
    {
        
        socket.writeData(data, withTimeout: 5, tag: 0)
        socket.delegate = nil
        socket.disconnect()
    }*/
    

}