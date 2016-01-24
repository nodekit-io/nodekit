/*
 * Copyright (c) 2016 OffGrid Networks.  Portions copyright (c) 2014 Drew Young
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

module.exports.endianness = function () { return 'LE' };

module.exports.hostname = function () {
    if (typeof location !== 'undefined') {
        return location.hostname
    }
    else return '';
};

module.exports.loadavg = function () { return [] };

module.exports.uptime = function () { return 0 };

module.exports.freemem = function () {
    return Number.MAX_VALUE;
};

module.exports.totalmem = function () {
    return Number.MAX_VALUE;
};

module.exports.cpus = function () { return [] };

module.exports.type = function () { return 'Browser' };

module.exports.release = function () {
    if (typeof navigator !== 'undefined') {
        return navigator.appVersion;
    }
    return '';
};

module.exports.networkInterfaces
= exports.getInterfaceAddresses
= function () { return { lo0:
    [ { address: '::1',
        netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
         family: 'IPv6',
            mac: '00:00:00:00:00:00',
        scopeid: 0,
       internal: true },
     { address: '127.0.0.1',
        netmask: '255.0.0.0',
         family: 'IPv4',
            mac: '00:00:00:00:00:00',
       internal: true },
     { address: 'fe80::1',
        netmask: 'ffff:ffff:ffff:ffff::',
         family: 'IPv6',
            mac: '00:00:00:00:00:00',
        scopeid: 1,
       internal: true } ],
en0:
    [ { address: 'fe80::4ad7:5ff:fee1:48b9',
        netmask: 'ffff:ffff:ffff:ffff::',
         family: 'IPv6',
            mac: '48:d7:05:e1:48:b9',
        scopeid: 4,
       internal: false },
     { address: '10.26.12.202',
        netmask: '255.255.192.0',
         family: 'IPv4',
            mac: '48:d7:05:e1:48:b9',
       internal: false } ],
awdl0:
    [ { address: 'fe80::7c57:d8ff:fe31:4c82',
        netmask: 'ffff:ffff:ffff:ffff::',
         family: 'IPv6',
            mac: '7e:57:d8:31:4c:82',
        scopeid: 7,
       internal: false } ] };

};

module.exports.arch = function () { return 'javascript' };

module.exports.platform = function () { return 'browser' };

module.exports.tmpdir = exports.tmpDir = function () {
    return '/tmp';
};

module.exports.EOL = '\n';