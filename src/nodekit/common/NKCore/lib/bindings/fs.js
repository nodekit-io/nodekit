/*
 * Copyright (c) 2016 OffGrid Networks;  
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

var Fsystem;

switch(process.platform) {
    case 'darwin':
    case 'ios':
        Fsystem = require('./_delegates/filesystem/_darwin_filesystem.js');
        break;
    case 'win32':
        Fsystem = require('./_delegates/filesystem/_winrt_filesystem.js');
        break;
     default:
        Fsystem = require('./_delegates/filesystem/_browser_filesystem.js');
        break;
}

var fsystem = new Fsystem();
var Binding = require('./_delegates/filesystem/binding');
var fs_delegate = new Binding(fsystem);

var statsCtor;

module.exports.FSReqWrap = function FSReqWrap() {
}

module.exports.FSInitialize = function (stats) {
  // fs.js uses this in "native" node.js to inform the C++ in
  // node_file.cc what JS function is used to construct an fs.Stat
  // object.  We construct ours in JS so largely don't need this.
  statsCtor = stats;
};

/**
 * Not yet implemented.
 * @type {function()}
 */
module.exports.StatWatcher = fs_delegate.StatWatcher;

/**
 * Stat an item.
 * @param {string} filepath Path.
 * @param {function(Error, Stats)} callback Callback (optional).
 * @return {Stats|undefined} Stats or undefined (if sync).
 */
module.exports.stat = function (path, callback) {
   
    if (callback)
        process.nextTick(function(){
                         try {
        callback.oncomplete.call(callback, null, fs_delegate.stat(path));
                         } catch (e) { callback.oncomplete.call(callback, e); }
                         });
    
    else
    
    return fs_delegate.stat(path);
};


/**
 * Stat an item.
 * @param {string} filepath Path.
 * @param {function(Error, Stats)} callback Callback (optional).
 * @return -1 if not exists, 0 if file, 1 if directory
 */
module.exports.internalModuleStat = function (path, callback) {
    
    if (callback)
        process.nextTick(function(){
                         try {
                         callback.call(callback, null, fs_delegate.internalModuleStat(path));
                         } catch (e) { callback.oncomplete.call(callback, e); }
                         });
    
    else
        
        return fs_delegate.internalModuleStat(path);
};



/**
 * Stat an item.
 * @param {string} filepath Path.
 * @param {function(Error, Stats)} callback Callback (optional).
 * @return {Stats|undefined} Stats or undefined (if sync).
 */
module.exports.lstat = function (path, callback) {
    if (callback)
     return fs_delegate.lstat(path, callback.oncomplete.bind(callback));
    else
        return fs_delegate.lstat(path);

};

/**
 * Stat an item.
 * @param {number} fd File descriptor.
 * @param {function(Error, Stats)} callback Callback (optional).
 * @return {Stats|undefined} Stats or undefined (if sync).
 */
module.exports.fstat = function (fd, callback) {
    if (callback)
        return fs_delegate.fstat(fd, callback.oncomplete.bind(callback));
    else
         return fs_delegate.fstat(fd);
};

/**
 * Open and possibly create a file.
 * @param {string} pathname File path.
 * @param {number} flags Flags.
 * @param {number} mode Mode.
 * @param {function(Error, string)} callback Callback (optional).
 * @return {string} File descriptor (if sync).
 */
module.exports.open = function (path, flags, mode, callback) {
 
    if (callback)
    {
        process.nextTick(function(){
                         var fileItem =fs_delegate.open(path, flags, mode);
             callback.oncomplete.call(callback, null, fileItem);
                         });
    }
    else
     return fs_delegate.open(path, flags, mode);
};

/**
 * Close a file descriptor.
 * @param {number} fd File descriptor.
 * @param {function(Error)} callback Callback (optional).
 */
