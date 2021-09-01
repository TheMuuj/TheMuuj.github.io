---
title: Creating Arrays by Repeating Values in JavaScript
description: There's got to be a better way!
tags: TypeScript JavaScript development
---

Sometimes when I'm prototyping an user interface I need some mock data and want to create an array of repeating elements. There's not an immediately obvious way to do this in JavaScript, but these days `Array` usually has all the functionality needed to fill in the gaps.

<!--more-->

```ts
const a = Array(5).map(x => 0);
console.log(a); // [empty x 5]
```

Empty? I expected the call to `map` to replace those with `0`.

Maybe this is one of those differences between calling a constructor function directly and calling it with `new`.

```ts
const b = new Array(5).map(x => 0);
console.log(b); // [empty x 5]
```

Still "empty." I'm pretty sure the operator precedence is correct here, but let me be sure.

```ts
const c = (new Array(5)).map(x => 0);
console.log(c); // [empty x 5]
```

What gives? What's up with "empty?" If you try to access an empty element, the result is `undefined`, but that's not what Chrome's console is showing.

According to the [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map#description),

> It is not called for missing elements of the array; that is:
> - indexes that have never been set;
> - indexes which have been deleted.

In this case "empty" means that the array object simply doesn't not have a property key/value for that index.

This is best demonstrated by reflecting over the keys.

```ts
const d = [0, 0, 0, 0, 0];
console.log(Reflect.ownKeys(d)); // ["0", "1", "2", "3", "4", "length"]

const e = Array(5);
console.log(Reflect.ownKeys(e)); // ["length"]
```

Calling the `Array` constructor with a number will set the `length` property of the result, but it won't set any other properties.

This is because JavaScript `Array` objects are "sparse" arrays. Calling `Array(1000000000)` won't allocate a ton of memory. (Technically, at least the common browsers won't. I think this is technically left as an implementation detail.)

Calling `Array(N)` is similar to constructing an array and then calling `delete[n]` on all `N` elements in a `for` loop.

There are multiple ways to address this if you really want to repeat a value and create a new array with minimal code. One way is to take advantage of `Array.from` and its ability to handle anything that looks similar to an array. If the object has a `length` property, it will work, which includes a spare `Array`.

```ts
const f = Array.from(Array(5)).map(x => 0);
console.log(f); // [0, 0, 0, 0, 0]

const g = Array.from({ length: 5 }).map(x => 0);
console.log(g); // [0, 0, 0, 0, 0]
```

But there's an even better way that doesn't require a lambda function. A call to `fill` on an `Array` will set every element to the same value.

```ts
const h = Array(5).fill(0);
console.log(h); // [0, 0, 0, 0, 0]
```

As long as you aren't stuck supporting Internet Explorer, this version is the most concise and reads well. To be fair, Internet Explorer doesn't support `Array.from`, either.

Next time, I'll cover some issues when trying to create arrays of repeated objects.
