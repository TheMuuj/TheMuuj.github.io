---
title: Web Applications and Dates
description: The start of a set of in-depth discussions.
tags: TypeScript JavaScript development
---

Working with dates and times is hard. Doing so with JavaScript is also harder than it needs to be.

<!--more-->

## Introduction

First, if you have not already seen this, I highly recommend watching [The Problem with Time and Timezones](https://www.youtube.com/watch?v=-5wpm-gesOY) featuring Tom Scott on the [Computerphile channel](https://www.youtube.com/channel/UC9-y-6csu5WGm29I7JiwpnA).

Second, I'm disappointed in the state of date/time support in JavaScript. There are some really good libraries out there to fill this gap:
- [Moment.js](https://momentjs.com/)
- [date-fns](https://date-fns.org/)
- [js-joda](https://js-joda.github.io/js-joda/)

Each has their pros and cons (the primary cons being the size required to include them in an application), but they're all better than dealing with the native JavaScript `Date`.

Third, I'm equally disappointed in the built-in date-picker components that HTML5 added. Sure, they're great if you're trying to write a website that supports running without any JavaScript. I know those developers exist, but it's never me. I will go into more detail about the issues in future posts, but suffice to say [the MDN page on the topic](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date#handling_browser_support) does a pretty good job of covering the basic problems.

## The JavaScript `Date` type

When the `Date` type was first introduced, it only supported "local" time and used two digits for the year. We're already off to a bad start. I get it, early browsers probably didn't have great date/time libraries in the languages they were developed in, and practically *every* language/framework has started off on the wrong foot, including .NET. Java, from which JavaScript derives much of its early inspiration with regard to date handling, was particularly problematic.

I'm also briefly ignoring the issue that the JavaScript `Date` doesn't support dates *without* times, which will come up later when I cover the problems creating a great user experience for picking date values.

Four-digit years and UTC conversions were added later in a more-or-less backwards-compatible way, making `Date` a bit more palatable. Still, this means it only supports *"local"* time and UTC.

I write *"local"* time because it's really the timezone on the computer that the browser is running on, and not any preference specified by the user. I have used web applications through secure appliances where the timezone on the remote computer was locked, and thus *"local"* time would often times be several hours off of where I actually was located.

And even where I am physically located may not be the timezone I want to use when times are presented to me in a web application. It's a perfectly acceptable *default*, setting, but I would like a way to override this.

**Aside:** It would be nice for browsers to let you change some of these preferences for specific sites independently of the operating system, but that may be a pipe dream.

For instance, I may be travelling from the Central Time to the Pacific Time, and I may adjust my computer's setting accordingly. In the case of mobile devices, it may even happen automatically. When I log in to a particular web application, I may or may not want all of the dates to shift to the new timezone. If I'm scheduling an appointment while I'm travelling, I might prefer to continue to interact with an application in my "home" timezone.

One solution would be to have a "timezone picker" as part of your date/time picker. That's not for the faint of heart, though.

Of course, none of this is unique to web applications. It's just that browsers don't provide great solutions for dealing with the problems.

Luckily, the ECMAScript Intl API does allow "formatting" to an arbitrary timezone:

```js
const date = new Date();
const central = date.toLocaleString('en-US', { timeZone: 'America/Chicago' })
```

The specification only requires that browsers support UTC, but it seems like everything other than Internet Explorer supports the full [IANA Time Zone Database](https://www.iana.org/time-zones). If you have the pleasure of no longer supporting IE, this is good news.

With some clever logic, `toLocaleString` can be used to determine timezone rules for an arbitrary `timeZone` string, and conversions between named timezones can be performed. The aforementioned `Moment.js`, `date-fns`, and `js-joda` have extension libraries to add timezone support, but they add quite a bit of extra code for something that should be provided out of the box.

It would be better if `Date`, while continuing to represent UTC, also supported arbitrary timezones along with conversions between them. 

Also, these libraries make it possible to create a `Date` value that represents a time in a different timezone than the browser is using. Without that information tracked in the `Date` instance itself, using the built-in functions to convert to UTC will get it wrong. This can be a mess when trying to pass that information via JSON to a REST API.

## What about JSON?

On top of everything else, different APIs have different behaviors for supporting date/time values in JSON. Some of the formats used range from the rational (ISO 8601 `"2012-03-19T07:22Z"`), to the bizarre (`"\/Date(1198908717056)\/"`), to the downright invalid JSON (`new Date(1234656000000)`).

It's nice that JavaScript's `Date.prototype.toJSON()` function uses UTC and ISO 8601. But as I will describe next, that can also lead to issues.

## Writing a Better Picker

Because a `Date` can't represent a value in an arbitrary time-zone, and also because it can't represent a `Date` without a time, something as simple as a date picker (with no time component) can be a mess and won't work great for every application.

Say the user selects "September 19, 2021" in a date picker. The picker may present an object model where the selected value is a `Date`, in order to facilitate date arithmetic and validation.

The problem is, without a time or time-zone information, if this gets converted to JSON there's most likely going to be a subtle bug.

```js
// assuming browser time is CDT
const json = JSON.stringify(new Date("2020-09-19"));
const roundtrip = new Date(JSON.parse(json));
console.log(roundtrip); // Fri Sep 18 2020 19:00:00 GMT-0500 (Central Daylight Time)
```

At this point it probably makes more sense to pass around these values as strings using the `yyyy-mm-dd` format (the *superior* format) rather than use JavaScript `Date` values. But this is a form of Stringly Typing, which [Scott Hanselman suggests is a code smell](https://www.hanselman.com/blog/stringly-typed-vs-strongly-typed) (and I'm inclined to agree).

First on my wishlist for fixing this particular problem would be a native `DateOnly` type in JavaScript, and there's [good news coming](https://tc39.es/proposal-temporal/docs/) there. We're also getting [such a type in .NET 6](https://docs.microsoft.com/en-us/dotnet/api/system.dateonly?view=net-6.0), so there's a lot to look forward to in this space. (or should I say spacetime?)

## Upcoming

I'm not done talking/ranting about this subject, and plan to return with more ways to address these problems.

I have written code in several languages to deal with the pain-points of framework-provided native types, from JavaScript to C# to SQL. Every framework has subtle differences and issues.

I do forsee this problem will be addressed in browsers, but it's hard to tell how long we will have to wait.

If you are writing code that doesn't need to care about timezones, or only needs to deal in one timezone (especially if that's UTC), I envy you.
