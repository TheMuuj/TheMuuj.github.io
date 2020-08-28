---
title: C# Collection Deconstructing
tags: development CSharp
---

I really like some of JavaScript's more modern-ish features, especially in conjunction with the rich TypeScript type system.

I particularly appreciate object and array destructuring assignments.

<!--more-->

Here's an oversimplified example of destructuring an array in TypeScript:

```ts
const input = 'v5.1-beta';
const [version, name] = input.split('-');

console.log(version); // 5.1
console.log(name); // beta
```

It's very useful when combined with `Promise.all` to await multiple asynchronous tasks and assign each results to individual variables:

```ts
const [user, project] = await Promise.all([
    fetchUser(userId),
    fetchProject(projectId)
]);
```

C# 7 introduced a concept very similar to object destructuring assignment that works with `ValueTuple`. It also works with any type that has a `Deconstruct` method. But it doesn't really support arrays or collections.

Luckily, the `Deconstruct` method can be an extension method, so it's possible to write custom deconstruction methods. We can define a series of extension methods on `IEnumerable<T>` as such:

```csharp
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace TheMuuj.Blog {

    public static class DeconstructExtensions {

        // deconstructs a collection to two values
        public static void Deconstruct<T>(
            this IEnumerable<T> collection,
            [MaybeNull] out T item1,
            [MaybeNull] out T item2) {

            var enumerator = collection.GetEnumerator();
            item1 = Next(enumerator);
            item2 = Next(enumerator);
        }

        // deconstructs a collection to three values
        public static void Deconstruct<T>(
            this IEnumerable<T> collection,
            [MaybeNull] out T item1,
            [MaybeNull] out T item2,
            [MaybeNull] out T item3) {

            var enumerator = collection.GetEnumerator();
            item1 = Next(enumerator);
            item2 = Next(enumerator);
            item3 = Next(enumerator);
        }

        // deconstructs a collection to four values
        public static void Deconstruct<T>(
            this IEnumerable<T> collection,
            [MaybeNull] out T item1,
            [MaybeNull] out T item2,
            [MaybeNull] out T item3,
            [MaybeNull] out T item4) {

            var enumerator = collection.GetEnumerator();
            item1 = Next(enumerator);
            item2 = Next(enumerator);
            item3 = Next(enumerator);
            item4 = Next(enumerator);
        }

        // deconstructs a collection to five values
        public static void Deconstruct<T>(
            this IEnumerable<T> collection,
            [MaybeNull] out T item1,
            [MaybeNull] out T item2,
            [MaybeNull] out T item3,
            [MaybeNull] out T item4,
            [MaybeNull] out T item5) {

            var enumerator = collection.GetEnumerator();
            item1 = Next(enumerator);
            item2 = Next(enumerator);
            item3 = Next(enumerator);
            item4 = Next(enumerator);
            item5 = Next(enumerator);
        }

        // deconstructs a collection to six values
        public static void Deconstruct<T>(
            this IEnumerable<T> collection,
            [MaybeNull] out T item1,
            [MaybeNull] out T item2,
            [MaybeNull] out T item3,
            [MaybeNull] out T item4,
            [MaybeNull] out T item5,
            [MaybeNull] out T item6) {

            var enumerator = collection.GetEnumerator();
            item1 = Next(enumerator);
            item2 = Next(enumerator);
            item3 = Next(enumerator);
            item4 = Next(enumerator);
            item5 = Next(enumerator);
            item6 = Next(enumerator);
        }

        // helper method to advance enumerator and return next value
        [return: MaybeNull]
        private static T Next<T>(IEnumerator<T> enumerator) =>
            enumerator.MoveNext() ? enumerator.Current : default;

    }

}
```

I have only provided up to 6-tuple support here, but it can be extended to more as needed.

The `[MaybeNull]` attributes are there to support nullable reference types and nullable value types with the C# 8 null static analysis support. This is the best solution at the moment (short of turning nullable reference types off) until [hopefully C# 9 introduces](https://github.com/dotnet/csharplang/blob/master/meetings/2019/LDM-2019-11-25.md) something like the `T??` type to represent the type of `default(T)`.

This is because if the collection has fewer items than expected, the remaining items will be assigned `default(T)`. If dealing with non-nullable references, this means something like `string` could be assigned `null`, which technically makes it `string?`.

If the collection has more items than expected, the excess items are never actually enumerated and are discarded.

Here are a few unit tests that show off how collection deconstructing works:

```csharp
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace TheMuuj.Blog.Tests {

    [TestClass]
    public class DeconstructExtensionsTests {

        // simulate an asynchronous task and return a result
        private static async Task<T> SimulateTask<T>(
            T result,
            int millisecondsDelay) {

            await Task
                .Delay(millisecondsDelay)
                .ConfigureAwait(false);

            return result;
        }

        [TestMethod]
        public void TestDeconstruct2() {
            string[] values = { "a", "b" };

            var (a, b) = values;
            Assert.AreEqual("a", a);
            Assert.AreEqual("b", b);
        }

        [TestMethod]
        public async Task TestDeconstruct2TaskAsync() {
            var (a, b) = await Task.WhenAll(
                SimulateTask("a", 2),
                SimulateTask("b", 1)
            );

            Assert.AreEqual("a", a);
            Assert.AreEqual("b", b);
        }

        // TestDeconstruct3-6 tests omitted

        [TestMethod]
        public void TestDeconstruct6() {
            string[] values = { "a", "b", "c", "d", "e", "f" };

            var (a, b, c, d, e, f) = values;
            Assert.AreEqual("a", a);
            Assert.AreEqual("b", b);
            Assert.AreEqual("c", c);
            Assert.AreEqual("d", d);
            Assert.AreEqual("e", e);
            Assert.AreEqual("f", f);
        }

        [TestMethod]
        public void TestDeconstruct6Empty() {
            string?[] values = { };

            // make sure an empty collection
            // assigns null to all variables
            var (a, b, c, d, e, f) = values;
            Assert.IsNull(a);
            Assert.IsNull(b);
            Assert.IsNull(c);
            Assert.IsNull(d);
            Assert.IsNull(e);
            Assert.IsNull(f);
        }

        [TestMethod]
        public void TestDeconstruct6Shorter() {
            string?[] values = { "a", "b", "c" };

            // make sure insufficient items result
            // in appropriate null assignments
            var (a, b, c, d, e, f) = values;
            Assert.AreEqual("a", a);
            Assert.AreEqual("b", b);
            Assert.AreEqual("c", c);
            Assert.IsNull(d);
            Assert.IsNull(e);
            Assert.IsNull(f);
        }

        [TestMethod]
        public void TestDeconstruct6Longer() {
            string[] values = { "a", "b", "c", "d", "e", "f", "g", "h" };

            // basically the same as TestDeconstruct6
            // but ensure extra items don't break the logic
            var (a, b, c, d, e, f) = values;
            Assert.AreEqual("a", a);
            Assert.AreEqual("b", b);
            Assert.AreEqual("c", c);
            Assert.AreEqual("d", d);
            Assert.AreEqual("e", e);
            Assert.AreEqual("f", f);
        }

    }

}
```

The `TestDeconstruct2TaskAsync` test shows how this can be used with `Task.WhenAll`, which is the C# equivalent of JavaScript's `Promise.all`.

Unfortunately the tasks must all return the same type for this approach to work. However, I have a different idea on how to support that. Stay tuned.
