---
title: TypeScript Convert Array to Object
tags: TypeScript JavaScript development
---

A common pattern I come across when dealing with data from REST APIs is needing to convert arrays into objects keyed on a particular property of items in the array.

<!--more-->

Sure, it's not hard to write a few lines of code to do this *imperatively* this with a `for...of` loop, but sometimes it's nice to chain together JavaScript's *functional* `Array` methods, such as `map`, `filter`, and `reduce`.

So I present my TypeScript utility function for doing this without having to remember the particulars of `reduce`.

```ts
type KeySelector<T> = (item: T) => string;

function arrayToObject<T, K>(array: Iterable<T>, keySelector: KeySelector<T>): Record<string, T> {
    return Array.from(array).reduce(
        (acc, item) => Object.assign(acc, { [keySelector(item)]: item }), { }
    );    
}
```

Here is the same function written imperatively. I haven't done benchmarks to compare the two approaches.

```ts
function arrayToObject<T, K>(array: Iterable<T>, keySelector: KeySelector<T>): Record<string, T> {
    const result: Record<string, T> = { };
    for(const item of array) {
        result[keySelector(item)] = item;
    }
    return result;
}
```

Finally, this is a simple example of the function in use.

```ts
// example data structured as an array
const items = [
    { name: 'earth', bg: '#006400', fg: '#FFFFFF', emoji: '\uD83C\uDF0E' },
    { name: 'wind', bg: '#F5F5F5', fg: '#000000', emoji: '\uD83C\uDF2A' },
    { name: 'fire', bg: '#FF4500', fg: '#FFFFFF', emoji: '\uD83D\uDD25' },
    { name: 'water', bg: '#00008B', fg: '#FFFFFF', emoji: '\uD83D\uDCA6' }
];

// convert to lookup object using the `name` property
const lookup = arrayToObject(items, i => i.name);

for(const element of ['earth', 'wind', 'fire', 'water']) {
    const item = lookup[element];
    console.log('%s %c[ %s ]',
        item.emoji,
        `background:${item.bg};color:${item.fg};`,
        item.name);
}
```

Output:
> 🌎 `[ earth ]`\
> 🌪 `[ wind ]`\
> 🔥 `[ fire ]`\
> 💦 `[ water ]`
