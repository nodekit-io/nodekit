"use strict";

var helper = require('./specHelper');
var http   = require('http');
var net    = require('net');

describe( "http.request", function() {

  afterEach(function(){
  });

  it( "should allow the creation of an unsent request", function() {
    var request = http.request( {}, function(response) {
      // nothing
    });
    expect( request ).not.toBe( undefined );
    request.abort();
  });

  it( "should send the request when headers are implicitly sent", function(done) {
    var page = '';
    var request = http.request( { host: 'nodyn.io' }, function(response) {
      response.on('data', function(d) {
        page += d.toString();
      })
      response.on( 'end', function() {
        request.socket.end();
        expect( page.indexOf( 'Red Hat' ) ).not.toBe( 0 );
        done()
      });
    });
    request.end();
  });

  it('should receive a "socket" event', function(done) {
    var socket;
      var request = http.request( { host: 'nodyn.io' }, function(response) {
        response.on('data',function(){});
        response.on('end', function() {
          expect( socket ).not.toBe( undefined );
         done()
        });
      });
      request.on( "socket", function(s) {
        socket = s;
      })
      console.log( "AND GO!" );
      request.end();
  });

  it('should allow later binding of a response-handler', function(done){
      var page = '';
      var request = http.request( { host: 'nodyn.io' } );
      request.on('response', function(response) {
        response.on('data', function(d) {
          page += d.toString();
        })
        response.on( 'end', function() {
          request.socket.end();
          expect( page.indexOf( 'Red Hat' ) ).not.toBe( 0 );
          done()
        });
      });
      request.end();
  });
});


