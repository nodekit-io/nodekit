var helper = require('./specHelper'),
    stream = require('stream'),
    util   = require('util'),
    fs     = require('fs');

/*describe("fs.WriteStream", function() {

  it("should be returned from a call to fs.createWriteStream", function() {
    var tmpFile = java.io.File.createTempFile("write-stream", ".txt");
    expect(fs.createWriteStream(tmpFile.getAbsolutePath()) instanceof fs.WriteStream).toBeTruthy();
  });

  it("should be a Stream.Writable", function() {
    var tmpFile = java.io.File.createTempFile("write-stream", ".txt");
    expect(fs.createWriteStream(tmpFile.getAbsolutePath()) instanceof stream.Writable).toBeTruthy();
  });

}); */

describe("fs.ReadStream", function() {

  it("should be returned from a call to fs.createReadStream", function(done) {
   helper.writeFixture(function(f) {
      var readStream = fs.createReadStream(f.getAbsolutePath());
      expect(readStream).toBeTruthy();
      expect(readStream instanceof fs.ReadStream).toBeTruthy();
      expect(readStream instanceof stream.Readable).toBeTruthy();
      f.delete();
      readStream.close();
      done()
    });
  });

  // TODO: Node.js throws an uncatchable error?
  it("should throw ENOENT on a call to fs.createReadStream when a file can't be found", function(done) {
    try {
      fs.createReadStream('not-found.txt');
      // this.fail('fs.createReadStream should fail with ENOENT');
    } catch(e) {
      done()
    }
  });

  it("should read files.", function(done) {
    var data = "Now is the winter of our discontent / " +
               "Made glorious summer by this son of York";
    helper.writeFixture(function(f) {
      var result = '',
          readStream = fs.createReadStream(f.getAbsolutePath());

      readStream.on('data', function(chunk) {
        result += chunk;
      });

      readStream.on('end', function() {
        expect(result).toEqual(data);
        readStream.close(function() {
          f.delete();
          done()
        });
      });
    }, data);
  });

  it("should emit 'close' when it has been closed", function(done) {
    var data = "Now is the winter of our discontent / " +
               "Made glorious summer by this son of York";

    helper.writeFixture(function(f) {
      var result = '',
          readStream = fs.createReadStream(f.getAbsolutePath());

      readStream.on('data', function(chunk) {
        result += chunk;
      });

      readStream.on('close', function() {
        expect(result).toEqual(data);
        f.delete();
        done()
      });

      readStream.on('end', function(chunk) {
        if (chunk) result += chunk;
        readStream.close();
      });
    }, data);
  });

  it("should emit 'open' when the file has opened.", function(done) {
    var data = "Now is the winter of our discontent / " +
               "Made glorious summer by this son of York";
    helper.writeFixture(function(f) {
      var result = '',
          readStream = fs.createReadStream(f.getAbsolutePath());

      // how is this not a race condition?
      readStream.on('open', function() {
        f.delete();
        done()
      });
    }, data);
  });

  it("should read a subset of file data.", function(done) {
    var data = "Now is the winter of our discontent / " +
               "Made glorious summer by this son of York";
    helper.writeFixture(function(f) {
      var result = '',
          readStream = fs.createReadStream(f.getAbsolutePath(),
            {start: 4, end: 20});

      readStream.on('data', function(chunk) {
        result += chunk;
      });

      readStream.on('end', function() {
        expect(result).toEqual("is the winter of ");
        f.delete();
        readStream.close();
        done()
      });
    }, data);
  });
});
