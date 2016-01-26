![NK-Core](../images/NKCore.png?v01)
# console

* {Object}

<!--type=global-->

For printing to stdout and stderr.  Similar to the console object functions
provided by most web browsers, here the output is sent to stdout or stderr.

## console.log([data][, ...])

Prints to stdout with newline. This function can take multiple arguments in a
`printf()`-like way. Example:

    var count = 5;
    console.log('count: %d', count);
    // prints 'count: 5'

If formatting elements are not found in the first string then `util.inspect`
is used on each argument.  See [util.format()][] for more information.

## console.info([data][, ...])

Same as `console.log`.

## console.error([data][, ...])

Same as `console.log` but prints to stderr.

## console.warn([data][, ...])

Same as `console.error`.

## console.dir(obj[, options])

Uses `util.inspect` on `obj` and prints resulting string to stdout. This function
bypasses any custom `inspect()` function on `obj`. An optional *options* object
may be passed that alters certain aspects of the formatted string:

- `showHidden` - if `true` then the object's non-enumerable properties will be
shown too. Defaults to `false`.

- `depth` - tells `inspect` how many times to recurse while formatting the
object. This is useful for inspecting large complicated objects. Defaults to
`2`. To make it recurse indefinitely pass `null`.

- `colors` - if `true`, then the output will be styled with ANSI color codes.
Defaults to `false`. Colors are customizable, see below.

## console.time(label)

Mark a time.

## console.timeEnd(label)

Finish timer, record output. Example:

    console.time('100-elements');
    for (var i = 0; i < 100; i++) {
      ;
    }
    console.timeEnd('100-elements');
    // prints 100-elements: 262ms

## console.trace(message[, ...])

Print to stderr `'Trace :'`, followed by the formatted message and stack trace
to the current position.

## console.assert(value[, message][, ...])

Similar to [assert.ok()][], but the error message is formatted as
`util.format(message...)`.

[assert.ok()]: assert.html#assert_assert_value_message_assert_ok_value_message
[util.format()]: util.html#util_util_format_format



