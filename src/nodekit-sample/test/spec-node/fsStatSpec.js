var helper = require('./specHelper'),
    util   = require('util'),
    path   = require('path'),
    fs     = require('fs');

describe("fs.Stat", function() {

  it("should generate an error if the file is not found", function(done) {
     fs.stat('invalidpath', function(err, stat) {
      expect(err instanceof Error).toBeTruthy();
      expect(err.path).toBe(path.resolve('invalidpath'));
      expect(err.syscall).toBe('stat');
      expect(stat).toBeFalsy();
      done()
    });
  });

  it("should support isFile()", function(done) {
     helper.writeFixture(function(sut) {
      fs.stat(sut.getAbsolutePath(), function(err, stats) {
        expect(err).toBeFalsy();
        expect(stats).toBeTruthy();
        expect(stats.isFile()).toBeTruthy();
        sut.delete();
        done()
      });
    });
  });

  it("should support isDirectory()", function(done) {
     helper.writeFixture(function(sut) {
      fs.stat(sut.getParent(), function(err, stats) {
        expect(err).toBeFalsy();
        expect(stats).toBeTruthy();
        expect(stats.isDirectory()).toBeTruthy();
        sut.delete();
        done()
      });
    });
  });

  it("should support isCharacterDevice()", function(done) {
    helper.writeFixture(function(sut) {
      fs.stat(sut.getAbsolutePath(), function(err, stats) {
        expect(err).toBeFalsy();
        expect(stats).toBeTruthy();
        expect(typeof stats.isCharacterDevice).toBe('function');
        sut.delete();
        done()
      });
    });
  });

  it("should support isBlockDevice()", function(done) {
    helper.writeFixture(function(sut) {
      fs.stat(sut.getAbsolutePath(), function(err, stats) {
        expect(err).toBeFalsy();
        expect(stats).toBeTruthy();
        expect(typeof stats.isBlockDevice).toBe('function');
        sut.delete();
        done()
      });
    });
  });

  it("should support isFIFO()", function(done) {
    helper.writeFixture(function(sut) {
      fs.stat(sut.getAbsolutePath(), function(err, stats) {
        expect(err).toBeFalsy();
        expect(stats).toBeTruthy();
        expect(typeof stats.isFIFO).toBe('function');
        sut.delete();
        done()
      });
    });
  });

  it("should support isSocket()", function(done) {
     helper.writeFixture(function(sut) {
      fs.stat(sut.getAbsolutePath(), function(err, stats) {
        expect(err).toBeFalsy();
        expect(stats).toBeTruthy();
        expect(typeof stats.isSocket).toBe('function');
        sut.delete();
        done()
      });
    });
  });

  it("should provide the file mode", function(done) {
    helper.writeFixture(function(sut) {
      fs.stat(sut.getAbsolutePath(), function(err, stats) {
        expect(err).toBeFalsy();
        expect(stats).toBeTruthy();
        // kind of a crappy test, but we don't know what the
        // umask is on the host system when tests are being run,
        // so just assume it's greater than octal 100000.
        expect(stats.mode).toBeGreaterThan(32768);
        done()
      });
    });
  });
});


describe("fs.StatSync", function() {

  it("should generate an error if the file is not found", function() {
    try {
      fs.statSync('invalidpath');
    } catch(err) {
      expect(err instanceof Error).toBeTruthy();
      expect(err.path).toBe(path.resolve('invalidpath'));
      expect(err.syscall).toBe('stat');
    }
  });

  it("should support isFile()", function(done) {
     helper.writeFixture(function(sut) {
      var stats = fs.statSync(sut.getAbsolutePath());
      expect(stats).toBeTruthy();
      expect(stats.isFile()).toBeTruthy();
      sut.delete();
      done()
    });
  });

  it("should support isDirectory()", function(done) {
   helper.writeFixture(function(sut) {
      var stats = fs.statSync(sut.getParent());
      expect(stats).toBeTruthy();
      expect(stats.isDirectory()).toBeTruthy();
      sut.delete();
      done()
    });
  });

  it("should support isCharacterDevice()", function(done) {
   helper.writeFixture(function(sut) {
      var stats = fs.statSync(sut.getAbsolutePath());
      expect(stats).toBeTruthy();
      expect(typeof stats.isCharacterDevice).toBe('function');
      sut.delete();
      done()
    });
  });

  it("should support isBlockDevice()", function(done) {
    helper.writeFixture(function(sut) {
      var stats = fs.statSync(sut.getAbsolutePath());
      expect(stats).toBeTruthy();
      expect(typeof stats.isBlockDevice).toBe('function');
      sut.delete();
      done()
    });
  });

  it("should support isFIFO()", function(done) {
    helper.writeFixture(function(sut) {
      var stats = fs.statSync(sut.getAbsolutePath());
      expect(stats).toBeTruthy();
      expect(typeof stats.isFIFO).toBe('function');
      sut.delete();
      done()
    });
  });

  it("should support isSocket()", function(done) {
   helper.writeFixture(function(sut) {
      var stats = fs.statSync(sut.getAbsolutePath());
      expect(stats).toBeTruthy();
      expect(typeof stats.isSocket).toBe('function');
      sut.delete();
      done()
    });
  });
});
