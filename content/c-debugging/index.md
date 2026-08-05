---
id: c-debugging
title: "Debugging: printf, gdb, sanitisers"
track: c
---

# Debugging: printf, gdb, sanitisers

Every article so far has shown you correct code, or code broken in one specific, already-named way. Debugging is what you do when neither is true yet — when a program does something wrong and you do not already know why. This article is about the discipline of finding out, not new C syntax.

## 1. Reading a compiler error, properly

```c file=argcount.c expect_fail
void greet(int times);

int main(void)
{
    greet();
    return 0;
}
```

```output
argcount.c:5:5: error: too few arguments to function call, single argument 'times' was not specified
    5 |     greet();
      |     ^
argcount.c:1:6: note: 'greet' declared here
    1 | void greet(int times);
      |      ^
```

A different shape of mistake from `Building and running a C program`'s missing semicolon, but the same reading discipline applies: a location, an `error:`, a description of what was wrong, and often a second `note:` pointing at the relevant declaration — here, exactly where `greet` was prototyped to take one argument. Reading the note is not optional; it is frequently where the actual, actionable information is.

## 2. printf instrumentation

```c file=buggy.c run
#include <stdio.h>

int midpoint(int low, int high)
{
    int mid = low + high / 2;
    printf("low is %d, high is %d, mid is %d\n", low, high, mid);
    return mid;
}

int main(void)
{
    int m = midpoint(4, 10);
    printf("midpoint is %d\n", m);
    return 0;
}
```

```output
low is 4, high is 10, mid is 9
midpoint is 9
```

The midpoint of `4` and `10` should be `7`. The `printf` inside `midpoint` — added purely to see what the function computes along the way, not part of the program's real purpose — shows `mid` is `9` before `midpoint` even returns, narrowing the bug to this function specifically, and to this line specifically, rather than somewhere in `main`. `low + high / 2` is `Expressions, operators, and conditionals`'s precedence rule catching up with you: `/` binds tighter than `+`, so this computes `low + (high / 2)`, `4 + 5`, not `(low + high) / 2`.

```c file=fixed.c run
#include <stdio.h>

int midpoint(int low, int high)
{
    int mid = (low + high) / 2;
    printf("low is %d, high is %d, mid is %d\n", low, high, mid);
    return mid;
}

int main(void)
{
    int m = midpoint(4, 10);
    printf("midpoint is %d\n", m);
    return 0;
}
```

```output
low is 4, high is 10, mid is 7
midpoint is 7
```

Parenthesising the addition fixes it: `7`, as expected. This is printf instrumentation's whole method — add a line that reports a value you have a specific expectation for, run the program, and compare what actually printed against that expectation, not against a general feeling that something is wrong.

## 3. gdb: break, run, step, print, backtrace

`gdb` watches a running program instead of asking it to report on itself. A representative session, debugging `midpoint` before the fix:

```output
$ gdb ./buggy
(gdb) break midpoint
Breakpoint 1 at 0x1169: file buggy.c, line 5.
(gdb) run
Starting program: ./buggy
Breakpoint 1, midpoint (low=4, high=10) at buggy.c:5
5           int mid = low + high / 2;
(gdb) step
6           printf("low is %d, high is %d, mid is %d\n", low, high, mid);
(gdb) print mid
$1 = 9
(gdb) backtrace
#0  midpoint (low=4, high=10) at buggy.c:5
#1  main () at buggy.c:12
```

`break midpoint` marks where execution should pause. `run` starts the program, stopping at that breakpoint rather than running to completion. `step` executes the next line and pauses again, letting you advance one statement at a time. `print mid` reports `mid`'s current value without needing a `printf` written into the source at all — the exact information section 2 got by editing the program, obtained here without editing it. Exact addresses and line numbers will differ on your own machine; the shape of the session will not.

## 4. Reading a stack trace

`backtrace` above is a **stack trace**: the list of calls currently in progress, most recent first, `midpoint` on top of `main` underneath it. This is not gdb inventing a summary — it is reading the same stack frames `The stack and function calls` describes, each one still holding its own parameters, including `low` and `high`'s values shown right there in the trace. A stack trace answers "how did execution get here" directly: read bottom to top, it is the exact chain of calls that led to wherever you stopped.

## 5. Sanitisers

`-fsanitize=address` and `-fsanitize=undefined`, added to the compile command, build a version of your program that checks for entire categories of mistakes as it runs — invalid memory accesses, certain kinds of undefined behaviour — and stops with a detailed report the moment one occurs, rather than continuing silently on invalid ground. Most of what they catch, out-of-bounds array writes, use of memory that has already been freed, has not been covered yet; `Memory errors: leaks, dangling pointers, use-after-free` is where sanitisers earn their keep. Knowing they exist now is enough: reach for them the moment a bug looks like it might involve memory misbehaving rather than a value simply being wrong.

