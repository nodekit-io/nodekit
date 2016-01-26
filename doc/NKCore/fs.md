![NK-Core](../images/NKCore.png?v01)
# File System

<!--name=fs-->

File I/O is provided by simple wrappers to emulate standard POSIX functions.  To
use this module do `require('fs')`. The methods generally have asynchronous and
synchronous forms, made possible using {NK} Scripting.  In general all Node methods are currently included except symbolic links and dynamic watching.

The asynchronous form always take a completion callback as its last argument.
The arguments passed to the completion callback depend on the method, but the
first argument is always reserved for an exception. If the operation was
completed successfully, then the first argument will be `null` or `undefined`.

When using the synchronous form any exceptions are immediately thrown.
You can use try/catch to handle exceptions or allow them to bubble up.

Here is an example of the asynchronous version:

    var fs = require('fs');

    fs.unlink('/tmp/hello', function (err) {
      if (err) throw err;
      console.log('successfully deleted /tmp/hello');
    });

Here is the synchronous version:

    var fs = require('fs');

    fs.unlinkSync('/tmp/hello');
    console.log('successfully deleted /tmp/hello');

With the asynchronous methods there is no guaranteed ordering. So the
following is prone to error:

    fs.rename('/tmp/hello', '/tmp/world', function (err) {
      if (err) throw err;
      console.log('renamed complete');
    });
    fs.stat('/tmp/world', function (err, stats) {
      if (err) throw err;
      console.log('stats: ' + JSON.stringify(stats));
    });

It could be that `fs.stat` is executed before `fs.rename`.
The correct way to do this is to chain the callbacks.

    fs.rename('/tmp/hello', '/tmp/world', function (err) {
      if (err) throw err;
      fs.stat('/tmp/world', function (err, stats) {
        if (err) throw err;
        console.log('stats: ' + JSON.stringify(stats));
      });
    });

In busy processes, the programmer is _strongly encouraged_ to use the
asynchronous versions of these calls. The synchronous versions will block
the entire process until they complete--halting all connections.

Relative path to filename can be used, remember however that this path will be
relative to `process.cwd()`.

Most fs functions let you omit the callback argument. If you do, a default
callback is used that rethrows errors.

## fs.rename(oldPath, newPath, callback)

Asynchronous rename(2). No arguments other than a possible exception are given
to the completion callback.

## fs.renameSync(oldPath, newPath)

Synchronous rename(2). Returns `undefined`.

## fs.stat(path, callback)

