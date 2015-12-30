var util = require('util');

var levelup = require('levelup');
var memdown = require('memdown');

function MemDB (opts, fn) {
  if (typeof opts == 'function') {
    fn = opts;
    opts = {};
  }
  if (typeof opts == 'string') opts = {};
  opts = opts || {};
  opts.db = function (l) { return new memdown(l) };
  return levelup('', opts, fn);
}
var db = MemDB();
db.put('name', 'Yuri Irsenovich Kim')
db.put('dob', '16 February 1941')
db.put('spouse', 'Kim Young-sook')
db.put('occupation', 'Clown')
db.on('open', function() {console.log('open')})
db.readStream()
  .on('data', console.log)
  .on('close', function () { console.log('Show\'s over folks!') })
  

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