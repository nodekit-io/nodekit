/*
 * Copyright (c) 2016 OffGrid Networks; Portions Copyright 2014 Tim Schaub
 *
 * Licensed under the the MIT license (the "License");
 * you may not use this file except in compliance with the License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy 
 * of this software and associated documentation files (the ìSoftwareî), to deal 
 * in the Software without restriction, including without limitation the rights 
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
 * copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in 
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED ìAS ISî, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL 
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR 
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR 
 * OTHER DEALINGS IN THE SOFTWARE.
 */

var File = require('./file');
var FileDescriptor = require('./descriptor');
var Directory = require('./directory');
var SymbolicLink = require('./symlink');
var FSError = require('./error');
var Buffer = require('buffer').Buffer;
var path = require('path');
var util =require('util');
var constants = process.binding('constants');


/**
 * Call the provided function and either return the result or call the callback
 * with it (depending on if a callback is provided).
 * @param {function()} callback Optional callback.
 * @param {Object} thisArg This argument for the following function.
 * @param {function()} func Function to call.
 * @return {*} Return (if callback is not provided).
 */
function maybeCallback(callback, thisArg, func) {
  if (callback) {
    var err = null;
    var val;
    try {
      val = func.call(thisArg);
    } catch (e) {
      err = e;
     }
    process.nextTick(function() {
       if (val === undefined) {
        callback(err);
      } else {
        callback(err, val);
      }
    });
  } else {
    return func.call(thisArg);
  }
}

function notImplemented() {
  throw new Error('Method not implemented');
}

/**
 * Create a new stats object.
 * @param {Object} config Stats properties.
 * @constructor
 */
function Stats(config) {
  for (var key in config) {
    this[key] = config[key];
  }
}

/**
 * Check if mode indicates property.
 * @param {number} property Property to check.
 * @return {boolean} Property matches mode.
 */
Stats.prototype._checkModeProperty = function(property) {
  return ((this.mode & constants.S_IFMT) === property);
};


/**
 * @return {Boolean} Is a directory.
 */
Stats.prototype.isDirectory = function() {
  return this._checkModeProperty(constants.S_IFDIR);
};


/**
 * @return {Boolean} Is a regular file.
 */
Stats.prototype.isFile = function() {
   return this._checkModeProperty(constants.S_IFREG);
};


/**
 * @return {Boolean} Is a block device.
 */
Stats.prototype.isBlockDevice = function() {
  return this._checkModeProperty(constants.S_IFBLK);
};


/**
 * @return {Boolean} Is a character device.
 */
Stats.prototype.isCharacterDevice = function() {
  return this._checkModeProperty(constants.S_IFCHR);
};


/**
 * @return {Boolean} Is a symbolic link.
 */
Stats.prototype.isSymbolicLink = function() {
  return this._checkModeProperty(constants.S_IFLNK);
};


/**
 * @return {Boolean} Is a named pipe.
 */
Stats.prototype.isFIFO = function() {
  return this._checkModeProperty(constants.S_IFIFO);
};


/**
 * @return {Boolean} Is a socket.
 */
Stats.prototype.isSocket = function() {
  return this._checkModeProperty(constants.S_IFSOCK);
};



/**
 * Create a new binding with the given file system.
 * @param {FileSystem} system Mock file system.
 * @constructor
 */
function Binding(system) {

  /**
   * Mock file system.
   * @type {FileSystem}
   */
  this._system = system;

  /**
   * Stats constructor.
   * @type {function}
   */
  this.Stats = Stats;

  /**
   * Lookup of open files.
   * @type {Object.<number, FileDescriptor>}
   */
  this._openFiles = {};

  /**
   * Counter for file descriptors.
   * @type {number}
   */
  this._counter = 0;

}

/**
 * Get the file system underlying this binding.
 * @return {FileSystem} The underlying file system.
 */
Binding.prototype.getSystem = function() {
  return this._system;
};


/**
 * Reset the file system underlying this binding.
 * @param {FileSystem} system The new file system.
 */
Binding.prototype.setSystem = function(system) {
  this._system = system;
};


/**
 * Get a file descriptor.
 * @param {number} fd File descriptor identifier.
 * @return {FileDescriptor} File descriptor.
 */
Binding.prototype._getDescriptorById = function(fd) {
  if (!this._openFiles.hasOwnProperty(fd)) {
    throw new FSError('EBADF');
  }
  return this._openFiles[fd];
};


