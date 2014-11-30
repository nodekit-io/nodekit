
var jasmine = require('test/server.js');

jasmine.run(
              {
              "spec_dir": "spec-node",
            "spec_files": [
                           "fsSpec.js"
                       
                        /*  "*[sS]pec.js"*/
                           ],
              "spec_files2": [
                              "assertSpec.js",
                              "bufferSpec.js",
                              "childProcessSpec.js",
                              "clusterSpec.js",
                              "consoleSpec.js",
                              "cryptoCipherSpec.js",
                              "cryptoDHSpec.js",
                              "cryptoHashSpec.js",
                              "cryptoHmacSpec.js",
                              "cryptoPbkdf2Spec.js",
                              "cryptoRandomSpec.js",
                              "cryptoSignCommonSpec.js",
                              "cryptoSignSpec.js",
                              "dgramSpec.js",
                              "dnsSpec.js",
                              "fsSpec.js",
                              "fsStatSpec.js",
                              "fsStreamSpec.js",
                              "fsWatchSpec.js",
                              "globalSpec.js",
                              "httpAgentSpec.js",
                              "httpClientSpec.js",
                              "httpSpec.js",
                              "modulesSpec.js",
                              "netPauseSpec.js",
                              "netServerSpec.js" ,
                              "osSpec.js",
                              "pathSpec.js",
                              "processSpec.js",
                              "queryStringSpec.js",
                              "streamBigPacketSpec.js",
                              "streamDuplexSpec.js",
                              "streamEndPauseSpec.js",
                              "streamPipeAfterEndSpec.js",
                              "streamPipeCleanupSpec.js",
                              "streamPipeErrorHandlingSpec.js",
                              "streamPipeEventSpec.js",
                              "streamTransformSpec.js",
                              "stringDecoderSpec.js",
                              "timersSpec.js",
                                 "tlsSpec.js",
                              "urlSpec.js",
                              "utilSpec.js",
                              "vmSpec.js",
                              "zlibSpec.js"
                           /*  "*[sS]pec.js" */
                             ],
              "helpers": ["specHelper.js",
                          "helpers/*.js"
                          ]
              }
);


/*var http = require('http');

var express = require('express')
var app = express()

app.get('/', function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
       res.end('<html><body>Hello World</body>', 'utf-8');

        })

var server = http.createServer(app);


server.listen(8000, "localhost");

console.log("Server running at http://127.0.0.1:8000/"); */


      //               server.listen();

/*var fs = require('fs');
var path = require('path');
var http = require('http');
var util = require('util');

var server = http.createServer(function (request, response) {
                               io.nodekit.console.log(request.headers.host + request.url);
                               
                              var file = path.resolve('./default.html');
                               
                               fs.readFile(file, function read(err, content) {
                                           if (err) {
                                           console.log(err);
                                           response.writeHead(500, { 'Content-Type': 'text/html' });
                                           response.end('<html><body>An internal server error occurred</body>', 'utf-8');
                                           }
                                           else {
                                           
                                           response.writeHead(200, { 'Content-Type': 'text/html' });
                                           response.end(content, 'utf-8');
                                           }
                                           });
                               
                         //     response.writeHead(200, { 'Content-Type': 'text/html' });
                         //     response.end('<html><body>Hello World</body>', 'utf-8');
                               
                                   });

server.listen(8000, "localhost");

console.log("Server running at http://127.0.0.1:8000/"); */