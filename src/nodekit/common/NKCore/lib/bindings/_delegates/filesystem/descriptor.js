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

var constants = process.binding('constants');



/**
 * Create a new file descriptor.
 * @param {number} flags Flags.
 * @constructor
 */
function FileDescriptor(flags) {

  /**
   * Flags.
   * @type {number}
   */
  this._flags = flags;

  /**
   * File system item.
   * @type {Item}
   */
  this._item = null;

  /**
   * Current file position.
   * @type {number}
   */
  this._position = 0;

}


/**
 * Set the item.
 * @param {Item} item File system item.
 */
FileDescriptor.prototype.setItem = function(item) {
  this._item = item;
};


/**
 * Get the item.
 * @return {Item} File system item.
 */
FileDescriptor.prototype.getItem = function() {
  return this._item;
};


/**
 * Get the current file position.
 * @return {number} File position.
 */
FileDescriptor.prototype.getPosition = function() {
  return this._position;
};


/**
 * Set the current file position.
 * @param {number} position File position.
 */
FileDescriptor.prototype.setPosition = function(position) {
  this._position = position;
};


/**
 * Check if file opened for appending.
 * @return {boolean} Opened for appending.
 */
FileDescriptor.prototype.isAppend = function() {
  return ((this._flags & constants.O_APPEND) === constants.O_APPEND);
};


/**
 * Check if file opened for creation.
 * @return {boolean} Opened for creation.
 */
FileDescriptor.prototype.isCreate = function() {
  return ((this._flags & constants.O_CREAT) === constants.O_CREAT);
};


/**
 * Check if file opened for reading.
 * @return {boolean} Opened for reading.
 */
FileDescriptor.prototype.isRead = function() {
  // special treatment because O_RDONLY is 0
  return (this._flags === constants.O_RDONLY) ||
      (this._flags === (constants.O_RDONLY | constants.O_SYNC)) ||
      ((this._flags & constants.O_RDWR) === constants.O_RDWR);
};


/**
 * Check if file opened for writing.
 * @return {boolean} Opened for writing.
 */
FileDescriptor.prototype.isWrite = function() {
  return ((this._flags & constants.O_WRONLY) === constants.O_WRONLY) ||
      ((this._flags & constants.O_RDWR) === constants.O_RDWR);
};


/**
 * Check if file opened for truncating.
 * @return {boolean} Opened for truncating.
 */
FileDescriptor.prototype.isTruncate = function() {
  return (this._flags & constants.O_TRUNC) === constants.O_TRUNC;
};


/**
 * Check if file opened with exclusive flag.
 * @return {boolean} Opened with exclusive.
 */
FileDescriptor.prototype.isExclusive = function() {
  return ((this._flags & constants.O_EXCL) === constants.O_EXCL);
};


/**
 * Export the constructor.
 * @type {function()}
 */
exports = module.exports = FileDescriptor;
