---
title: console.log Formatter
tags: TypeScript JavaScript logging
---

So you're developing a large JavaScript application, and you eventually
decide to formalize your logging rather than haphazardly using 
`console.log` and its brethren all over the place.

Perhaps your UI framework has a logging utility you can hook into, or
perhaps you're going to write your own.

In either case, it might be helpful to be able to spot logging messages
written through your formal logging mechanism amidst other temporary
logging messages or third-party logging outputted with plain vanilla
`console.log`.

While browsers do a decent job of color-coding logging messages based
on their log level, it might help to enhance the formatting just a bit
more.

In comes a non-standard, and somewhat under-utilized extension to
`console.log` that allows style attributes to be specified for logging
messages using the `%c` format specifier.

I'm working on hooking up something similar to the code below to a
custom implementation of [Aurelia](https://aurelia.io/)'s `Appender`
interface, but it certainly can be adapted elsewhere.

```ts
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

type Lookup<T> = { [key: string]: T };

// style settings
const tagStyles: Lookup<string> = {
    error: 'background:red;color:white;',
    warn: 'background:orange;color:black;',
    info: 'background:blue;color:white;',
    debug: 'background:lightgray;color:gray'
};

const messageStyles: Lookup<string> = {
    error: 'color:red;',
    warn: 'color:orange;',
    info: 'color:blue;',
    debug: 'color:gray;'
};

const sourceStyle = 'color:gray;font-style:italic;'
const sourceStyles: Lookup<string> = {
    error: sourceStyle,
    warn: sourceStyle,
    info: sourceStyle,
    debug: sourceStyle
};

// console.log wrapper with formatting
function log(level: LogLevel, message: string, source?: string, details?: any) {
    const text = `%c[${level}]%c ${message}` + (source ? ` %c(${source})` : '');
    const styles = [tagStyles[level], messageStyles[level], ...(source ? [sourceStyles[level]] : []) ];
    console[level](text, ...styles);
    if(details) { console[level](details); }
}

// examples
log('debug', 'Who cares?');
log('debug', 'Who cares?', 'debug-service');
log('info', 'Useful information.');
log('info', 'Useful information.', 'language-service');
log('warn', 'This is bad!');
log('warn', 'This is bad!', 'account-service');
log('error', 'This is worse!');
log('error', 'This is worse!', 'sync-service', new Error('oops!'));
```

This can be implemented as four separate logging functions or methods
(`.debug()`, `.info()`, `.warn()`, `.error()`) instead of using the
first parameter to specify a log `level`. In practice this is probably
more comfortable and easier to migrate to, but for my purposes (and
the purposes of this example), I needed a single function.

The second parameter is the log `message`. Pretty straight-forward.

The third parameter is optional, and specifies a `source` of the
message. This could be set to the name of the current class or via some
dependency injection mechanism.

The fourth parameter is also optional, and allows specifying more
`details`, such as an `Error` object.

The result looks something like this, which will stand out nicely among
other log messages:

<pre style="background:#FDD;color:#F00;"><span style="background:red;color:white;">[error]</span><span style="color:red;"> This is worse! </span><span style="color:gray;font-style:italic;">(sync-service)</span>
example.ts:111 Error: oops!
    at eval (eval at &lt;anonymous&gt; (example.ts:68),&lt;anonymous&gt;:36:48)
    at example.ts:68
</pre>

Just customize `tagStyles`, `messageStyles`, and `sourceStyles` as you see
fit.

The tag could be changed from the somewhat superfluous `[error]` format to
include the timestamp or some other piece of information.
