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

var Item = require('./item');
var Buffer = require('buffer').Buffer;
var EMPTY =  Buffer(0);
var util = require('util');

var constants = process.binding('constants');


/**
 * A directory.
 * @constructor
 */
function File() {
  Item.call(this);
  
  /**
   * File content.
   * @type {Buffer}
   */
  this._content = EMPTY;
  this._isloaded = false;
    
    /**
     *  path to source.
     * @type {string}
     */
    this._path = undefined;
    /**
     * size of content
     * @type {number}
     */
    this._size = 0;
    
    this._isFile = true;
    this._isDirectory = false;
}
util.inherits(File, Item);


/**
 * Get the file contents.
 * @return {Buffer} File contents.
 */
File.prototype.getContent = function () {
  this.setATime(new Date());
  return this._content;
};


/**
 * Get size
 * @return {number} Size.
 */
File.prototype.getSize = function() {
    return this._size;
};

/**
 * Set the path to the source.
 * @param {string} pathname Path to source.
 */
File.prototype.setPath = function(pathname) {
    this._path = pathname;
};


/**
 * Get the path to the source.
 * @return {string} Path to source.
 */
File.prototype.getPath = function() {
    return this._path;
};



/**
 * Set size
 * @param {number} size Size.
 */
File.prototype.setSize = function(size) {
      this._size = size;
};


/**
 * Set the file contents.
 * @param {string|Buffer} content File contents.
 */
File.prototype.setContent = function (content) {
  this._isloaded = true;
  if (typeof content === 'string') {
    content = new Buffer(content);
  } else if (!Buffer.isBuffer(content)) {
      
      
    throw new Error('File content must be a string or buffer');
  }
  this._content = content;
    this._size = content.length;
    
  var now = Date.now();
  this.setCTime(new Date(now));
  this.setMTime(new Date(now));
};


/**
 * Get file stats.
 * @return {Object} Stats properties.
 */
File.prototype.getStats = function() {
    var size = this._size; //_content.length;
    
  var stats = Item.prototype.getStats.call(this);
  stats.mode = this.getMode() | constants.S_IFREG;
  stats.size = size;
  stats.blocks = Math.ceil(size / 512);
  return stats;
};

/**
 * Get content is loaded.
 * @return {bool} Content has been loaded.
 */
Item.prototype.getIsLoaded = function () {
    return this._isloaded;
};


/**
 * Export the constructor.
 * @type {function()}
 */
exports = module.exports = File;