/**
 * Keep track of a file descriptor as open.
 * @param {FileDescriptor} descriptor The file descriptor.
 * @return {number} Identifier for file descriptor.
 */
Binding.prototype._trackDescriptor = function(descriptor) {
   var fd = ++this._counter;
  this._openFiles[fd] = descriptor;
   return fd;
};


/**
 * Stop tracking a file descriptor as open.
 * @param {number} fd Identifier for file descriptor.
 */
Binding.prototype._untrackDescriptorById = function(fd) {
  if (!this._openFiles.hasOwnProperty(fd)) {
    //  throw new FSError('EBADF');
  }
  delete this._openFiles[fd];
};

/**
 * Stat an item.
 * @param {string} filepath Path.
 * @param {function(Error, Stats)} callback Callback (optional).
 * @return {Stats|undefined} Stats or undefined (if sync).
 */
Binding.prototype.stat = function (filepath, callback) {
    if (callback) {
        this._system.getItemAsync(filepath)
        .then(
              function(item)
              {
              if (!item)
              callback(new FSError('ENOENT', filepath));
              
              var stats = new Stats(item.getStats());
              callback(null,  stats );
              
              }
              , function(err)
              {
              calback(err);
              });
    } else {
        var item = this._system.getItemSync(filepath);
        if (!item) throw new FSError('ENOENT', filepath);
        return new Stats(item.getStats());
    }
};


/**
 * Stat an item.
 * @param {string} filepath Path.
 * @param {function(Error, Stats)} callback Callback (optional).
 * @return {Stats|undefined} Stats or undefined (if sync).
 */
Binding.prototype.internalModuleStat = function (filepath, callback) {
    if (callback) {
        this._system.getItemAsync(filepath)
        .then(
              function(item)
              {
              if (!item)
                callback(-1);
              
              if (item.getSize)
               callback(0)
              else
                callback (1)
              
              });
    } else {
        var item = this._system.getItemSync(filepath);
        if (!item) return -1
         
            if (item.getSize)
                return 0
                else
                    return 1;
      }
};

/**
 * Stat an item.
 * @param {string} filepath Path.
 * @param {function(Error, Stats)} callback Callback (optional).
 * @return {Stats|undefined} Stats or undefined (if sync).
 */
Binding.prototype.lstat = Binding.prototype.stat;

/**
 * Stat an item.
 * @param {number} fd File descriptor.
 * @param {function(Error, Stats)} callback Callback (optional).
 * @return {Stats|undefined} Stats or undefined (if sync).
 */
Binding.prototype.fstat = function (fd, callback) {
    var descriptor = this._getDescriptorById(fd);
    var item = descriptor.getItem();
    var ret = new Stats(item.getStats());
   
    if (callback)
        callback(null, ret);
    else
        return ret;
};

/**
 * Open and possibly create a file.
 * @param {string} filepath File path.
 * @param {number} flags Flags.
 * @param {number} mode Mode.
 * @param {function(Error, string)} callback Callback (optional).
 * @return {string} File descriptor (if sync).
 */
Binding.prototype.open = function (filepath, flags, mode, callback) {
    
    var descriptor = new FileDescriptor(flags);
    var self=this;
    
    if (callback)
    {
        this._system.getItemAsync(filepath)
        .then(function(item){
              if (item)
              {
              self._system.loadContentSync(item);
              }
              
              callback(null, processOpen.call(self, descriptor, item, filepath, flags, mode));
             
              }, function(err)
              {
                callback(null, processOpen.call(self, descriptor, null, filepath, flags, mode));
              }
              );
    } else
    {
        var item = this._system.getItemSync(filepath);
        
        if (item)
             this._system.loadContentSync(item);

        return processOpen.call(this, descriptor, item, filepath, flags, mode);
    }
}


