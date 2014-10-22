var fs = require('fs');
var path = require('path');

io.nodekit.createServer(function (request, response) {
                        
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