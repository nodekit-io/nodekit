var helper = require('./specHelper');
var TCP = process.binding('tcp_wrap').TCP;
var TCPConnectWrap = process.binding('tcp_wrap').TCPConnectWrap;

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

describe( "io.nodekit.platform.TCP", function() {

    it("should create server", function(done) {
            var server = new TCP()
            var client = new TCP()
            
            server.bind("127.0.0.1", 0)
            var out = {};
            var err = server.getsockname(out);
            var port = out.port
       
             server.onconnection = function(err, newSocket){
                expect(err).toBe(undefined);
                console.log("SERVER CONNECTED")
       
                newSocket.onread = function(length, buf){
                    if (length == -1)
                        return;
       
                    var chunk = buf.toString()
                    expect(chunk).toEqual('HELLO WORLD')
                    server.close();
                    client.close()
                    done()
                }
            }
       
            server.listen(5)
            var req = new TCPConnectWrap()
            req.oncomplete = function( status, handle, _req, readable, writable){
                    console.log("CONNECTED")
                    handle.writeUtf8String(null, 'HELLO WORLD');
            }
       
            console.log("PORT: " + port);
            client.connect(req, "127.0.0.1", port)
     });
         
});
