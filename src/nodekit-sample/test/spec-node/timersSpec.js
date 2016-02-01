var helper    = require('./specHelper');

describe("The timers module", function() {

  it('should pass testSetTimeout', function(done) {
    var x = 0;
    setTimeout(function() {
      x = x+1;
    }, 10);
    setTimeout(function() {
      expect(x).toBe(1);
      done()
    }, 1000);
  });

  it('should pass testSetTimeoutWaits', function(done) {
    var x = 0;
     setTimeout(function() {
      x = x+1;
    }, 300);
    setTimeout(function() {
      expect(x).toBe(1);
                 done()
    }, 2000);
  });

  it('should pass testSetTimeoutPassesArgs', function(done) {
    var x = 0;
    setTimeout(function(y, z) {
      x = z+y;
    }, 1, 5, 45);
    setTimeout(function() {
      expect(x).toBe(50);
                done()
    }, 100);
  });

  it('should pass testClearTimeout', function(done) {
    var x = 0;
    var timerId = setTimeout(function(y) {
      x = x+y;
    }, 200, 5);
    clearTimeout(timerId);
    setTimeout(function() {
      expect(x).toBe(0);
                done()
    }, 200);
  });

  it('should pass testSetInterval', function(done) {
    var x = 0;
var id = setInterval(function() {
      console.log( "interval fire: " );
      x = x+1;
      console.log( "interval x=" + x );
    }, 1000);
    setTimeout(function() {
      console.log( "timeout fire: "  );
      console.log( "timeout x=" + x );
      expect(x).toBeGreaterThan(1);
      clearInterval(id);
                 done()
    }, 3000 );
  });

  it('should pass testClearInterval', function(done) {
    var x = 0;
    var id = setInterval(function() {
      x = x+1;
    }, 500);
    clearInterval(id);
    setTimeout(function() {
      expect(x).toBe(0);
                 done()
    }, 100);
  });

  it('should return opaque timer thingies that can be ref/unrefed', function(done) {
    var x = 0;
    var ref = setInterval(function(done) {
      x = x+1;
    }, 500);
    expect(ref.ref).toBeTruthy();
    expect(ref.unref).toBeTruthy();
    ref.unref();
      done()
  });

  it('should have a setImmediate function', function(done) {
    var x = 0;
    setImmediate(function(y) {
      expect(x).toBe(0);
      expect(y).toBe(1);
      x = y;
    }, 1);
    setImmediate(function(z) {
      expect(x).toBe(1);
      expect(z).toBe(2);
      x = z;
                 done()
    }, 2);
  });
});
