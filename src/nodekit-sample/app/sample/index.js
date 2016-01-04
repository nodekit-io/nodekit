var util = require('util');

console.log("STARTING SAMPLE APPLICATION");

var fs = require('fs');
var path = require('path');
var http = require('http');
var server = http.createServer( function (request, response) {
                               var file = path.resolve(__dirname, 'sample.html');
                               
                               fs.readFile(file, function read(err, content) {
                                           if (err) {
                                           console.log(err);
                                           response.writeHead(500, { 'Content-Type': 'text/html' });
                                           response.end('<html><body>An internal server error occurred</body>', 'utf-8');
                                           } else {
                                           response.writeHead(200, { 'Content-Type': 'text/html' });
                                           response.end(content, 'utf-8');
                                           }
                                           });
                               });

server.listen(3000);

console.log("Server running");