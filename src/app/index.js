var fs = require('fs');
var path = require('path');
var http = require('http');

var server = http.createServer(function (request, response) {
                               io.nodekit.console.log(request.headers.host + request.url);
                               
                               var file = path.resolve('./default.html');
                               
                               fs.readFile(file, function read(err, content) {
                                           if (err) {
                                           response.writeHead(500);
                                           response.end();
                                           }
                                           else {
                                           
                                           response.writeHead(200, { 'Content-Type': 'text/html' });
                                           response.end(content, 'utf-8');
                                           }
                                           });
                               
                                   });

server.listen(8000);

console.log("Server running at http://127.0.0.1:8000/");