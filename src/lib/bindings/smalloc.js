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

module.exports.alloc = function (obj, len, type) {
    return obj;
}

module.exports.truncate = function(obj, len) {
    return obj;
}

module.exports.sliceOnto = function (src, dest, start, end) {

    for (var i = start; i < end; i++) {
        dest[i] = src[i];
    }

    return src;
}

module.exports.kMaxLength = 64 * 1024;
