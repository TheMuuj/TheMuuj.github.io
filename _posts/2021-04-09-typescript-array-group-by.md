---
title: TypeScript Group Array by Key
description: Let's collect these objects into smaller groups
tags: TypeScript JavaScript development
---

[Previously I discussed a function for converting an Array to an Object based on a specified key]({% post_url 2021-04-05-typescript-array-to-object %}).

Sometimes there will be multiple values with the same key in the input Array, so the shape of the result should be a mapping between key and an Array of values.

<!--more-->

This is only slightly more complicated than before. Internally, we can still rely on the `reduce` function. However, rather than merging the accumulated result object with `Object.assign`, we need to see if a given `key` is already in the result object.

If so, we can `push` the result into the Array. If not, create a new Array with the value.

```ts
type KeySelector<T> = (item: T) => string;

function groupBy<T>(array: Iterable<T>, keySelector: KeySelector<T>): Record<string, T[]> {
    return Array.from(array).reduce(
        (acc: Record<string, T[]>, item: T) => {
            const key = keySelector(item);
            if(key in acc) {
                // found key, push new item into existing array
                acc[key].push(item);
            }
            else {
                // did not find key, create new array
                acc[key] = [ item ]; 
            }
            return acc;
        }, 
        { } // start with empty object
    );    
}
```

Again, this can easily be written *imperatively* with `for..of` loop, but I'm going to stick with the `reduce` implementation.

```ts
// example data structured as an array
const items = [
    { type: 'sword', name: 'Excalibur' },
    { type: 'sword', name: 'Narsil' },
    { type: 'hammer', name: 'Mjölnir' },
    { type: 'sword', name: 'Oathkeeper' },
    { type: 'spear', name: 'Gungnir' }
];

// convert to lookup object using the `type` property
const groups = groupBy(items, i => i.type);
for(const key in groups) {
    const list = groups[key].map(s => s.name).join(', ')
    console.log(`[${key}]: ${list}`);
}
```

Output:
```
[sword]: Excalibur, Narsil, Oathkeeper
[hammer]: Mjölnir
[spear]: Gungnir
```
