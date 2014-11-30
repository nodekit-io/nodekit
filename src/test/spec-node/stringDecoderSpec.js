var helper = require('./specHelper');
var StringDecoder = require('string_decoder').StringDecoder;

describe('The string_decoder module', function() {

  it('should pass a basic test', function() {
    var decoder = new StringDecoder('utf8');
    var cent = new Buffer([0xC2, 0xA2]);
    expect(decoder.write(cent)).toBe("¢");
  });
});
