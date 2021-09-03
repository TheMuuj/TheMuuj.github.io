---
title: Creating Arrays of Repeated Objects in JavaScript
description: There's got to be a better way!
tags: TypeScript JavaScript development
---

[Previously]({% post_url 2021-09-01-javascript-array-repeat %}), I covered creating arrays of repeated elements in JavaScript. This works fine for the primitive types. When it comes to objects, however, there are a few caveats.

<!--more-->

Again, using the `Array` constructor and the `fill` function, an array of 5 empty objects could be created in a straightforward manner.

```ts
const a = Array(5).fill({});
console.log(a); // [{}, {}, {}, {}, {}]
```

Success! But each of the elements in the array are references to the same `{}` object. If you're treating all the objects as immutable, this is perfect. If you're using a front-end framework and are binding this data to repeated HTML elements and binding the view to these objects, then changing properties on one element will change it on all elements.

I'll try to keep this agnostic with regard to frontend frameworks. Imagine five `<input type="text">` elements with their `value` attributes bound to a `text` property on the elements of this array. Typing into any one of the text boxes will update the other four.

How does one easily create an array of five distinct objects? We can rewind back to using `Array.from` and `map`.

```ts
// WARNING: don't actually use this!
const b = Array.from({ length: 5 }).map(x => {});
console.log(b); // [undefined, undefined, undefined, undefined, undefined]
```

Oops, I tried this and immediately knew what I had done wrong. I should have known better. When defining a lambda with the `=>` arrow operator, the meaning of `{}` is to define a function block and not an object literal. This defines a function without a `return` statement, which essentially returns `undefined`.

Let me try that again.

```ts
const c = Array.from({ length: 5 }).map(x => ({}));
console.log(c); // [{}, {}, {}, {}, {}]
console.log(c[0] === c[1]); // false
```

This is the behavior I'm after. An array of five unique objects is created. This is verified by the comparison `c[0] === c[1]`.

I'm not entirely happy with the syntax. The fact that the `Array` constructor and `map` don't play well together is a little annoying. The code intent isn't fully clear.

Is this any better? **Note:** if you're using TypeScript, the call to `fill()` will need to be changed to something like `fill(null)` because it expects you to pass an argument.

```ts
const d = Array(5).fill().map(x => ({}));
console.log(d); // [{}, {}, {}, {}, {}]
console.log(d[0] === d[1]); // false
```

Generally I only need code like this in prototypes and in unit tests. In real applications I would be loading data from something like a REST API or a JSON file.

Honestly, I'd probably prefer this to be wrapped up in a function. This has the added bonus of having an `index` value handy when generating each element.

```ts
function generateArray<T>(length: number, generator: (index: number) => T): T[] {
    return Array.from({ length }).map((_v, index, _a) => generator(index));
}

const e = generateArray(5, index => ({}));
console.log(e); // [{}, {}, {}, {}, {}]
console.log(e[0] === e[1]); // false
```

This idea could be expanded to create multi-dimensional arrays, too, since that can be a pain in JavaScript/TypeScript.
