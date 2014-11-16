describe("#globValues", function() {
  var util = module.exports;

  it("should pass each glob#sync the root for its current working dir", function() {
    util.globValues({key: ['file1', 'file2']}, 'some root dir');
    expect(glob.sync.calls.argsFor(0)[1].cwd).toBe('some root dir');
    expect(glob.sync.calls.argsFor(1)[1].cwd).toBe('some root dir');
  });

  describe("after being called", function() {
    beforeEach(function() {
      this.fileObj = {
        key: 'files',
        otherKey: ['more files', 'even more files']
      };

      glob.sync = function(files) {
       return [files + ' globbed', files + ' globbed again'];
      };
    });

    it("should expand each file glob in each key", function() {
      expect(util.globValues(this.fileObj)).toEqual({
        key: ['files globbed', 'files globbed again'],
        otherKey: [
          'more files globbed',
          'more files globbed again',
          'even more files globbed',
          'even more files globbed again'
        ]
      });
    });

    it("should not change the file object passed in", function() {
      expect(this.fileObj.key).toBe('files');
    });
  });
});
