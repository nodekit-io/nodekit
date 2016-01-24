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

/**
 * Create a new file system for WinRT bridge
 * @constructor
 */
function FileSystem() {

    var root = Windows.ApplicationModel.Package.Current.InstalledLocation;

  /**
   * Root directory.
   * @type {StorageFolder}
   */
  this._root = root;

}

FileSystem.prototype.toSync = function (promise) {
    return io.nodekit.natives.util.toSync(promise);
}

/**
 * Get a file system item.
 * @param {string} filepath Path to item.
 * @return {Promise<Item>} The item (or null if not found).
 */
FileSystem.prototype.getItem = function (filepath) {

    var stat = {};
    var item;

    return _root.GetFolderAsync(System.IO.Path.GetDirectoryName(filepath))
        .then(function (pathFolder) {
            return pathFolder.TryGetItemAsync(System.IO.Path.GetFileName(filepath));
        })
    .then(function (storageItem) {
        if (storageItem !== null) {
            item = storageItem;
            stat.birthtime = storageItem.DateCreated;
            if (item.isOfType(Windows.Storage.StorageItemTypes.folder)
            {
                stat.size = 0;
                stat.mode = 438; // 0777;
                stat._isFolder = true;
                stat._isFile = false;
            }
            else    
            {
                stat.mode = 0666;
                stat._isFolder = false;
                stat._isFile = true;
            }
            return storageItem.GetBasicPropertiesAsync();
        }
        else
            throw new FSError('ENOENT');
    })
    .then(function (properties) {
         stat.mtime = properties.DateModified;
        stat.atime = stat.mtime;
        stat.ctime = stat.mtime;
        stat.uid = 0;
        stat.gid = 0;
        if (stat._isFile)
        {
            stat.size = properties.size;
            var file = new FileSystem.file(stat);
            file._storageItem = item;
            return file;
        }
        else
        {
            stat.size = properties.size;
            var dir = new FileSystem.directory(stat);
            dir._storageItem = item;
            return dir;
        }
    });
};



/**
 * Load Content
 * @param {file} file
 * @return {Promise<Item>} The item (or null if not found).
 */
FileSystem.prototype.loadContent = function (file) {

    return Windows.Storage.FileIO.readBufferAsync(file._storageItem)
        .then(function(buffer){
            file.setContent(buffer);
            return file;
        });
}

/**
 * Get directory listing
 * @param {string} filepath Path to directory.
 * @return {Promise<[]>} The array of item names (or error if not found or not a directory).
 */
FileSystem.prototype.getDirList = function (filepath) {
    
    return _root.TryGetItemAsync(filepath)
        .then(function (storageItem) {
        if (item !== null) {
            if (item.isOfType(Windows.Storage.StorageItemTypes.folder))
            {
                return pathFolder.GetFilesAsync();
            }
            else    
            {
                throw new FSError('ENOTDIR');
            }
        }
        else
            throw new FSError('ENOENT');
    })
     .then(function (PathFiles) {
         var result = [];
         pathFiles.forEach(function (file) {
             result.push(file.Name);
         });
         return result;
     });
};


/**
 * Get a file system item.
 * @param {string} filepath Path to item.
 * @return {Promise<Item>} The item (or null if not found).
 */
FileSystem.prototype.getItemDirectory = function (filepath) {

    var stat = {};

    return _root.GetFolderAsync(filepath)
      .then(function (winRTfolder) {
          stat.ctime = winRTfolder.DateCreated.getTime() / 1000;
          return winRTfolder.GetBasicPropertiesAsync();
    })
    .then(function (properties) {
        stat.mtime = properties.DateModified.getTime() / 1000;
        stat.atime = stat.mtime;
        stat.size = 0;
        stat.mode = 0777;
        stat.uid = 0;
        stat.gid = 0;
        var item = new FileSystem.directory(stat);
        return item;
    });
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
    if (config.hasOwnProperty('uid')) {
      file.setUid(config.uid);
    }
    if (config.hasOwnProperty('gid')) {
      file.setGid(config.gid);
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


/**
 * Module exports.
 * @type {function}
 */
module.exports = FileSystem;
