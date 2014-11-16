var connect = require('connect');
var serveStatic = require('serve-static');
var http = require('http');
var path = require('path');
var _ = require('underscore');

var util = require('./util.js');
var node_util = require('util');
module.exports = {
  start: function(options) {
    var parentScriptRoot = path.dirname(module.parent.filename);
    var clientRoot = options.root || parentScriptRoot;
    var runnerRoot = path.join(__dirname, 'runner');
    var jasmineRoot = path.join(__dirname, '..', 'node_modules', 'jasmine-core', 'lib');
    var showColors = _.isUndefined(options.showColors) ? true : options.showColors;
    
    var app = connect()
      .use('/', function(err, req, res, next) {
           if (err)
           console.log(err);
           next();
           
           })
      .use('/', _.bind(function(request, response, next) {
                       console.log(request.url);
         if (!request.url.match(/^\/(\?.*)?$/)) {
          next();
        } else {
                       console.log("STARTING SPEC");
          response.writeHead(200, {"Context-Type": "text/html"});
          var files = util.globValues(options.files, clientRoot);
              console.log("FILES: " + node_util.inspect(files));
          response.end(util.buildSpecRunner(files, showColors));
        }
      }, this))
      .use('/jasmine', serveStatic(jasmineRoot))
      .use('/runner', serveStatic(runnerRoot))
      .use('/app', serveStatic(clientRoot));

    this.server = http.createServer(app);
    this.server.listen(options.port || 8000, 'localhost');
      console.log("Server Started");
  },

  stop: function() {
    this.server.close();
  },

  run: function(options) {
    this.start(options);
  }
};
