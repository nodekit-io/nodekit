/*
 * nodekit.io
 *
 * Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/*
 * D E F A U L T   A P P L I C A T I O N
 *
 * Simple http response server to display default.html
 *
 */

console.log("STARTING DEFAULT APPLICATION");

var fs = require('fs');
var path = require('path');

var server = io.nodekit.electro.protocol.createServer('node:', function (request, response) {
                                     console.log("EXECUTING DEFAULT APPLICATION");
                                     var file = path.resolve(__dirname, 'default.html');
                                     
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

 server.listen();
 
 console.log("Server running");