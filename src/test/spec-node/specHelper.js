// This is the equivalent of the old waitsFor/runs syntax
// which was removed from Jasmine 2
waitsFor = function(escapeFunction, runFunction, escapeTime) {
    // check the escapeFunction every millisecond so as soon as it is met we can escape the function
    var interval = setInterval(function() {
                               if (escapeFunction()) {
                               clearMe();
                               runFunction();
                               }
                               }, 1);
    
    // in case we never reach the escapeFunction, we will time out
    // at the escapeTime
    var timeOut = setTimeout(function() {
                             clearMe();
                             runFunction();
                             }, escapeTime);
    
    // clear the interval and the timeout
    function clearMe(){
        clearInterval(interval);
        clearTimeout(timeOut);
    }
};

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
     
     this.writeFixture  = function(func, data) {
         var tmpFile = io.nodekit.fs.getTempDirectory() + '/nodekit-spec.txt';
         if (!data) {
         data = 'This is a fixture file used for testing. It may be deleted.';
         }
         fs.writeFile(tmpFile, data, function(err) {
                      if (err) throw err;
                      func(tmpFile);
                      });
    };
     
  
     this.writeFixtureSync  = function(data) {
         var tmpFile = io.nodekit.fs.getTempDirectory() + '/nodekit-spec.txt';
         if (!data) {
         data = 'This is a fixture file used for testing. It may be deleted.';
         }
         fs.writeFileSync(tmpFile, data);
         return tmpFile;
         
     
     };
   };


  module.exports = new Helper();
})();
