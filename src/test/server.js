var connect = require('connect');
var serveStatic = require('serve-static');
var http = require('http');
var path = require('path');
var handlebars = require('handlebars');
var Jasmine = require('./lib/jasmine.js');
var fs = require('fs');

var util = require('util');

module.exports = {
start: function(options) {
    var parentScriptRoot = path.dirname(module.parent.filename);
    var clientRoot = options.root || parentScriptRoot;
    var runnerRoot = path.join(__dirname, 'runner');
    var jasmineRoot = path.join(__dirname, 'node_modules', 'jasmine-core', 'lib');
    var templateFilename = path.join(__dirname, 'lib', 'views', 'spec_runner.html.hbs');
    var specRunnerTemplate = fs.readFileSync(templateFilename, 'utf8');
    var compiledTemplate =  handlebars.compile(specRunnerTemplate);
    
    var app = connect();
    
    app.use('/', function(request, response, next) {
            console.log(request.url);
            if (!request.url.match(/^\/(\?.*)?$/)) {
            next();
            } else {
            response.writeHead(200, {"Context-Type": "text/html"});
            var jasmine = new Jasmine(request);
            jasmine.loadConfig(options);
            
            jasmine.configureDefaultReporter({onComplete: function(passed) {
                                             console.log("EXITED ");
                                             response.end( compiledTemplate(request.getJSReport()));
                                             console.log(util.inspect(request.getJSReport()));
                                             
                                             } });
            jasmine.execute();
            
            }
            })
    .use('/jasmine', serveStatic(jasmineRoot))
    .use('/runner', serveStatic(runnerRoot))
    .use('/app', serveStatic(clientRoot));
    
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

