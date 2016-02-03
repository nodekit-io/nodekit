var path = require('path');
var JasmineRunner = require('./lib/jasmineRunner.js');
var fs = require('fs');
var util = require('util');
var ipc = require('electro').ipcMain;

module.exports = {
start: function(options) {
    var parentScriptRoot = path.dirname(module.parent.filename);
    var clientRoot = options.root || parentScriptRoot;
    var jasmineRoot = path.join(__dirname, 'node_modules', 'jasmine-core', 'lib');
    
    ipc.on("nk.TestExecute", function(event, arg){
           var jasmineRunner = new JasmineRunner(event);
           jasmineRunner.loadConfig(options);
           jasmineRunner.configureDefaultReporter({onComplete: function(passed) {
                                                  var str =event.getD3ReportAsString();
                                                  event.returnValue = str;
                                                  } });
           
           jasmineRunner.execute();
           })
    

},
    
stop: function() {
},
    
run: function(options) {
    this.start(options);
}
};

function errorNotification(err, str, req) {
    var title = 'Error in ' + req.method + ' ' + req.url;
    
    console.log(title);
}