## 6. Forming a hypothesis and shrinking the failing input

Section 2 did not start by staring at `midpoint` until an answer appeared — it started from a specific expectation, `mid` should be `7`, checked that expectation against what the program actually did, and stopped as soon as the two disagreed. That is the entire method: state what you expect at some specific point, check it, and treat any place where expectation and reality diverge as the next place to look, not the whole program at once.

When a failure only shows up on a large or complicated input, the same discipline applies to the input itself: cut it down, a piece at a time, checking after each cut whether the failure still happens. An input you have shrunk as far as it will go while still triggering the bug is almost always faster to reason about than the original — often small enough that the cause is visible on inspection, with no debugger needed at all.

### Wrong model: a compiler warning that does not stop compilation can be safely ignored

**What is actually true:** `-Wall -Wextra`, part of every compile command in this book since `Building and running a C program`, exists precisely to report constructs that are legal C and frequently wrong anyway. A warning is not a lesser kind of error to defer; it is often the fastest hypothesis you will ever get handed for free, pointing at the exact line worth suspecting first, before you have written a single instrumentation `printf` or opened `gdb` at all.

### Wrong model: the first suspicious-looking line is the one causing the bug

**What is actually true:** `The machine model` already warned that a symptom can surface far from its cause. A value that looks wrong where you noticed it may have been computed correctly there and gone wrong earlier, or may be correct there and only look wrong because something downstream misuses it. Fixing the first line that looks off, without first confirming a hypothesis about where the actual divergence happens, risks changing something that was never broken while the real cause stays exactly where it was.

## Exercises

1. In section 1's error, what does the `note:` line add that the `error:` line alone does not?

2. In section 2, why does adding a `printf` inside `midpoint` narrow the search faster than adding one only in `main`, after the call?

3. Explain the `midpoint` bug in section 2 using the vocabulary of operator precedence from `Expressions, operators, and conditionals`.

4. What is the difference between what `step` does in a `gdb` session and what `print` does?

5. In section 4's stack trace, `midpoint` is listed above `main`. What does that ordering tell you about which function called which?

6. Why might a bug that only appears with a large, complicated input be easier to fix once you have found a smaller input that still triggers it?

7. A program compiles with zero warnings under `-Wall -Wextra` and still produces the wrong answer. Does that mean the warnings would not have helped? Why or why not, using section 2 as your example.

8. Explain why "the bug must be near the line where the wrong value was noticed" is not a safe assumption, referencing `The machine model`.

## Answers

1. The `note:` line points at the relevant declaration, `greet`'s prototype, showing exactly what the call was checked against and why it was found short one argument — information the `error:` line alone does not include.

2. A `printf` inside `midpoint` reports the value before the function has even returned, confirming or ruling out `midpoint` itself as the source of the problem directly. A `printf` only after the call, in `main`, can only tell you the final result was wrong, not which of potentially several functions produced that wrong value.

3. `mid = low + high / 2` is parsed as `low + (high / 2)`, because `/` has higher precedence than `+` and binds first, not `(low + high) / 2` as the intended midpoint formula requires. The bug is a precedence mistake, not an arithmetic one — every individual operator did exactly what it was supposed to.

4. `step` advances execution by one line and then pauses again — it changes what the program is doing. `print` reports a variable's current value without advancing execution at all — it only looks, changing nothing about the program's state.

5. It tells you `main` called `midpoint`, not the reverse — the most recently entered, still-active call is listed first, and each entry below it is the call that made the one above it, exactly matching the order calls actually nested in.

6. A smaller input has fewer moving parts to consider at once, which usually means fewer places the cause could be hiding; the same reasoning process that works on the full input works on the shrunk one, just with less to read and rule out each step.

7. No — it means this particular bug was not one `-Wall -Wextra` happens to detect. `low + high / 2` is entirely legal, unsuspicious-looking C from the compiler's point of view; not every mistake is a warnable pattern, which is exactly why printf instrumentation and gdb remain necessary alongside compiler warnings, not instead of them.

8. `The machine model` established that the CPU has no notion of intent — it just executes instructions in order, and a value computed incorrectly at one point can travel, unchanged, through several more lines before anything actually prints it or acts on it visibly. The place a wrong value is first *noticed* is wherever it happened to surface, which is not necessarily anywhere near wherever it was actually miscomputed.
