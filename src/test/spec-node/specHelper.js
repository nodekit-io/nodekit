// Should only happen when running with a test-patter
/*// for a single spec. Otherwise, specRunner.js handles this.
if ((typeof nodyn) !== 'object') {
  load('./node.js');
  (function() {
    jasmine.WaitsForBlock.TIMEOUT_INCREMENT = 1;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 1;
    jasmineEnv = jasmine.getEnv();
    origCallback = jasmineEnv.currentRunner_.finishCallback;
    jasmineEnv.currentRunner_.finishCallback = function() {
      origCallback.call(this);
      process.exit();
    };
  })();
} /*/

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
        };

  };

  module.exports = new Helper();
})();
