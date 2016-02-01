var stream = require('stream');
var util = require('util');

function Writable() {
  this.writable = true;
  stream.Stream.call(this);
}
util.inherits(Writable, stream.Stream);

function Readable() {
  this.readable = true;
  stream.Stream.call(this);
}
util.inherits(Readable, stream.Stream);

describe("Stream pipe event", function() {
  it("should be emitted on pipe()", function(done) {


    var w = new Writable();
    w.on('pipe', function(src) {
      done()
    });
    var r = new Readable();
    r.pipe(w);
  });
});
