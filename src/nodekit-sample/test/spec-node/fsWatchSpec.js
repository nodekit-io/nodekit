var helper = require('./specHelper'),
    util = require('util'),
    fs = require('fs');

describe("fs.watch", function() {
  var tmpDir  = java.lang.System.getProperty('java.io.tmpdir'),
      tmpFile = tmpDir + '/fs-watch-spec.tmp';

   it('should recive change events', function(done) {
    fs.writeFileSync(tmpFile, 'change event: ');
    var watcher = fs.watch(tmpFile, function(evt, filename) {
      expect(filename).toBe('fs-watch-spec.tmp');
      expect(evt).toBe('change');
      watcher.close();
      fs.unlinkSync(tmpFile);
      done()
    });
    // Have to use a sketchy setTimeout call here because
    // process.nextTick does not wait for blocking tasks
    // to complete. Suboptimal and probably broken in CI.
    setTimeout(function() {
      fs.appendFile(tmpFile, 'changed');
    }, 4000);
  });

  it('should recive delete events', function(done) {
    fs.writeFileSync(tmpFile, 'change event: ');
    var watcher = fs.watch(tmpFile, function(evt, filename) {
      expect(filename).toBe('fs-watch-spec.tmp');
      expect(evt).toBe('delete');
      watcher.close();
      done()
    });
    // Have to use a sketchy setTimeout call here because
    // process.nextTick does not wait for blocking tasks
    // to complete. Suboptimal and probably broken in CI.
    setTimeout(function() {
      fs.unlinkSync(tmpFile);
    }, 4000);
  });
});


