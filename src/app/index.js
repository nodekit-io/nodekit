console.log("NODEKIT DEFAULT APPLICATION STARTED");

//throw new Error('TEST');

io.nodekit.createServer(function (request, response) {
                        console.log("NODEKIT DEFAULT APPLICATION REQUEST");
                        response.writeHead(200, {"Content-Type": "text/plain"});
                        response.end("Hello World\n");
                        console.log("NODEKIT DEFAULT APPLICATION REQUEST2");
                        });

console.log("NODEKIT DEFAULT APPLICATION ENDED");