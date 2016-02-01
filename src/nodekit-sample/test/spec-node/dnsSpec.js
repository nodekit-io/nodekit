var helper     = require('./specHelper'),
    dns        = require('dns');

describe('The dns module', function() {

  var server, // server instance set in prepareDns
      DnsServer  = nativeDNS.TestDnsServer;

  beforeEach(function() {
    System.setProperty( "dns.server", "127.0.0.1" );
    System.setProperty( "dns.port",   "53530" );
    nativeDNS.ResolverConfig.refresh();
  });

  afterEach(function() {
    if (server) {
      server.stop();
    }
    System.clearProperty("dns.server")
    System.clearProperty("dns.port");
    nativeDNS.ResolverConfig.refresh();
  });

  //dns.server({host: '127.0.0.1', port: 53530});

  function prepareDns(srv, testFunc) {
    server = srv;
    server.start();
    testFunc.apply(testFunc);
  }

  it('should pass testLookup', function(done) {
    var ip = '10.0.0.1';
    prepareDns(DnsServer.testResolveA(ip), function() {
      dns.lookup("nodyn.io", function(err, address, family) {
        expect( err ).toBe( null );
        expect( address ).toBe( ip );
        expect( family ).toBe( 4 );
        done()
      });
    });
  });

  it('should pass testResolve', function(done) {
    var ip = '10.0.0.1';
    prepareDns(DnsServer.testResolveA(ip), function() {
      dns.resolve("nodyn.io", function(err, addresses) {
        expect( err ).toBe( null );
        expect( addresses.length ).toBe( 1 );
        expect( addresses[0] ).toBe( ip );
        done()
      });
    });
  });

  it('should pass testResolve4', function(done) {
    var ip = '10.0.0.1';
    prepareDns(DnsServer.testResolveA(ip), function() {
      dns.resolve4("nodyn.io", function(err, addresses) {
        expect(err).toBe(null);
        expect( addresses.length ).toBe( 1 );
        expect( addresses[0] ).toBe( ip );
        done()
      });
    });
  });

  it('should pass testResolve6', function(done) {
    var ip = '::1';
    prepareDns(DnsServer.testResolveAAAA(ip), function() {
      dns.resolve6("nodyn.io", function(err, addresses) {
        expect(err).toBe(null);
        expect( addresses.length ).toBe( 1 );
        expect( addresses[0] ).toBe( '0:0:0:0:0:0:0:1');
        done()
      });
    });
  });

  it('should pass testResolveMx', function(done) {
    var prio = 10,
        name = "mail.nodyn.io";
   prepareDns(DnsServer.testResolveMX(prio, name), function() {
      dns.resolveMx("nodyn.io", function(err, records) {
        expect( err ).toBe( null );
        expect( records.length ).toBe( 1 );
        expect( records[0].priority ).toBe( prio );
        expect( records[0].exchange ).toBe( name );
        done()
      });
    });
  });

  it('should pass testResolveTxt', function(done) {
    var txt = "node.js is awesome";
     prepareDns(DnsServer.testResolveTXT(txt), function() {
      dns.resolveTxt("nodyn.io", function(err, records) {
        expect( err ).toBe( null );
        expect( records.length ).toBe( 1 );
        expect( records[0] ).toBe( txt );
        done()
      });
    });
  });

  it('should pass testResolveSrv', function(done) {
    var prio = 10,
        weight = 1,
        port = 80,
        name = 'nodyn.io';
    prepareDns(DnsServer.testResolveSRV(prio, weight, port, name), function() {
      dns.resolveSrv("nodyn.io", function(err, records) {
        expect( err ).toBe( null );
        expect( records.length ).toBe( 1 );
        expect( records[0].priority ).toBe( prio );
        expect( records[0].weight ).toBe( weight );
        expect( records[0].port ).toBe( port );
        expect( records[0].name ).toBe( name );
        done()
      });
    });
  });

  it('should pass testResolveNs', function(done) {
    var ns = 'ns.nodyn.io';
    prepareDns(DnsServer.testResolveNS(ns), function() {
      dns.resolveNs("nodyn.io", function(err, records) {
        expect( err ).toBe( null );
        expect( records.length ).toBe( 1 );
        expect( records[0] ).toBe( ns );
        done()
      });
    });
  });

  it('should pass testResolveCname', function(done) {
    var cname = "cname.nodyn.io";
     prepareDns(DnsServer.testResolveCNAME(cname), function() {
      dns.resolveCname("nodyn.io", function(err, records) {
        expect( err ).toBe( null );
        expect( records.length ).toBe( 1 );
        expect( records[0] ).toBe( cname );
        done()
      });
    });
  });

  it('should pass testReverseLookupIPv4', function(done) {
    var ptr = 'ptr.nodyn.io';
     prepareDns(DnsServer.testReverseLookup(ptr), function() {
      dns.reverse('10.0.0.1', function(err, records) {
        console.log( records );
        expect( err ).toBe( null );
        expect( records.length ).toBe( 1 );
        expect( records[0] ).toBe( ptr );
        done()
      });
    });
  });

  it('should pass testReverseLookupIPv6', function(done) {
    var ptr = 'ptr.nodyn.io';
    prepareDns(DnsServer.testReverseLookup(ptr), function() {
      dns.reverse('::1', function(err, records) {
        expect(records).toBeTruthy();
        expect("Unexpected address: " + records[0], records[0] === ptr).toBeTruthy();
        done()
      });
    });
  });

  it('should pass testResolveRrtypeA', function(done) {
    var ip = '10.0.0.1';
     prepareDns(DnsServer.testResolveA(ip), function() {
      dns.resolve("nodyn.io", 'A', function(err, addresses) {
        expect( err ).toBe( null );
        expect( addresses.length ).toBe( 1 );
        expect( addresses[0] ).toBe( ip );
        done()
      });
    });
  });

  it('should pass testResolveRrtypeAAAA', function(done) {
    var ip = '::1';
    prepareDns(DnsServer.testResolveAAAA(ip), function() {
      dns.resolve("nodyn.io", 'AAAA', function(err, addresses) {
        expect( err ).toBe( null );
        expect( addresses.length ).toBe( 1 );
        expect( addresses[0] ).toBe( '0:0:0:0:0:0:0:1' );
        done()
      });
    });
  });

  it('should pass testResolveRrtypeMx', function(done) {
    var prio = 10,
        name = "mail.nodyn.io";
    prepareDns(DnsServer.testResolveMX(prio, name), function() {
      dns.resolve("nodyn.io", 'MX', function(err, records) {
        expect( err ).toBe( null );
        expect( records.length ).toBe( 1 );
        expect( records[0].priority ).toBe( prio );
        expect( records[0].exchange ).toBe( name );
        done()
      });
    });
  });

  it('should pass testResolveRrtypeTxt', function(done) {
    var txt = "vert.x is awesome";
     prepareDns(DnsServer.testResolveTXT(txt), function() {
      dns.resolve("nodyn.io", 'TXT', function(err, records) {
        expect( err ).toBe( null );
        expect( records.length ).toBe( 1 );
        expect( records[0] ).toBe( txt );
        done()
      });
    });
  });

  it('should pass testResolveRrtypeSrv', function(done) {
    var prio = 10,
        weight = 1,
        port = 80,
        name = 'nodyn.io';
    prepareDns(DnsServer.testResolveSRV(prio, weight, port, name), function() {
      dns.resolve("nodyn.io", 'SRV', function(err, records) {
        expect( err ).toBe( null );
        expect( records.length ).toBe( 1 );
        expect( records[0].priority ).toBe( prio );
        expect( records[0].weight ).toBe( weight );
        expect( records[0].port ).toBe( port );
        expect( records[0].name ).toBe( name );
        done()
      });
    });
  });

  it('should pass testResolveRrtypeNs', function(done) {
    var ns = 'ns.nodyn.io';
    prepareDns(DnsServer.testResolveNS(ns), function() {
      dns.resolve("nodyn.io", 'NS', function(err, records) {
        expect( err ).toBe( null );
        expect( records.length ).toBe( 1 );
        expect( records[0] ).toBe( ns );
        done()
      });
    });
  });

  it('should pass testResolveRrtypeCname', function(done) {
    var cname = "cname.nodyn.io";
    prepareDns(DnsServer.testResolveCNAME(cname), function() {
      dns.resolve("nodyn.io", 'CNAME', function(err, records) {
        expect( err ).toBe( null );
        expect( records.length ).toBe( 1 );
        expect( records[0] ).toBe( cname );
        done()
      });
    });
  });

  it('should pass testLookupNonexisting', function(done) {
    prepareDns(DnsServer.testLookupNonExisting(), function() {
      dns.lookup("asdfadsf.com", function(err, address) {
        expect(err).not.toBe( null );
        expect(err.code).toBe(dns.NOTFOUND);
        done()
      });
    });
  });

});
