/*
 * Copyright 2015 Domabo.  Portions copyright (c) 2014 Drew Young
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
= exports.getNetworkInterfaces
= function () { return {} };

module.exports.arch = function () { return 'javascript' };

module.exports.platform = function () { return 'browser' };

module.exports.tmpdir = exports.tmpDir = function () {
    return '/tmp';
};

module.exports.EOL = '\n';