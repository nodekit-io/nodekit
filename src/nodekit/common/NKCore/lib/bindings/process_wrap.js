/*
 * Copyright (c) 2016 OffGrid Networks
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

function Process() {
    this._process = {};
}

Object.defineProperty( Process.prototype, 'pid', {
    get: function() {
        return new Error("Not Implemented");
    }
});

Process.prototype._onExit = function(result) {
  var exitCode = undefined;
  var signal   =undefined;
  this.onexit( exitCode, signal );
}

Process.prototype.spawn = function(options) {
    return new Error("Not Implemented");
}

Process.prototype.close = function() {
    return new Error("Not Implemented");
}

Process.prototype.kill = function(signal) {
    return new Error("Not Implemented");
}

module.exports.Process = Process;