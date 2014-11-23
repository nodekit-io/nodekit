var connect = require('connect');
var serveStatic = require('serve-static');
var http = require('http');
var path = require('path');
var Jasmine = require('./lib/jasmine.js');
var fs = require('fs');

var util = require('util');

module.exports = {
start: function(options) {
    var parentScriptRoot = path.dirname(module.parent.filename);
    var clientRoot = options.root || parentScriptRoot;
    var publicRoot = path.join(__dirname, 'public');
    var jasmineRoot = path.join(__dirname, 'node_modules', 'jasmine-core', 'lib');
    
    var app = connect();
    app.use('/', function(request, response, next) {
         console.log(request.url);
            next();
         })
    .use('/test/execute', function(request, response, next) {
         response.writeHead(200, {"Context-Type": "application/json"});
         var jasmine = new Jasmine(request);
         jasmine.loadConfig(options);
         
         jasmine.configureDefaultReporter({onComplete: function(passed) {
                                          response.end( request.getD3ReportAsString());
                                          console.log(request.getD3ReportAsString());
                                          } });
         jasmine.execute();
         
           })
    .use('/test/jasmine', serveStatic(jasmineRoot))
    .use('/test', serveStatic(publicRoot));
    this.server = http.createServer(app);
    this.server.listen(options.port || 8000, 'localhost');
},
    
stop: function() {
    this.server.close();
},
    
run: function(options) {
    this.start(options);
}
};

