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

var Directory = require('./directory');
var File = require('./file');
var FSError = require('./error');
var SymbolicLink = require('./symlink');
var Promise = require('promise');
var Buffer = require('buffer').Buffer;
var native = require('platform').fs;

/**
 * Create a new file system for OSX bridge
 * @constructor
 */
function FileSystem() {
}

/**
 * Get a file system item.
 * @param {string} filepath Path to item.
 * @return {Promise<Item>} The item (or null if not found).
 */
FileSystem.prototype.getItemAsync = function (filepath) {
    var fs_StatAsync = Promise.denodeify(function(id, callback){native.statAsync(id, callback);});
    
    return fs_StatAsync(filepath)
    .then(function(storageItem){
             return FileSystem.storageItemtoItemWithStat(storageItem);
          }, function(err){
             return null;
          });
}

/**
 * Get a file system item.
 * @param {string} filepath Path to item.
 * @return {Promise<Item>} The item (or null if not found).
 */
FileSystem.prototype.getItemSync = function (filepath) {
    var storageItem = native.statSync(filepath);
    return FileSystem.storageItemtoItemWithStat(storageItem);
};


/**
 * Get a file system item.
 * @param {string} filepath Path to item.
 * @return {Promise<Item>} The item (or null if not found).
 */
FileSystem.storageItemtoItemWithStat = function (storageItem) {
    var stat = {};
    
    if (storageItem && storageItem.filetype) {
        stat.path = storageItem.path;
        stat.birthtime = storageItem.birthtime;
        stat.mtime = storageItem.mtime;
        stat.atime = stat.mtime;
        stat.ctime = stat.mtime;
        stat.uid = 0;
        stat.gid = 0;
        stat.dev = 0;
        stat.ino = 0;
        stat.nlink =1;
        
        if (storageItem.filetype == "Directory")
        {
            stat.mode = 438; // 0777;
            stat._isFolder = true;
            stat._isFile = false;
            stat.size = 0;
            var dir = new FileSystem.directory(stat)();
            dir._storageItem = storageItem;
            return dir;
            
        }
        else
        {
            stat.mode = 0666;
            stat._isFolder = false;
            stat._isFile = true;
            stat.size = storageItem.size;
            var file = new FileSystem.file(stat)();
            file._storageItem = storageItem;
            return file;
        };
    }
    else
    {
        return;
      //  throw new FSError('ENOENT');
    }
    

};

/**
 * Get a file system item.
 * @param {string} filepath Path to item.
 * @return {Promise<Item>} The item (or null if not found).
 */
FileSystem.prototype.addStorageItem = function (item) {
    storageItem={};
    var stat = item.getStats();
    
    if (stat) {
        storageItem.path = item.getPath();
        storageItem.birthtime = stat.birthtime;
        storageItem.mtime = stat.mtime;
        storageItem.atime = stat.atime;
        storageItem.ctime = stat.ctime;
        
        if (stat._isFolder)
        {
            storageItem.filetype = "Directory"
        }
        else
        {
            storageItem.filetype = "File"
           };
        item._storageItem = storageItem;
        return storageItem;
    }
    else
    {
        throw new FSError('ENOENT');
    }
    
};



/**
 * Load Content
 * @param {file} file
 * @return {Promise<Item>} The item (or null if not found).
 */
FileSystem.prototype.loadContentSync = function (file) {
    if (typeof(file) == 'undefined'  || file._items)
        return null;
    
    try {
    var contentBase64 = native.getContentSync(file._storageItem);
    var content = new Buffer( contentBase64, 'base64');
        
    file.setContent(content);
    return file;
    }
    catch (ex)
    {console.log(ex);}
};

/**
 * Load Content
 * @param {file} file
 * @return {Promise<Item>} The item (or null if not found).
 */
FileSystem.prototype.loadContentAsync = function (file) {
    var fs_getContent = Promise.denodeify(function(id, callback){native.getContentAsync(id, callback);});
    
    return fs_getContent(file._storageItem)
    .then(function(content){
          file.setContent(content);
          return file;
          });
};

/**
 * Write Content
 * @param {file} file
 * @return {bool} Success.
 */
FileSystem.prototype.writeContentSync = function (file) {
  
    if (typeof(file) == 'undefined')
        return null;
    
    if (typeof(file._storageItem) == 'undefined')
        return null;
    
    var contentBase64 = file.getContent().toString('base64');
    return native.writeContentSync(file._storageItem, contentBase64);
};


/**
 * Write Content ASYNC
 * @param {file} file
 * @return {Promise<bool>} Success */
FileSystem.prototype.writeContentAsync = function (file, callback) {
    
    if (typeof(file) == 'undefined')
        return null;
      var contentBase64 = file.getContent().toString('base64');
    
      var fs_writeContent = Promise.denodeify(function(id, str, callback){
                                            return native.writeContentAsync(id, str, callback);
                                            });
    
    
    var contentBase64 = file.getContent().toString('base64');
    
    return fs_writeContent(file._storageItem, contentBase64);
};

/**
 * Write Content
 * @param {file} file
 * @return {Promise<Item>} The item (or null if not found).
 */
FileSystem.prototype.writeBufferSync = function (file, buffer) {
    if (typeof(file) == 'undefined')
        return null;
    
    var contentBase64 = buffer.toString('base64');
    return native.writeContentSync(file._storageItem, contentBase64);
  };


