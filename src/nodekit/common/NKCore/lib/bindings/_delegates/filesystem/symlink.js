/*
 * Copyright (c) 2016 OffGrid Networks; Portions Copyright 2014 Tim Schaub
 *
 * Licensed under the the MIT license (the "License");
 * you may not use this file except in compliance with the License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy 
 * of this software and associated documentation files (the “Software”), to deal 
 * in the Software without restriction, including without limitation the rights 
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
 * copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in 
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL 
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR 
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR 
 * OTHER DEALINGS IN THE SOFTWARE.
 */

var util = require('util');

var Item = require('./item');

var constants = process.binding('constants');



/**
 * A directory.
 * @constructor
 */
function SymbolicLink() {
  Item.call(this);

  /**
   * Relative path to source.
   * @type {string}
   */
  this._path = undefined;

}
util.inherits(SymbolicLink, Item);


/**
 * Set the path to the source.
 * @param {string} pathname Path to source.
 */
SymbolicLink.prototype.setPath = function(pathname) {
  this._path = pathname;
};


/**
 * Get the path to the source.
 * @return {string} Path to source.
 */
SymbolicLink.prototype.getPath = function() {
  return this._path;
};


/**
 * Get symbolic link stats.
 * @return {Object} Stats properties.
 */
SymbolicLink.prototype.getStats = function() {
  var size = this._path.length;
  var stats = Item.prototype.getStats.call(this);
  stats.mode = this.getMode() | constants.S_IFLNK;
  stats.size = size;
  stats.blocks = Math.ceil(size / 512);
  return stats;
};


/**
 * Export the constructor.
 * @type {function()}
 */
exports = module.exports = SymbolicLink;
