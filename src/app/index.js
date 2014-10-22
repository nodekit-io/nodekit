var fs = require('fs');
var path = require('path');

io.nodekit.createServer(function (request, response) {
                        
                        console.log("NODEKIT DEFAULT APPLICATION REQUEST");
                        
                        var file = path.resolve('./default.html');
                        
                       var content =  fs.readFileSync(file);
                        
                        
                        if (content == null)
                        {
                                    response.writeHead(500);
                                    response.end();
                                    }
                                    else {
                                    io.nodekit.console.log("CONTENT" + content);
                                    
                                    
                                    response.writeHead(200, { 'Content-Type': 'text/html' });
                                    response.end(content, 'utf-8');
                                    }
                              
                        
                        });
