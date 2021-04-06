---
title: SCOTUS Decision on API Copyrights
tags: news legal API
---

In [a decision that has been in the making for over a decade](https://www.scotusblog.com/2021/04/google-wins-copyright-clash-with-oracle-over-computer-code/), the Supreme Court has affirmed that copying APIs falls under fair use.

<!--more-->

This is, of course, a big deal for software developers. There was also concern that SCOTUS would only rule on this case but leaving the question open for future cases. Fortunately, the decision was decided as a *matter of law*.

I have been following this case since it started as it has bounced through various courts all the way to the Supreme Court. I've given presentations to colleagues about the potential ramifications of this case. I won't reiterate them here. I'm just relieved that it's finally over.

Of course, I'm oversimplifying the case and the decision, as is almost every article about the subject (and even the opinion of the Court written by Justice Breyer).

> The case involved Google’s use of certain code in its Android operating system. Google wanted Android to understand commands commonly used in the Java SE platform (which is now owned by Oracle), so it used within Android about 11,000 lines of code from Java SE. Oracle claimed that the re-use of that code without permission constituted copyright infringement.

For one, it bothers me to see this referred to as "code." It's like saying the title of a book is the story.

Early on there was a minor quibble because some implementation was included in the copied source, but this was an oversight on Google's part and would have been easily removable. It ended up boiling down to a `rangeCheck` function, and the judge on the original court case, the Honorable Judge William H. Alsup, was [tech-savvy enough to realize the function could have been implemented by a high school student](https://www.theverge.com/2017/10/19/16503076/oracle-vs-google-judge-william-alsup-interview-waymo-uber). Therefore it was far from being substantive enough to qualify for copyright, and Google gained no unfair advantage in getting its product to the market.

> "Google reimplemented a user interface, taking only what was needed to allow users to put their accrued talents to work in a new and transformative program", Breyer wrote.

This one also gets me, a bit. Yes, it's a "user interface" for certain definitions of users. In this case, the users are programmers, in the middle, not end users on a computer, a phone, or another device. That's why we call them APIs (application programming interfaces), because they are how applications interface with each others, and how applications interface with users. Sure it's semantics, but being "technically correct" is always important in legal matters.

### References

- [Google wins copyright clash with Oracle over computer code](https://www.scotusblog.com/2021/04/google-wins-copyright-clash-with-oracle-over-computer-code/) by James Romoser
- [The Judge's Code](https://www.theverge.com/2017/10/19/16503076/oracle-vs-google-judge-william-alsup-interview-waymo-uber) by Sarah Jeong