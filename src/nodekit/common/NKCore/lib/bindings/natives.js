/*
 * Copyright (c) 2016 OffGrid Networks.   Portions Copyright Red Hat, Inc.
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

"use strict";

var getSource = require('native_module').getSource;

var source = {};

/* BUILT-IN UNMODIFIED NODE.JS SOURCES */
[   '_debugger',
	'_http_agent',
	'_http_client',
	'_http_common',
	'_http_incoming',
	'_http_outgoing',
	'_http_server',
	'_linklist',
	'_stream_duplex',
	'_stream_passthrough',
	'_stream_readable',
	'_stream_transform',
    '_stream_writable',
    '_tls_common',
	'_tls_legacy',
	'_tls_wrap',
	'assert',
 	/* 'buffer', ** SEE REPLACEMENT SECTION BELOW ** */
	'child_process',
	'cluster',
	'console',
	'constants',
  	/* 'crypto', ** SEE REPLACEMENT SECTION BELOW ** */
	'dgram',
	'dns', /**  HANDLED BY cares_wrap ** */
	'domain',
	'events',
	'freelist',
	'fs',
	'http',
	'https',
	'module',
	'net',
	'os',
	'path',
  	'punycode',
	'querystring',
	'readline',
	'repl',
     'smalloc',
	'stream',
	'string_decoder',
	'sys',
    'timers',
	'tls',
   'tty',
	'url',
   'util',
    'vm',
	'zlib',
     ].forEach( function(name) {
  source[name] = getSource('lib/node/' + name);
   });

/* CUSTOM NODE.JS API REPLACEMENTS*/
[
	'buffer', /* 'dns', alternative to cares_wrap */ 'crypto'
 ].forEach(function (name) {
           source[name] = getSource('lib/builtin-replacements/' + name );
           });

/* CUSTOM NODE.JS API ADDITIONS*/
[
    'asap',
	'promise',
 ].forEach(function (name) {
           source[name] = getSource('lib/builtin-additions/' + name );
           });

/* CUSTOM NODE.JS API ADDITIONS*/
[
   	'electro', 'electro_protocol', 'platform'
 ].forEach(function (name) {
           source[name] = getSource('lib/builtin-nodekit/' + name );
           });

source['electron'] = source['electro'];

/* CUSTOM NODE.JS API ADDITIONS*/
  source["_third_party_main"] = getSource('lib/_nodekit_third_party_main.js');

source.config = "\\gyp\n{}";


module.exports = source;

