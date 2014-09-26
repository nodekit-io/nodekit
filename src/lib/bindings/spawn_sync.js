/*
 * Copyright 2014 Domabo
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

console.log("ERROR: spawn not yet implemented");

function spawn(options) {
  var result = {
    pid: null,
    output: [
      undefined,
      null,
      null,
    ],
    status: null,
    signal: undefined,
    error: undefined,
  };

  Object.defineProperty( result, 'stdout', {
    get: function() {
        return new Error("Not Implemented");
    },
    enumerable: true,
  });

  Object.defineProperty( result, 'stderr', {
    get: function() {
        return new Error("Not Implemented");
    },
    enumerable: true,
  });

  return result;
}

module.exports.spawn = spawn;