var processOpen = function processOpen(descriptor, item, filepath, flags, mode)
{
    if (descriptor.isExclusive() && item) {
        throw new FSError('EEXIST', pathname);
    }
    
    if (descriptor.isCreate() && !item) {
        var parent = this._system.getItemSync(path.dirname(filepath));
        if (!parent) {
            throw new FSError('ENOENT', filepath);
        }
        if (!(parent instanceof Directory)) {
            throw new FSError('ENOTDIR', filepath);
        }
        item = new File();
        item.setPath(filepath);
        this._system.addStorageItem(item);
        
        if (mode) {
            item.setMode(mode);
        }
        parent.addItem(path.basename(filepath), item);
    }
    
    if (descriptor.isRead()) {
        if (!item) {
            throw new FSError('ENOENT', filepath);
        }
        if (!item.canRead()) {
            throw new FSError('EACCES', filepath);
        }
    }
    
    if (descriptor.isWrite() && !item.canWrite()) {
        throw new FSError('EACCES', filepath);
    }
    
    if (descriptor.isTruncate()) {
        item.setContent('');
    }
    
    if (descriptor.isTruncate() || descriptor.isAppend()) {
        descriptor.setPosition(item.getContent().length);
    }
    
    descriptor.setItem(item);
    return this._trackDescriptor(descriptor);
}



/**
 * Close a file descriptor.
 * @param {number} fd File descriptor.
 * @param {function(Error)} callback Callback (optional).
 */
Binding.prototype.close = function(fd, callback) {
    return maybeCallback(callback, this, function() {
    this._untrackDescriptorById(fd);
  });
};

/**
 * Read from a file descriptor.
 * @param {string} fd File descriptor.
 * @param {Buffer} buffer Buffer that the contents will be written to.
 * @param {number} offset Offset in the buffer to start writing to.
 * @param {number} length Number of bytes to read.
 * @param {?number} position Where to begin reading in the file.  If null,
 *     data will be read from the current file position.
 * @param {function(Error, number, Buffer)} callback Callback (optional) called
 *     with any error, number of bytes read, and the buffer.
 * @return {number} Number of bytes read
 */
Binding.prototype.read = function(fd, buffer, offset, length, position, callback) {
       if (callback)
    {
        
        var descriptor = this._getDescriptorById(fd);
        
        if (!descriptor.isRead()) {
            
            throw new FSError('EBADF');
        }
        
        var file = descriptor.getItem();
        
        if (!(file instanceof File)) {
            // deleted or not a regular file
            throw new FSError('EBADF');
        }
        
        if (!(file.getIsLoaded()))
            this._system.loadContentSync(file);
        
        if (typeof position !== 'number' || position < 0) {
            position = descriptor.getPosition();
        }
        var content = file.getContent();
        
        var start = Math.min(position, content.length);
        
        var end = Math.min(position + length, content.length);
        
        content.copy(buffer, offset, start, end);
        
        var read = (start < end) ? content.copy(buffer, offset, start, end) : 0;
        if (read === undefined)
            read = end-start;
        
        descriptor.setPosition(position + read);
        
        callback(null, read);
        
    }
    else
    {
        
        var descriptor = this._getDescriptorById(fd);
        
        if (!descriptor.isRead()) {
            throw new FSError('EBADF');
        }
        
        var file = descriptor.getItem();
        
        
        if (!(file instanceof File)) {
            // deleted or not a regular file
            throw new FSError('EBADF');
        }
        
        if (!(file.getIsLoaded()))
            this._system.loadContentSync(file);
        
        if (typeof position !== 'number' || position < 0) {
            position = descriptor.getPosition();
        }
        var content = file.getContent();
        
        var start = Math.min(position, content.length);
        
        var end = Math.min(position + length, content.length);
        
        content.copy(buffer, offset, start, end);
        
        var read = (start < end) ? content.copy(buffer, offset, start, end) : 0;
        if (read === undefined)
            read = end-start;
        
        descriptor.setPosition(position + read);
        
        return read;
    }
};

/**
 * Read a directory.
 * @param {string} dirpath Path to directory.
 * @param {function(Error, Array.<string>)} callback Callback (optional) called
 *     with any error or array of items in the directory.
 * @return {Array.<string>} Array of items in directory (if sync).
 */
Binding.prototype.readdir = function (dirpath, callback) {
   return maybeCallback(callback, this, function() {
                  return this._system.getDirList(dirpath);
                  });

};


// ************************************************************************
/**
 * Write to a file descriptor given a buffer.
 * @param {string} fd File descriptor.
 * @param {Buffer} buffer Buffer with contents to write.
 * @param {number} offset Offset in the buffer to start writing from.
 * @param {number} length Number of bytes to write.
 * @param {?number} position Where to begin writing in the file.  If null,
 *     data will be written to the current file position.
 * @param {function(Error, number, Buffer)} callback Callback (optional) called
 *     with any error, number of bytes written, and the buffer.
 * @return {number} Number of bytes written (if sync).
 */