module.exports.close = function (fd, callback) {
    if (callback)
    {
        process.nextTick(function(){
                         fs_delegate.close(fd)
                         callback.oncomplete.call(callback, null,  fs_delegate.close(fd) );

                         });
    }
    else
      fs_delegate.close(fd)
};

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
module.exports.writeBuffer = function (fd, buffer, offset, length, position, callback) {
    if (callback)
       return fs_delegate.writeBuffer(fd, buffer, offset, length, position, callback.oncomplete)
    else
            return fs_delegate.writeBuffer(fd, buffer, offset, length, position)

};

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
module.exports.writeString = function (fd, str, position, enc, callback) {
    if (callback)
       return fs_delegate.writeString(fd, str, position, enc, callback.oncomplete)
    else
        return fs_delegate.writeString(fd, str, position, enc)
        
};

/**
 * Create a directory.
 * @param {string} pathname Path to new directory.
 * @param {number} mode Permissions.
 * @param {function(Error)} callback Optional callback.
 */
module.exports.mkdir = function (path, mode, callback) {
    if (callback)
       fs_delegate.mkdir(path, mode, callback.oncomplete)
     else
       fs_delegate.mkdir(path, mode, callback)
            
};

/**
 * Remove a directory.
 * @param {string} pathname Path to directory.
 * @param {function(Error)} callback Optional callback.
 */
module.exports.rmdir = function (path, callback) {
    if (callback)
        fs_delegate.rmdir(path, callback.oncomplete)
        else
            fs_delegate.rmdir(path)

};

/**
 * Rename a file.
 * @param {string} oldPath Old pathname.
 * @param {string} newPath New pathname.
 * @param {function(Error)} callback Callback (optional).
 * @return {undefined}
 */
module.exports.rename = function (from, to, callback) {
    if (callback)
 return fs_delegate.rename(from, to, callback.oncomplete)
        else
            return fs_delegate.rename(from, to);
};

/**
 * Truncate a file.
 * @param {number} fd File descriptor.
 * @param {number} len Number of bytes.
 * @param {function(Error)} callback Optional callback.
 */
module.exports.ftruncate = function (fd, len, callback) {
    if (callback)
  fs_delegate.ftruncate(fd, len, callback.oncomplete)
        else
            fs_delegate.ftruncate(fd, len);
};

/**
 * Read a directory.
 * @param {string} dirpath Path to directory.
 * @param {function(Error, Array.<string>)} callback Callback (optional) called
 *     with any error or array of items in the directory.
 * @return {Array.<string>} Array of items in directory (if sync).
 */