/**
 * Write Content ASYNC
 * @param {file} file
 * @return {Promise<Item>} The item (or null if not found).
 */
FileSystem.prototype.writeBufferAsync = function (file, buffer) {
    
    if (typeof(file) == 'undefined')
        return null;
    
    var fs_writeContent = Promise.denodeify(function(id, buf, callback){
                                            var contentBase64 = buf.toString('base64');
             native.writeContentAsync(id, contentBase64, callback);
                                            });
    
   
    return fs_writeContent(file._storageItem, buffer);


};


/**
 * Get directory listing
 * @param {string} filepath Path to directory.
 * @return {Promise<[]>} The array of item names (or error if not found or not a directory).
 */
FileSystem.prototype.getDirList = function (filepath) {
      var result = native.getDirectorySync(filepath);
    return result;
};

/**
 * Create directory
 * @param {string} filepath Path to directory.
 * @return bool
 */
FileSystem.prototype.mkdir = function (filepath) {
    var result = native.mkdirSync(filepath);
    return result;
};

/**
 * Create directory
 * @param {string} filepath Path to directory.
 * @return bool
 */
FileSystem.prototype.rmdir = function (filepath) {
    var result = native.rmdirSync(filepath);
    return result;
};

/**
 * Move or Rename File
 * @param {string} filepath Path to source file.
 * @param {string} filepath2 Path to target file.
 * @return bool
 */
FileSystem.prototype.move = function (filepath, filepath2) {
    var result = native.moveSync(filepath, filepath2);
    return result;
};

/**
 * Delete File
 * @param {string} filepath Path to directory.
 * @return bool
 */
FileSystem.prototype.unlink = function (filepath) {
    var result = native.unlinkSync(filepath);
    return result;
};

/**
 * Generate a factory for new files.
 * @param {Object} config File config.
 * @return {function():File} Factory that creates a new file.
 */
FileSystem.file = function (config) {
  config = config || {};
  return function() {
    var file = new File();
    if (config.hasOwnProperty('content')) {
      file.setContent(config.content);
    }
    if (config.hasOwnProperty('mode')) {
      file.setMode(config.mode);
    } else {
      file.setMode(0666);
    }
      if (config.hasOwnProperty('path')) {
          file.setPath(config.path);
      } else {
          throw new Error('Missing "path" property');
      }
      
    if (config.hasOwnProperty('uid')) {
      file.setUid(config.uid);
    }
    if (config.hasOwnProperty('gid')) {
      file.setGid(config.gid);
    }
      if (config.hasOwnProperty('size')) {
          file.setSize(config.size);
      }
    if (config.hasOwnProperty('atime')) {
     
      file.setATime(config.atime);
    }
    if (config.hasOwnProperty('ctime')) {
      file.setCTime(config.ctime);
    }
    if (config.hasOwnProperty('mtime')) {
      file.setMTime(config.mtime);
    }

    return file;
  };
};


/**
 * Generate a factory for new symbolic links.
 * @param {Object} config File config.
 * @return {function():File} Factory that creates a new symbolic link.
 */
FileSystem.symlink = function (config) {
  config = config || {};
  return function() {
    var link = new SymbolicLink();
    if (config.hasOwnProperty('mode')) {
      link.setMode(config.mode);
    } else {
      link.setMode(0666);
    }
    if (config.hasOwnProperty('uid')) {
      link.setUid(config.uid);
    }
    if (config.hasOwnProperty('gid')) {
      link.setGid(config.gid);
    }
    if (config.hasOwnProperty('path')) {
      link.setPath(config.path);
    } else {
      throw new Error('Missing "path" property');
    }
    if (config.hasOwnProperty('atime')) {
      link.setATime(config.atime);
    }
    if (config.hasOwnProperty('size')) {
          link.setSize(config.size);
      }
    if (config.hasOwnProperty('ctime')) {
      link.setCTime(config.ctime);
    }
    if (config.hasOwnProperty('mtime')) {
      link.setMTime(config.mtime);
    }
    return link;
  };
};


/**
 * Generate a factory for new directories.
 * @param {Object} config File config.
 * @return {function():Directory} Factory that creates a new directory.
 */
FileSystem.directory = function (config) {
  config = config || {};
  return function() {
    var dir = new Directory();
    if (config.hasOwnProperty('mode')) {
      dir.setMode(config.mode);
    }
    if (config.hasOwnProperty('uid')) {
      dir.setUid(config.uid);
    }
    if (config.hasOwnProperty('gid')) {
      dir.setGid(config.gid);
    }
    if (config.hasOwnProperty('atime')) {
      dir.setATime(config.atime);
    }
    if (config.hasOwnProperty('ctime')) {
      dir.setCTime(config.ctime);
    }
    if (config.hasOwnProperty('mtime')) {
      dir.setMTime(config.mtime);
    }
    return dir;
  };
};

// Used to speed up module loading.  Returns the contents of the file as
// a string or undefined when the file cannot be opened.  The speedup
// comes from not creating Error objects on failure.
FileSystem.prototype.internalModuleReadFile = function (path) {
    
    if (module.exports.internalModuleStat(path) === 0)
    {
        var contentBase64 = native.getContentSync({path: path});
        var content = (new Buffer( contentBase64, 'base64')).toString();
        return content;
    }
    else
        return undefined;
};


/**
 * Module exports.
 * @type {function}
 */
module.exports = FileSystem;