Binding.prototype.writeBuffer = function(fd, buffer, offset, length, position,
                                         callback) {
    
    if (callback) {
        
        var descriptor = this._getDescriptorById(fd);
        
        if (!descriptor.isWrite()) {
            throw new FSError('EBADF');
        }
        
        var file = descriptor.getItem();
        
        
        if (!(file instanceof File)) {
            // not a regular file
            throw new FSError('EBADF');
        }
        
        if (typeof position !== 'number' || position < 0) {
            position = descriptor.getPosition();
        }
        
        
        if (!(file.getIsLoaded()))
            this._system.loadContentSync(file);
        
        var content = file.getContent();
        var newLength = position + length;
        if (content.length < newLength) {
            var newContent = new Buffer(newLength);
            content.copy(newContent);
            content = newContent;
        }
        var sourceEnd = Math.min(offset + length, buffer.length);
        
        buffer.copy(content, position, offset, sourceEnd);
        var written = sourceEnd - offset;
        console.log(file.setContent);
        file.setContent(content);
        
        this._system.writeContentAsync(file)
        .then(
              function(item) {
              
              if (!item)
                 callback( new FSError('ENOENT', filepath));
              
              descriptor.setPosition(newLength);
              callback(null,  written );
              },
              function (e) {
              callback(e);
              });
    } else
    {
        
        
        var descriptor = this._getDescriptorById(fd);
        
        if (!descriptor.isWrite()) {
            throw new FSError('EBADF');
        }
        
        var file = descriptor.getItem();
        if (!(file instanceof File)) {
            // not a regular file
            throw new FSError('EBADF');
        }
        
        if (typeof position !== 'number' || position < 0) {
            position = descriptor.getPosition();
        }
        
        if (!(file.getIsLoaded()))
            this._system.loadContentSync(file);
        
        var content = file.getContent();
        var newLength = position + length;
        if (content.length < newLength) {
            var newContent = new Buffer(newLength);
            content.copy(newContent);
            content = newContent;
        }
        var sourceEnd = Math.min(offset + length, buffer.length);
        
        buffer.copy(content, position, offset, sourceEnd);
        var written = sourceEnd - offset;
        file.setContent(content);
        
        var item = this._system.writeContentSync(file);
        
        if (!item) throw new FSError('ENOENT', filepath);
        
        descriptor.setPosition(newLength);
        return written;
        
        
    }
};

/**
 * Alias for writeBuffer (used in Node <= 0.10).
 * @param {string} fd File descriptor.
 * @param {Buffer} buffer Buffer with contents to write.
 * @param {number} offset Offset in the buffer to start writing from.
 * @param {number} length Number of bytes to write.
 * @param {?number} position Where to begin writing in the file.  If null,
 *     data will be written to the current file position.
 * @param {function(Error, number, Buffer)} callback Callback (optional) called
 *     with any error, number of bytes written, and the buffer.
 * @return {number} Number of bytes written (if sync).
 */
Binding.prototype.write = Binding.prototype.writeBuffer;


/**
 * Write to a file descriptor given a string.
 * @param {string} fd File descriptor.
 * @param {string} string String with contents to write.
 * @param {number} position Where to begin writing in the file.  If null,
 *     data will be written to the current file position.
 * @param {string} encoding String encoding.
 * @param {function(Error, number, string)} callback Callback (optional) called
 *     with any error, number of bytes written, and the string.
 * @return {number} Number of bytes written (if sync).
 */
Binding.prototype.writeString = function(fd, string, position, encoding,
                                         callback) {
    var buf = new Buffer(string, encoding);
    return this.writeBuffer(fd, buf, 0, buf.length, position, callback);
};


/**
 * Rename a file.
 * @param {string} oldPath Old pathname.
 * @param {string} newPath New pathname.
 * @param {function(Error)} callback Callback (optional).
 * @return {undefined}
 */
Binding.prototype.rename = function(oldPath, newPath, callback) {
    return maybeCallback(callback, this, function () {
                         
                         var result =  this._system.move(oldPath, newPath);
                         
                         if (result)
                           return result
                         else
                           throw new FSError('ENOENT', oldPath);
    });
};


