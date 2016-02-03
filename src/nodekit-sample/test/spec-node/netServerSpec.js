var helper = require('./specHelper');
var net = require( "net" );

describe( "net.Server", function() {

  it("should have all the correct functions defined", function(done) {
    expect(typeof net.Server).toBe('function');
    expect(typeof net.Socket).toBe('function');
    expect(typeof net.createServer).toBe('function');
    expect(typeof net.connect).toBe('function');
    expect(typeof net.createConnection).toBe('function');
    done()
  });

  it("should fire a 'listening' event", function(done) {
    var server = net.createServer();
    server.listen(0, function() {
      server.close();
      done()
    });
  });

  it("should fire a 'close' event registered prior to close()", function(done) {
    var server = net.createServer();
    server.on('close', function(e) {
      done()
    });
    server.listen(0, function() {
      server.close();
    });
  });

  it("should fire a 'close' event on a callback passed to close()", function(done) {
    var server = net.createServer();
    server.listen(0, function() {
      server.close(function() {
          done()
      });
    });
  });

  it("should fire a 'connect' callback on client connection", function(done) {
     var server = net.createServer();
    server.listen(0, function() {
                  var port = server.address().port;
                  
      var socket = net.connect(port, function() {
        // stop accepting connections
        server.close( function() {
          // only called once all connections are closed
            done()
        });
        // destroy the client connection
        socket.destroy();
      });
    });
  });

   it("should allow reading and writing from both client/server connections", function(done) {
    var completedCallback = false;
    var server = net.createServer();
    server.on('connection', function(conn) {
      conn.on('data', function(buff) {
              var str = buff.toString();
        expect(str).toBe('crunchy bacon');
        conn.write('with chocolate', function() {
               process.nextTick( server.close)
        });
      });
              });
     
     server.listen(0, function() {
      var port = server.address().port;
      var socket = net.connect(port, function() {
        socket.on('data', function(buff) {
          var str = buff.toString();
           expect(str).toBe('with chocolate');
           socket.destroy();
           done()
        });
        socket.write("crunchy bacon");
      });
    });
  });

  it("should support an idle socket timeout", function(done) {
    var server = net.createServer();
    server.on('connection', function(socket) {
      socket.setTimeout(10, function() {
        socket.destroy();
        server.close();
          done()
      });
    });
    server.listen(0, function() {
                  var port = server.address().port;
                  
      var client = net.connect(port);
    });
   });

  it("should allow cancellation of an idle socket timeout", function(done) {
    var server = net.createServer();
    server.on('connection', function(socket) {
      socket.setTimeout(150, function() {
        expect(true).toBe(false);
      });
      socket.setTimeout(0); // cancels the timeout we just set
    });
    server.listen(0, function() {
                  var port = server.address().port;
                  
      var socket = net.connect(port, function() {
        setTimeout(function() {
          socket.destroy();
          server.close();
            done()
        }, 150);
      });
     });
   });


  it( "should provide a remote address", function(done) {
    var server = net.createServer();
    server.listen(0, function() {
                  var port = server.address().port;
                  
      var socket = net.connect(port, function() {
        expect(socket.remoteAddress).toBe('localhost');
        expect(socket.remotePort).toBe(port);
        socket.destroy();
        server.close();
       done()
      });
    });
  });

  it( "should provide a server address", function(done) {
    var server = net.createServer();
    server.listen(0, function() {
                  var port = server.address().port;
                  
      var socket = net.connect(port, function() {
        var address = server.address();
        expect(address.port).toBe(port);
        if ( address.family == 'IPv4' ) {
          expect(address.address).toBe('0.0.0.0');
        } else if ( address.family == 'IPv6' ) {
          expect(address.address).toBe('0:0:0:0:0:0:0:0');
        }
        socket.destroy();
        server.close();
       done();
      });
    });
   }); 


 /* it("should emit error events", function(done) {
    var server = net.createServer();
    var error  = new Error('phoney baloney');
 
    server.on('connection', function(socket) {
      socket.on('data', function(buffer) {
        expect(typeof buffer).toBe('object');
        expect(buffer.toString()).toBe('crunchy bacon');
        socket.write('with chocolate');
        socket.emit('error', error);
        socket.destroy();
      });
    });

    server.on('error', function(e) {
      expect(e).toBe(error);
      done()
    });

    server.listen(0, function() {
     var port = server.address().port;
      var socket = net.connect(port, function() {
        socket.write("crunchy bacon");
        socket.on('data', function(buffer) {
          expect(buffer.toString()).toBe('with chocolate');
          socket.destroy();
          server.close();
        });
      });
    });
  }); */
 
});
