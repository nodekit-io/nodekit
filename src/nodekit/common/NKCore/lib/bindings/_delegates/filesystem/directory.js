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
function Directory() {
  Item.call(this);

  /**
   * Items in this directory.
   * @type {Object.<string, Item>}
   */
  this._items = {};

  /**
   * Permissions.
   */
  this._mode = 0777;
  this._isFile = false;
  this._isDirectory = true;

}
util.inherits(Directory, Item);


/**
 * Add an item to the directory.
 * @param {string} name The name to give the item.
 * @param {Item} item The item to add.
 * @return {Item} The added item.
 */
Directory.prototype.addItem = function(name, item) {
  if (this._items.hasOwnProperty(name)) {
    throw new Error('Item with the same name already exists: ' + name);
  }
  this._items[name] = item;
  ++item.links;
  if (item instanceof Directory) {
    // for '.' entry
    ++item.links;
    // for subdirectory
    ++this.links;
  }
  this.setMTime(new Date());
  return item;
};


/**
 * Get a named item.
 * @param {string} name Item name.
 * @return {Item} The named item (or null if none).
 */
Directory.prototype.getItem = function(name) {
  var item = null;
  if (this._items.hasOwnProperty(name)) {
    item = this._items[name];
  }
  return item;
};


/**
 * Remove an item.
 * @param {string} name Name of item to remove.
 * @return {Item} The orphan item.
 */
Directory.prototype.removeItem = function(name) {
  if (!this._items.hasOwnProperty(name)) {
    throw new Error('Item does not exist in directory: ' + name);
  }
  var item = this._items[name];
  delete this._items[name];
  --item.links;
  if (item instanceof Directory) {
    // for '.' entry
    --item.links;
    // for subdirectory
    --this.links;
  }
  this.setMTime(new Date());
  return item;
};


/**
 * Get list of item names in this directory.
 * @return {Array.<string>} Item names.
 */
Directory.prototype.list = function() {
  return Object.keys(this._items).sort();
};


/**
 * Get directory stats.
 * @return {Object} Stats properties.
 */
Directory.prototype.getStats = function() {
  var stats = Item.prototype.getStats.call(this);
  stats.mode = this.getMode() | constants.S_IFDIR;
  stats.size = 1;
  stats.blocks = 1;
  return stats;
};


/**
 * Export the constructor.
 * @type {function()}
 */
exports = module.exports = Directory;