/**
 * Create a directory.
 * @param {string} pathname Path to new directory.
 * @param {number} mode Permissions.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.mkdir = function(pathname, mode, callback) {
     maybeCallback(callback, this, function () {
         return this._system.mkdir(pathname);
    });
};


/**
 * Remove a directory.
 * @param {string} pathname Path to directory.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.rmdir = function(pathname, callback) {
     maybeCallback(callback, this, function () {
         return this._system.rmdir(pathname);
    });
};

/**
 * Truncate a file.
 * @param {number} fd File descriptor.
 * @param {number} len Number of bytes.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.ftruncate = function(fd, len, callback) {
     maybeCallback(callback, this, function () {
        return notImplemented();
    });
};


/**
 * Legacy support.
 * @param {number} fd File descriptor.
 * @param {number} len Number of bytes.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.truncate = Binding.prototype.ftruncate;


/**
 * Change user and group owner.
 * @param {string} pathname Path.
 * @param {number} uid User id.
 * @param {number} gid Group id.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.chown = function(pathname, uid, gid, callback) {
    return maybeCallback(callback, this, function () {
        return notImplemented();
    });
};


/**
 * Change user and group owner.
 * @param {number} fd File descriptor.
 * @param {number} uid User id.
 * @param {number} gid Group id.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.fchown = function(fd, uid, gid, callback) {
    return maybeCallback(callback, this, function () {
        return notImplemented();
    });
};


/**
 * Change permissions.
 * @param {string} pathname Path.
 * @param {number} mode Mode.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.chmod = function(pathname, mode, callback) {
     maybeCallback(callback, this, function () {
        return notImplemented();
    });
};


/**
 * Change permissions.
 * @param {number} fd File descriptor.
 * @param {number} mode Mode.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.fchmod = function(fd, mode, callback) {
     maybeCallback(callback, this, function () {
        return notImplemented();
    });
};


/**
 * Delete a named item.
 * @param {string} pathname Path to item.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.unlink = function(pathname, callback) {
     maybeCallback(callback, this, function () {
          return this._system.unlink(pathname);
    });
};


/**
 * Update timestamps.
 * @param {string} pathname Path to item.
 * @param {number} atime Access time (in seconds).
 * @param {number} mtime Modification time (in seconds).
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.utimes = function(pathname, atime, mtime, callback) {
    return maybeCallback(callback, this, function () {
        return notImplemented();
    });
};


/**
 * Update timestamps.
 * @param {number} fd File descriptor.
 * @param {number} atime Access time (in seconds).
 * @param {number} mtime Modification time (in seconds).
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.futimes = function(fd, atime, mtime, callback) {
     maybeCallback(callback, this, function () {
        return notImplemented();
    });
};


/**
 * Synchronize in-core state with storage device.
 * @param {number} fd File descriptor.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.fsync = function(fd, callback) {
     maybeCallback(callback, this, function () {
        //ignore
    });
};


/**
 * Synchronize in-core metadata state with storage device.
 * @param {number} fd File descriptor.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.fdatasync = function(fd, callback) {
    maybeCallback(callback, this, function () {
        //ignore
    });
};


/**
 * Create a hard link.
 * @param {string} srcPath The existing file.
 * @param {string} destPath The new link to create.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.link = function(srcPath, destPath, callback) {
    maybeCallback(callback, this, function () {
        return notImplemented();
    });
};


/**
 * Create a symbolic link.
 * @param {string} srcPath Path from link to the source file.
 * @param {string} destPath Path for the generated link.
 * @param {string} type Ignored (used for Windows only).
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.symlink = function(srcPath, destPath, type, callback) {
    maybeCallback(callback, this, function () {
        return notImplemented();
    });
};


/**
 * Read the contents of a symbolic link.
 * @param {string} pathname Path to symbolic link.
 * @param {function(Error, string)} callback Optional callback.
 * @return {string} Symbolic link contents (path to source).
 */
Binding.prototype.readlink = function(pathname, callback) {
    maybeCallback(callback, this, function () {
        return notImplemented();
    });
};


var notImplemented = function() {
    console.log("NOT IMPLEMENTED");
   }

/**
 * Not yet implemented.
 * @type {function()}
 */
Binding.prototype.StatWatcher = notImplemented;


/**
 * Export the binding constructor.
 * @type {function()}
 */
exports = module.exports = Binding;
