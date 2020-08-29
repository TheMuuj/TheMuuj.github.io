---
title: C# Awaiting Multiple Tasks
tags: development CSharp
---

[Previously I discussed a method for collection deconstruction in C#]({% post_url 2020-08-28-csharp-collection-deconstructing %}) and mentioned that it was also useful in conjunction with `Task.WhenAll` for easily assigning `Task` results to individual variables.

Unfortunately, it was limited to situations where every `Task` returned the same type, but I knew that there was an easy solution for this that didn't involve collection deconstruction.

<!--more-->

It's as simple as writing static methods that each return a `Task` of `ValueTuple` values:

```csharp
using System.Threading.Tasks;

namespace TheMuuj.Blog {

    public static class AllTasks {

        public static Task<(T1, T2)> When<T1, T2>(
            Task<T1> task1, 
            Task<T2> task2) {

            Task.WhenAll(task1, task2);
            return Task.FromResult((task1.Result, task2.Result));
        }

        // omit 3-tuple through 5-tuple

        public static Task<(T1, T2, T3, T4, T5, T6)> When<T1, T2, T3, T4, T5, T6>(
            Task<T1> task1,
            Task<T2> task2,
            Task<T3> task3,
            Task<T4> task4,
            Task<T5> task5,
            Task<T6> task6
        ) {

            Task.WhenAll(task1, task2, task3, task4, task5, task6);
            return Task.FromResult((task1.Result, task2.Result, task3.Result,
                task4.Result, task5.Result, task6.Result));
        }

    }
    
}
```

The resulting usage is pretty straightforward, although it's not as "discoverable" because it exists on `AllTasks` as a `static` method instead of `Task`.

```csharp
// assume different types like:
// Account, UserContactInfo, UserHistory, UserPreferences
var (account, contacts, history, preferences) = await AllTasks.When(
    userService.GetAccountAsync(userId),
    userService.GetContactsAsync(userId),
    userService.GetHistoryAsync(userId),
    userService.GetUserPreferencesAsync(userId)
).ConfigureAwait(false);
```

I'm actually late to the game here, and a slightly better syntax with fewer extra memory allocations can be accomplished by creating specialized a series of `TupleTaskAwaiter` `struct` types, and adding `GetAwaiter` extension methods to the various `ValueTuple` types. After all, like most C# syntax sugar features, `async`/`await` is based on pattern matching and not specific classes or interfaces.

This is already packaged up in the `TaskTupleAwaiter` [NuGet package](https://www.nuget.org/packages/TaskTupleAwaiter/).

The syntax is slightly different. I tend to prefer it, and would consider using it. However I'm perfectly happy with my solution and the extra allocations probably aren't a big deal most of the time.

The equivalent syntax to the above for `TaskTupleAwaiter` would be:

```csharp
var (account, contacts, history, preferences) = await (
    userService.GetAccountAsync(userId),
    userService.GetContactsAsync(userId),
    userService.GetHistoryAsync(userId),
    userService.GetUserPreferencesAsync(userId)
).ConfigureAwait(false);
```

The only difference is the lack of `AllTasks.When`.

There was [a proposal to officially add this functionality to .Net](https://github.com/dotnet/runtime/issues/20166), but it appears to have been closed.

These solutions also don't allow mixing result-returning `Task<T>` with void-returning `Task`. I haven't personally come across that situation, yet, but I'm sure it happens. That's another pattern where TypeScript's type system is superior, with `void` being a type that can be used as a generic parameter. That means `Promise<void>` isn't any different than `Promise<string>`.
