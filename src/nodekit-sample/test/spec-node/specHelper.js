var fs = require('fs');

(function() {
      var Helper = function() {
        __complete = false;

     this.testComplete = function(complete) {
         if (typeof complete === 'boolean') {
         __complete = complete;
         }
         return __complete;
     };
 
     var fileWrapper  = function(path) {
         var tmpFile = {};
        this._path = path;
        this.getAbsolutePath = function() { return this._path};
        this.exists = function() { return fs.existsSync(this._path); };
        this.delete = function() { fs.unlinkSync(this._path); }
     };
 
    this.File = function(path){
        return new fileWrapper(path);
    }
 
 var directoryWrapper  = function(path) {
 var tmpFile = {};
 this._path = path;
 this.getAbsolutePath = function() { return this._path};
 this.exists = function() { return fs.existsSync(this._path); };
 this.delete = function() { fs.rmdir(this._path); }
 };
 
 this.Directory = function(path){
 return new directoryWrapper(path);
 }
 
 
     this.writeFixture  = function(func, data) {
         var tmpFile = io.nodekit.platform.fs.getTempDirectorySync() + '/nodekit-spec.txt';
         if (!data) {
         data = 'This is a fixture file used for testing. It may be deleted.';
         }
         fs.writeFile(tmpFile, data, function(err) {
                      if (err) throw err;
                      func(new fileWrapper(tmpFile));
                      });
    };
     
  
     this.createTempFile  = function(data) {
         var tmpFile = io.nodekit.platform.fs.getTempDirectorySync() + '/nodekit-spec.txt';
         if (!data) {
         data = 'This is a fixture file used for testing. It may be deleted.';
         }
         fs.writeFileSync(tmpFile, data);
         return new fileWrapper(tmpFile);
         
     
     };
 
   };


  module.exports = new Helper();
})();
