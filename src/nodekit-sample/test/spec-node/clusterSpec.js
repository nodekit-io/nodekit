var helper = require('./specHelper');
var cluster = require('cluster');
var http = require('http');

describe("clustering", function() {


  it ('should be able to delegate requests to children', function(done) {
      cluster.setupMaster( {
        exec: './src/test/javascript/cluster_child.js',
        silent: false
      } );
      console.log( "master: forking" );
      var child = cluster.fork();
      expect( cluster.workers[1] ).toBe( child );
      var body = '';
      child.on('listening', function() {
        console.log( "master: child is listening" );
        http.get( { port: 8000 }, function(response) {
          response.on('data', function(d) {
            body += d.toString();
          });
          response.on('end', function() {
            expect( body ).toContain( child.process.pid );
            expect( body ).toContain( "worker#1" );
            child.on( 'disconnect', function() {
              console.log( "master: disconnected, killing" );
              child.kill();
            });
            child.on('exit', function() {
              console.log( "master: child exited" );
             done()
            });
            console.log( "master: disconnecting" );
            child.disconnect();
          });
        } );
      });
      child.on( 'online', function() {
        console.log( "master: child is online" );
      });
  });


});
