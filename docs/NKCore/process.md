![NK-Core](../images/NKCore.png?v01)
# process

<!-- type=global -->

The `process` object is a global object and can be accessed from anywhere.

## process.argv

An array containing the simulated command line arguments for compatibility with Node.  The first element will be
'node', the second element will be the name of the JavaScript file.  The
next elements will be any additional command line arguments.

    // print process.argv
    process.argv.forEach(function(val, index, array) {
      console.log(index + ': ' + val);
    });

This will generate:

    $ node process-2.js one two=three four
    0: node
    1: /Users/mjr/work/node/process-2.js
    2: one
    3: two=three
    4: four


## process.execPath

This is the absolute pathname of the executable/bundle.

Example:

    /usr/local/bin/node


## process.execArgv

This is the set of node-specific command line options from the
executable that started the process.  These options do not show up in
`process.argv`, and do not include the node executable, the name of
the script, or any options following the script name. These options
are useful in order to spawn child processes with the same execution
environment as the parent.

Example:

    $ node --harmony script.js --version

results in process.execArgv:

    ['--harmony']

and process.argv:

    ['/usr/local/bin/node', 'script.js', '--version']


## process.cwd()

Returns the current working directory of the process.

    console.log('Current directory: ' + process.cwd());


## process.env

An object containing the user environment. See environ(7).

An example of this object looks like:

    { TERM: 'xterm-256color',
      SHELL: '/usr/local/bin/bash',
      USER: 'maciej',
      PATH: '~/.bin/:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin',
      PWD: '/Users/maciej',
      EDITOR: 'vim',
      SHLVL: '1',
      HOME: '/Users/maciej',
      LOGNAME: 'maciej',
      _: '/usr/local/bin/node' }

You can write to this object, but changes won't be reflected outside of your
process. That means that the following won't work:

    node -e 'process.env.foo = "bar"' && echo $foo

But this will:

    process.env.foo = 'bar';
    console.log(process.env.foo);



Note: this function is only available on POSIX platforms (i.e. not Windows,
Android)

Sets the supplementary group IDs. This is a privileged operation, meaning you
need to be root or have the CAP_SETGID capability.

The list can contain group IDs, group names or both.

## process.version

A compiled-in property.

    console.log('Version: ' + process.version);

## process.versions

A property exposing version strings of node and its dependencies.

    console.log(process.versions);

Will print something like:

    { http_parser: '1.0',
      node: '0.10.4',
      v8: '3.14.5.8',
      ares: '1.9.0-DEV',
      uv: '0.10.3',
      zlib: '1.2.3',
      modules: '11',
      openssl: '1.0.1e' }

## process.arch

What processor architecture you're running on: `'arm'`, `'ia32'`, or `'x64'`.

    console.log('This processor architecture is ' + process.arch);


## process.platform

What platform you're running on:
`'darwin'`, `'freebsd'`, `'linux'`, `'sunos'` or `'win32'`

    console.log('This platform is ' + process.platform);


## process.nextTick(callback)

* `callback` {Function}

Once the current event loop turn runs to completion, call the callback
function.

This is *not* a simple alias to `setTimeout(fn, 0)`, it's much more
efficient.  It runs before any additional I/O events (including
timers) fire in subsequent ticks of the event loop.

    console.log('start');
    process.nextTick(function() {
      console.log('nextTick callback');
    });
    console.log('scheduled');
    // Output:
    // start
    // scheduled
    // nextTick callback

This is important in developing APIs where you want to give the user the
chance to assign event handlers after an object has been constructed,
but before any I/O has occurred.

    function MyThing(options) {
      this.setupOptions(options);

      process.nextTick(function() {
        this.startDoingStuff();
      }.bind(this));
    }

    var thing = new MyThing();
    thing.getReadyForStuff();

    // thing.startDoingStuff() gets called now, not before.

It is very important for APIs to be either 100% synchronous or 100%
asynchronous.  Consider this example:

    // WARNING!  DO NOT USE!  BAD UNSAFE HAZARD!
    function maybeSync(arg, cb) {
      if (arg) {
        cb();
        return;
      }

      fs.stat('file', cb);
    }
