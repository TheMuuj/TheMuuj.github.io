---
title: Most Helpful Helpers
tags: development QBasic
---

Today I was thinking about how no matter what language one develops in, a project invariably has a handful of helper functions that get a **lot** of use. They do vary significantly from language to language and framework to framework.

<!--more-->

The first such function I used widely would be in QBASIC, and I included it in every project.

It was called `XPRINT`, and it was a shorthand for `LOCATE` and `PRINT`, allowing text to be displayed on the screen at any location with a single line of code. My programs would be littered with `XPRINT` calls.

If QBASIC had supported optional parameters (and I had understood them at the time), `XPRINT` would probably allow for setting the foreground and background color as well. I did have a `XCPRINT` in a few programs that did just that.

### Example

```vb
XPRINT 3, 4, "Hello,"
XPRINT 4, 4, "World!"

SUB XPRINT (Row%, Col%, Value$)
    LOCATE Row%, Col%
    PRINT Value$;
END
```
### Output

```


    Hello,
    World!
```