module.exports.readdir = function (path, callback) {
    if (callback)
        return fs_delegate.readdir(path, callback.oncomplete);
    else
        return fs_delegate.readdir(path);
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
module.exports.read = function (fd, buffer, offset, length, position, callback) {
    if (callback)
    {
        process.nextTick(function(){
                         
        callback.oncomplete.call(callback, null, fs_delegate.read(fd, buffer, offset, length, position));
                         });
    }
    else
      return fs_delegate.read(fd, buffer, offset, length, position);
};

/**
 * Create a hard link.
 * @param {string} srcPath The existing file.
 * @param {string} destPath The new link to create.
 * @param {function(Error)} callback Optional callback.
 */
module.exports.link = function (srcpath, dstpath, callback) {
    if (callback)
       fs_delegate.link(srcpath, dstpath, callback.oncomplete)
    else
        return  fs_delegate.link(srcpath, dstpath);
};

/**
 * Create a symbolic link.
 * @param {string} srcPath Path from link to the source file.
 * @param {string} destPath Path for the generated link.
 * @param {string} type Ignored (used for Windows only).
 * @param {function(Error)} callback Optional callback.
 */
module.exports.symlink = function (srcpath, dstpath, type, callback) {
    if (callback)
        fs_delegate.symlink(srcpath, dstpath, type, callback.oncomplete)
     else
        fs_delegate.symlink(srcpath, dstpath, type)

};

/**
 * Read the contents of a symbolic link.
 * @param {string} pathname Path to symbolic link.
 * @param {function(Error, string)} callback Optional callback.
 * @return {string} Symbolic link contents (path to source).
 */
module.exports.readlink = function (path, callback) {
    if (callback)
        return fs_delegate.readlink(path, callback.oncomplete)
        else
            return fs_delegate.readlink(path)
            
};

/**
 * Delete a named item.
 * @param {string} pathname Path to item.
 * @param {function(Error)} callback Optional callback.
 */
module.exports.unlink = function (path, callback) {
    if (callback)
        fs_delegate.unlink(path, callback.oncomplete)
        else
            fs_delegate.unlink(path)
            
};

/**
 * Change permissions.
 * @param {string} pathname Path.
 * @param {number} mode Mode.
 * @param {function(Error)} callback Optional callback.
 */
module.exports.chmod = function (path, mode, callback) {
    if (callback)
        fs_delegate.chmod(path, mode, callback.oncomplete)
        else
            fs_delegate.chmod(path, mode)
            };

/**
 * Change permissions.
 * @param {number} fd File descriptor.
 * @param {number} mode Mode.
 * @param {function(Error)} callback Optional callback.
 */
module.exports.fchmod = function (fd, mode, callback) {
    if (callback)
        fs_delegate.fchmod(fd, mode, callback.oncomplete)
        else
            fs_delegate.fchmod(fd, mode)
            };

/**
 * Change user and group owner.
 * @param {string} pathname Path.
 * @param {number} uid User id.
 * @param {number} gid Group id.
 * @param {function(Error)} callback Optional callback.
 */
module.exports.chown = function (path, uid, gid, callback) {
    if (callback)
        fs_delegate.chown(path, uid, gid, callback.oncomplete)
        else
            fs_delegate.chown(path, uid, gid)
            };

/**
 * Change user and group owner.
 * @param {number} fd File descriptor.
 * @param {number} uid User id.
 * @param {number} gid Group id.
 * @param {function(Error)} callback Optional callback.
 */
module.exports.fchown = function (fd, uid, gid, callback) {
    if (callback)
        fs_delegate.fchown(fd, uid, gid, callback.oncomplete)
        else
            fs_delegate.fchown(fd, uid, gid)
            };

/**
 * Update timestamps.
 * @param {string} pathname Path to item.
 * @param {number} atime Access time (in seconds).
 * @param {number} mtime Modification time (in seconds).
 * @param {function(Error)} callback Optional callback.
 */
module.exports.utimes = function (path, atime, mtime, callback) {
    if (callback)
        fs_delegate.utimes(path, atime, mtime, callback.oncomplete)
        else
            fs_delegate.utimes(path, atime, mtime)
            };

/**
 * Update timestamps.
 * @param {number} fd File descriptor.
 * @param {number} atime Access time (in seconds).
 * @param {number} mtime Modification time (in seconds).
 * @param {function(Error)} callback Optional callback.
 */
module.exports.futimes = function (fd, atime, mtime, callback) {
    if (callback)
        fs_delegate.futimes(fd, atime, mtime, callback.oncomplete)
        else
            fs_delegate.futimes(fd, atime, mtime)
            };

/**
 * Synchronize in-core state with storage device.
 * @param {number} fd File descriptor.
 * @param {function(Error)} callback Optional callback.
 */
module.exports.fsync = function (fd) {
    return fs_delegate.fsync(fd)
};

/**
 * Synchronize in-core metadata state with storage device.
 * @param {number} fd File descriptor.
 * @param {function(Error)} callback Optional callback.
 */
module.exports.fdatasync = function (fd) {
     fs_delegate.fdatasync(fd)
};

// Used to speed up module loading.  Returns the contents of the file as
// a string or undefined when the file cannot be opened.  The speedup
// comes from not creating Error objects on failure.
module.exports.internalModuleReadFile = function (path) {
    return fs_delegate.internalModuleReadFile(path);
};
