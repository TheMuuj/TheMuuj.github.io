---
title: JavaScript Timing Proverb
tags: TypeScript JavaScript timing
---

Today, I accidentally constructed a great rhyming proverb to help dealing with timing issues and/or race conditions in a JavaScript browser application.

<!--more-->

> When in doubt use `setTimeout`.

There have been many times, especially when dealing with UI frameworks, where the solution was simply to delay execution. Most of the time, a `0` millisecond delay will work as you only need to wait for currently queued micro-tasks to execute.
