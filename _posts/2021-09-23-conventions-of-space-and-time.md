---
title: Conventions of Space and Time
description: "'The question, Constable, isn't where ... but when!'"
tags: NASA JPL development
---

[Previously]({% post_url 2021-09-21-web-apps-and-dates %}) I was a little snarky about issues with dealing with date/time calculations in software. Over the years I've had to work around less-than-ideal date/time support in various languages, platforms, and libraries. But I know first-hand that it can always be much more complicated.

<!--more-->

Years ago, while working as a developer in the space science industry, I have needed to worry about some strange date/time calculations:

- [Leap Seconds](https://en.wikipedia.org/wiki/Leap_second)
- Martian [Local Solar Time](https://en.wikipedia.org/wiki/Solar_time)
- Stellar [Aberration](https://en.wikipedia.org/wiki/Aberration_(astronomy))
- [Speed of Light](https://en.wikipedia.org/wiki/Speed_of_light) Time Corrections

Actually, it wasn't so bad, as I did have good library support. NASA's [Navigation and Ancillary Information Facility](https://naif.jpl.nasa.gov/naif/about.html) at the [Jet Propulsion Laboratory](https://www.jpl.nasa.gov/) have developed and provide a software toolkit called [SPICE](https://naif.jpl.nasa.gov/naif/aboutspice.html).

## Leap Seconds

Because of Leap Seconds, the last minute of the year can occasionally have 60 seconds. Therefore `2016-12-31T23:59:60Z` is technically a valid date/time. Most software does not bother with the distinction. If you calculate the number of seconds between two dates that span a leap second, the calculations will technically be off by the number of leap seconds between the dates. Being wrong by a few seconds for such a calculation isn't a usually big deal for most domains.

For example, in JavaScript:
```js
const endDate = new Date('2017-01-01T12:00:00');
const startDate = new Date('2016-12-31T12:00:00');
const secondsElapsed = endDate.getTime() - startDate.getTime();

console.log(`${secondsElapsed}s Elapsed`); // 86400000s Elapsed
```

The "correct" output should be `86400001s`.

Also, it's impossible to predict when leap seconds are going to be added, so calculations involving future dates can be wrong. (This same problem happens with future timezone calculations).

So almost everyone just ignores leap seconds, for the most part. The servers that provide time synchronization have various ways of dealing with this issue. Google's and Amazon's NTP servers employ what they call [leap smear](https://developers.google.com/time/smear), where the extra second gets spread out over a 24 hour period.

But astronomers need precise time calculations. The large scales involved mean that a difference of a second could mean a huge change in position or velocity. Also, there's a need to synchronize the internal clocks of various spacecraft.

Using the SPICE toolkit, dates are usually handled as Ephemeris Time (ET), specifically Barycentric Dynamical Time (TDB). This is just a number of seconds past a reference epoch, suitable for use as an independent variable in the calculation of differential equations to describe the motion of celestial objects.

The epoch generally used in astronomy is known as "J2000", defined as noon on January 1, 2000 in Terrestrial Time (`2000-01-01T12:00:00 TT`). I prefer J2000 to the Unix epoch, as it's much more convenient for the year `2000` to be "zero" instead of `1970`.

I've been known to use J2000 in software projects unrelated to astronomy when trying to save bytes when encoding dates as a binary number. For instance, when used to store the number of days since J2000, an unsigned 16-bit integer can store dates as high as 2179.

## More About SPICE

The SPICE library is about much more than time. It's also about space. Given the right data files (or SPICE Kernels) to configure the system, it can be used to calculate the relative positions and orientations of various bodies in space.

For example, if you know your latitude and longitude on a planet, along with your orientation, SPICE can tell you where an object is located in the sky. It can even correct for how long it takes the light from the target to arrive. As far as I know, it does not deal with relativistic effects, but it's possible this has changed since I used the toolkit.

SPICE was originally written in Fortran. It is then automatically translated to C, and the C version is wrapped to provide official interfaces for various other languages: IDL, MATLAB, and Java. Third parties have added support for other languages.

Apparently there's currently a re-implementation of SPICE in C++11, started in May 2017. One of the main goals is making the library thread-safe. This is great to hear because the lack of multi-threaded support did come up when trying to do calculations in a Java web server application. It was impossible to load different sets of SPICE Kernels in different threads, so calls to SPICE using different data needed to be fully serialized.

If you want to play around with SPICE without setting up the toolkit locally and learning its archaic functions, the [European Space Agency](https://www.esa.int/) provides [WebGeocalc](https://www.cosmos.esa.int/web/spice/webgeocalc) with a web interface and REST API.