Asynchronous stat(2). The callback gets two arguments `(err, stats)` where
`stats` is a [fs.Stats](#fs_class_fs_stats) object.  See the [fs.Stats](#fs_class_fs_stats)
section below for more information.

## fs.lstat(path, callback)

Asynchronous lstat(2). The callback gets two arguments `(err, stats)` where
`stats` is a `fs.Stats` object. `lstat()` is identical to `stat()`, except that if
`path` is a symbolic link, then the link itself is stat-ed, not the file that it
refers to.

## fs.fstat(fd, callback)

Asynchronous fstat(2). The callback gets two arguments `(err, stats)` where
`stats` is a `fs.Stats` object. `fstat()` is identical to `stat()`, except that
the file to be stat-ed is specified by the file descriptor `fd`.

## fs.statSync(path)

Synchronous stat(2). Returns an instance of `fs.Stats`.

## fs.lstatSync(path)

Synchronous lstat(2). Returns an instance of `fs.Stats`.

## fs.fstatSync(fd)

Synchronous fstat(2). Returns an instance of `fs.Stats`.

## fs.rmdir(path, callback)

Asynchronous rmdir(2). No arguments other than a possible exception are given
to the completion callback.

## fs.rmdirSync(path)

Synchronous rmdir(2). Returns `undefined`.

## fs.mkdir(path[, mode], callback)

Asynchronous mkdir(2). No arguments other than a possible exception are given
to the completion callback. `mode` defaults to `0777`.

## fs.mkdirSync(path[, mode])

Synchronous mkdir(2). Returns `undefined`.

## fs.readdir(path, callback)

Asynchronous readdir(3).  Reads the contents of a directory.
The callback gets two arguments `(err, files)` where `files` is an array of
the names of the files in the directory excluding `'.'` and `'..'`.

## fs.readdirSync(path)

Synchronous readdir(3). Returns an array of filenames excluding `'.'` and
`'..'`.

## fs.close(fd, callback)

Asynchronous close(2).  No arguments other than a possible exception are given
to the completion callback.

## fs.closeSync(fd)

Synchronous close(2). Returns `undefined`.

## fs.open(path, flags[, mode], callback)

Asynchronous file open. See open(2). `flags` can be:

* `'r'` - Open file for reading.
An exception occurs if the file does not exist.

* `'r+'` - Open file for reading and writing.
An exception occurs if the file does not exist.

* `'rs'` - Open file for reading in synchronous mode. Instructs the operating
  system to bypass the local file system cache.

  This is primarily useful for opening files on NFS mounts as it allows you to
  skip the potentially stale local cache. It has a very real impact on I/O
  performance so don't use this flag unless you need it.

  Note that this doesn't turn `fs.open()` into a synchronous blocking call.
  If that's what you want then you should be using `fs.openSync()`

* `'rs+'` - Open file for reading and writing, telling the OS to open it
  synchronously. See notes for `'rs'` about using this with caution.

* `'w'` - Open file for writing.
The file is created (if it does not exist) or truncated (if it exists).

* `'wx'` - Like `'w'` but fails if `path` exists.

* `'w+'` - Open file for reading and writing.
The file is created (if it does not exist) or truncated (if it exists).

* `'wx+'` - Like `'w+'` but fails if `path` exists.

* `'a'` - Open file for appending.
The file is created if it does not exist.

* `'ax'` - Like `'a'` but fails if `path` exists.

* `'a+'` - Open file for reading and appending.
The file is created if it does not exist.

* `'ax+'` - Like `'a+'` but fails if `path` exists.

`mode` sets the file mode (permission and sticky bits), but only if the file was
created. It defaults to `0666`, readable and writeable.

The callback gets two arguments `(err, fd)`.

The exclusive flag `'x'` (`O_EXCL` flag in open(2)) ensures that `path` is newly
created. On POSIX systems, `path` is considered to exist even if it is a symlink
to a non-existent file. The exclusive flag may or may not work with network file
systems.

On Linux, positional writes don't work when the file is opened in append mode.
The kernel ignores the position argument and always appends the data to
the end of the file.

## fs.openSync(path, flags[, mode])

Synchronous version of `fs.open()`. Returns an integer representing the file
descriptor.

## fs.utimes(path, atime, mtime, callback)

Change file timestamps of the file referenced by the supplied path.

## fs.utimesSync(path, atime, mtime)

Synchronous version of `fs.utimes()`. Returns `undefined`.


## fs.futimes(fd, atime, mtime, callback)

Change the file timestamps of a file referenced by the supplied file
descriptor.

## fs.futimesSync(fd, atime, mtime)

Synchronous version of `fs.futimes()`. Returns `undefined`.

## fs.fsync(fd, callback)

Asynchronous fsync(2). No arguments other than a possible exception are given
to the completion callback.

## fs.fsyncSync(fd)

Synchronous fsync(2). Returns `undefined`.

## fs.write(fd, buffer, offset, length[, position], callback)

Write `buffer` to the file specified by `fd`.

`offset` and `length` determine the part of the buffer to be written.

`position` refers to the offset from the beginning of the file where this data
should be written. If `typeof position !== 'number'`, the data will be written
at the current position. See pwrite(2).

The callback will be given three arguments `(err, written, buffer)` where
`written` specifies how many _bytes_ were written from `buffer`.

Note that it is unsafe to use `fs.write` multiple times on the same file
without waiting for the callback. For this scenario,
`fs.createWriteStream` is strongly recommended.

On Linux, positional writes don't work when the file is opened in append mode.
The kernel ignores the position argument and always appends the data to
the end of the file.

## fs.write(fd, data[, position[, encoding]], callback)

Write `data` to the file specified by `fd`.  If `data` is not a Buffer instance
then the value will be coerced to a string.

`position` refers to the offset from the beginning of the file where this data
should be written. If `typeof position !== 'number'` the data will be written at
the current position. See pwrite(2).

`encoding` is the expected string encoding.

The callback will receive the arguments `(err, written, string)` where `written`
specifies how many _bytes_ the passed string required to be written. Note that
bytes written is not the same as string characters. See
[Buffer.byteLength](buffer.html#buffer_class_method_buffer_bytelength_string_encoding).

Unlike when writing `buffer`, the entire string must be written. No substring
may be specified. This is because the byte offset of the resulting data may not
be the same as the string offset.

Note that it is unsafe to use `fs.write` multiple times on the same file
without waiting for the callback. For this scenario,
`fs.createWriteStream` is strongly recommended.

On Linux, positional writes don't work when the file is opened in append mode.
The kernel ignores the position argument and always appends the data to
the end of the file.

## fs.writeSync(fd, buffer, offset, length[, position])

## fs.writeSync(fd, data[, position[, encoding]])

Synchronous versions of `fs.write()`. Returns the number of bytes written.

## fs.read(fd, buffer, offset, length, position, callback)

Read data from the file specified by `fd`.

`buffer` is the buffer that the data will be written to.

`offset` is the offset in the buffer to start writing at.

`length` is an integer specifying the number of bytes to read.

`position` is an integer specifying where to begin reading from in the file.
If `position` is `null`, data will be read from the current file position.

The callback is given the three arguments, `(err, bytesRead, buffer)`.

## fs.readSync(fd, buffer, offset, length, position)

Synchronous version of `fs.read`. Returns the number of `bytesRead`.

## fs.readFile(filename[, options], callback)

* `filename` {String}
* `options` {Object}
  * `encoding` {String | Null} default = `null`
  * `flag` {String} default = `'r'`
* `callback` {Function}

Asynchronously reads the entire contents of a file. Example:

    fs.readFile('/etc/passwd', function (err, data) {
      if (err) throw err;
      console.log(data);
    });

The callback is passed two arguments `(err, data)`, where `data` is the
contents of the file.

If no encoding is specified, then the raw buffer is returned.


## fs.readFileSync(filename[, options])

Synchronous version of `fs.readFile`. Returns the contents of the `filename`.

If the `encoding` option is specified then this function returns a
string. Otherwise it returns a buffer.


## fs.writeFile(filename, data[, options], callback)

* `filename` {String}
* `data` {String | Buffer}
* `options` {Object}
  * `encoding` {String | Null} default = `'utf8'`
  * `mode` {Number} default = `438` (aka `0666` in Octal)
  * `flag` {String} default = `'w'`
* `callback` {Function}

Asynchronously writes data to a file, replacing the file if it already exists.
`data` can be a string or a buffer.

The `encoding` option is ignored if `data` is a buffer. It defaults
to `'utf8'`.

Example:

    fs.writeFile('message.txt', 'Hello {NK} NodeKit', function (err) {
      if (err) throw err;
      console.log('It\'s saved!');
    });

## fs.writeFileSync(filename, data[, options])

The synchronous version of `fs.writeFile`. Returns `undefined`.

## fs.appendFile(filename, data[, options], callback)

* `filename` {String}
* `data` {String | Buffer}
* `options` {Object}
  * `encoding` {String | Null} default = `'utf8'`
  * `mode` {Number} default = `438` (aka `0666` in Octal)
  * `flag` {String} default = `'a'`
* `callback` {Function}

Asynchronously append data to a file, creating the file if it not yet exists.
`data` can be a string or a buffer.

Example:

    fs.appendFile('message.txt', 'data to append', function (err) {
      if (err) throw err;
      console.log('The "data to append" was appended to file!');
    });

## fs.appendFileSync(filename, data[, options])

The synchronous version of `fs.appendFile`. Returns `undefined`.

## fs.exists(path, callback)

Test whether or not the given path exists by checking with the file system.
Then call the `callback` argument with either true or false.  Example:

    fs.exists('/etc/passwd', function (exists) {
      util.debug(exists ? "it's there" : "no passwd!");
    });

`fs.exists()` is an anachronism and exists only for historical reasons.
There should almost never be a reason to use it in your own code.

In particular, checking if a file exists before opening it is an anti-pattern
that leaves you vulnerable to race conditions: another process may remove the
file between the calls to `fs.exists()` and `fs.open()`.  Just open the file
and handle the error when it's not there.

`fs.exists()` will be deprecated.

## fs.existsSync(path)

Synchronous version of `fs.exists()`. Returns `true` if the file exists,
`false` otherwise.

`fs.existsSync()` will be deprecated.

## fs.access(path[, mode], callback)

Tests a user's permissions for the file specified by `path`. `mode` is an
optional integer that specifies the accessibility checks to be performed. The
following constants define the possible values of `mode`. It is possible to
create a mask consisting of the bitwise OR of two or more values.

- `fs.F_OK` - File is visible to the calling process. This is useful for
determining if a file exists, but says nothing about `rwx` permissions.
Default if no `mode` is specified.
- `fs.R_OK` - File can be read by the calling process.
- `fs.W_OK` - File can be written by the calling process.
- `fs.X_OK` - File can be executed by the calling process. This has no effect
on Windows (will behave like `fs.F_OK`).

The final argument, `callback`, is a callback function that is invoked with
a possible error argument. If any of the accessibility checks fail, the error
argument will be populated. The following example checks if the file
`/etc/passwd` can be read and written by the current process.

    fs.access('/etc/passwd', fs.R_OK | fs.W_OK, function(err) {
      util.debug(err ? 'no access!' : 'can read/write');
    });

## fs.accessSync(path[, mode])

Synchronous version of `fs.access`. This throws if any accessibility checks
fail, and does nothing otherwise.

## Class: fs.Stats

Objects returned from `fs.stat()`, `fs.lstat()` and `fs.fstat()` and their
synchronous counterparts are of this type.

 - `stats.isFile()`
 - `stats.isDirectory()`
 - `stats.isBlockDevice()`
 - `stats.isCharacterDevice()`
 - `stats.isSymbolicLink()` (only valid with  `fs.lstat()`)
 - `stats.isFIFO()`
 - `stats.isSocket()`

For a regular file `util.inspect(stats)` would return a string very
similar to this:

    { dev: 2114,
      ino: 48064969,
      mode: 33188,
      nlink: 1,
      uid: 85,
      gid: 100,
      rdev: 0,
      size: 527,
      blksize: 4096,
      blocks: 8,
      atime: Mon, 10 Oct 2011 23:24:11 GMT,
      mtime: Mon, 10 Oct 2011 23:24:11 GMT,
      ctime: Mon, 10 Oct 2011 23:24:11 GMT,
      birthtime: Mon, 10 Oct 2011 23:24:11 GMT }

Please note that `atime`, `mtime`, `birthtime`, and `ctime` are
instances of [Date][MDN-Date] object and to compare the values of
these objects you should use appropriate methods. For most general
uses [getTime()][MDN-Date-getTime] will return the number of
milliseconds elapsed since _1 January 1970 00:00:00 UTC_ and this
integer should be sufficient for any comparison, however there are
additional methods which can be used for displaying fuzzy information.
More details can be found in the [MDN JavaScript Reference][MDN-Date]
page.

[MDN-Date]: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date
[MDN-Date-getTime]: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date/getTime

### Stat Time Values

The times in the stat object have the following semantics:

* `atime` "Access Time" - Time when file data last accessed.  Changed
  by the `mknod(2)`, `utimes(2)`, and `read(2)` system calls.
* `mtime` "Modified Time" - Time when file data last modified.
  Changed by the `mknod(2)`, `utimes(2)`, and `write(2)` system calls.
* `ctime` "Change Time" - Time when file status was last changed
  (inode data modification).  Changed by the `chmod(2)`, `chown(2)`,
  `link(2)`, `mknod(2)`, `rename(2)`, `unlink(2)`, `utimes(2)`,
  `read(2)`, and `write(2)` system calls.
* `birthtime` "Birth Time" -  Time of file creation. Set once when the
  file is created.  On filesystems where birthtime is not available,
  this field may instead hold either the `ctime` or
  `1970-01-01T00:00Z` (ie, unix epoch timestamp `0`).  On Darwin and
  other FreeBSD variants, also set if the `atime` is explicitly set to
  an earlier value than the current `birthtime` using the `utimes(2)`
  system call.

Prior to Node v0.12, the `ctime` held the `birthtime` on Windows
systems.  Note that as of v0.12, `ctime` is not "creation time", and
on Unix systems, it never was.

## fs.createReadStream(path[, options])

Returns a new ReadStream object (See `Readable Stream`).

Be aware that, unlike the default value set for `highWaterMark` on a
readable stream (16kB), the stream returned by this method has a
default value of 64kB for the same parameter.

`options` is an object with the following defaults:

    { flags: 'r',
      encoding: null,
      fd: null,
      mode: 0666,
      autoClose: true
    }

`options` can include `start` and `end` values to read a range of bytes from
the file instead of the entire file.  Both `start` and `end` are inclusive and
start at 0. The `encoding` can be `'utf8'`, `'ascii'`, or `'base64'`.

If `fd` is specified, `ReadStream` will ignore the `path` argument and will use
the specified file descriptor. This means that no `open` event will be emitted.

If `autoClose` is false, then the file descriptor won't be closed, even if
there's an error.  It is your responsibility to close it and make sure
there's no file descriptor leak.  If `autoClose` is set to true (default
behavior), on `error` or `end` the file descriptor will be closed
automatically.

`mode` sets the file mode (permission and sticky bits), but only if the
file was created.

An example to read the last 10 bytes of a file which is 100 bytes long:

    fs.createReadStream('sample.txt', {start: 90, end: 99});


## Class: fs.ReadStream

`ReadStream` is a [Readable Stream](stream.html#stream_class_stream_readable).

### Event: 'open'

* `fd` {Integer} file descriptor used by the ReadStream.

Emitted when the ReadStream's file is opened.


## fs.createWriteStream(path[, options])

Returns a new WriteStream object (See `Writable Stream`).

`options` is an object with the following defaults:

    { flags: 'w',
      defaultEncoding: 'utf8',
      fd: null,
      mode: 0666 }

`options` may also include a `start` option to allow writing data at
some position past the beginning of the file.  Modifying a file rather
than replacing it may require a `flags` mode of `r+` rather than the
default mode `w`.

Like `ReadStream` above, if `fd` is specified, `WriteStream` will ignore the
`path` argument and will use the specified file descriptor. This means that no
`open` event will be emitted.


## Class: fs.WriteStream

`WriteStream` is a [Writable Stream](stream.html#stream_class_stream_writable).

### Event: 'open'

* `fd` {Integer} file descriptor used by the WriteStream.

Emitted when the WriteStream's file is opened.

### file.bytesWritten

The number of bytes written so far. Does not include data that is still queued
for writing.

