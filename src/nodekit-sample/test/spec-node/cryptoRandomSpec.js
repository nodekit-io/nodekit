var helper = require('./specHelper');
var crypto = require('crypto');

describe("crypto random functions", function() {

  it( "should return random bytes without a callback", function() {
    var bytes = crypto.randomBytes( 15 );
    expect( bytes.length ).toBe( 15 );
  })

  it( "should return pseudo-random bytes without a callback", function() {
    var bytes = crypto.pseudoRandomBytes( 15 );
    expect( bytes.length ).toBe( 15 );
  })

  it ( "should return random bytes through a callback", function(done) {
     crypto.randomBytes( 15, function(err,bytes){
      expect( bytes.length ).toBe( 15 );
       done()
    });
  })

  it ( "should return pseudo-random bytes through a callback", function(done) {
    crypto.pseudoRandomBytes( 15, function(err,bytes){
      expect( bytes.length ).toBe( 15 );
      done()
    });
  })

});

