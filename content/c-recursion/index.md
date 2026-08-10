---
id: c-recursion
title: "Recursion"
track: c
---

# Recursion

`The stack and function calls` established that a function call pushes a new frame and a return pops it, and that frames stack up as calls nest — `inner` called from `outer` gets its own frame sitting on top of `outer`'s, undisturbed. Nothing in that mechanism cares whether the function being called is a *different* function or the *same* one currently running. A function that calls itself is called **recursive**, and everything about how it behaves falls out of `The stack and function calls`'s push-and-pop rules applied to that one case, plus `Proof by induction`'s reasoning applied to why it computes the right answer at all.

## 1. Base case and recursive case

```c file=factorial.c run
#include <stdio.h>

int factorial(int n)
{
    if (n == 0)
        return 1;
    return n * factorial(n - 1);
}

int main(void)
{
    printf("factorial(5) is %d\n", factorial(5));
    return 0;
}
```

```output
factorial(5) is 120
```

`factorial` has two cases. The **base case**, `n == 0`, returns a fixed answer directly, with no further recursive call — this is what eventually stops the recursion. The **recursive case**, every other `n`, computes the answer in terms of a call to `factorial` itself, on a strictly smaller argument, `n - 1`. Every recursive function needs both parts: a base case is what section 6 shows the consequence of omitting, and a recursive case that always moves toward the base case (here, `n - 1` moves toward `0`) is what guarantees the chain of calls actually ends rather than calling itself forever.

## 2. Trusting the recursive call

Reading `return n * factorial(n - 1);`, it is tempting to ask how `factorial(n - 1)` gets computed, and trace all the way down to the base case before believing the line above is correct. This is unnecessary, and `Proof by induction` already explained why: writing the recursive case is exactly writing an inductive step. Assume `factorial(n - 1)` correctly returns $(n-1)!$ — the recursive call's own inductive hypothesis — and check that `n * factorial(n - 1)` then correctly computes $n!$, using nothing but that assumption and the definition $n! = n \times (n-1)!$. It does, by that definition directly. Combined with the base case correctly returning $0! = 1$, `Proof by induction`'s own machinery — base case plus a step that carries correctness from one value to the next — proves `factorial(n)` correct for every $n \ge 0$, without ever needing to trace the full chain of calls down to `factorial(0)` by hand.

This is not a metaphor borrowed from induction; it is the same argument. `Proof by induction`'s section 2 addressed the objection that assuming $P(k)$ to prove $P(k+1)$ is circular, and the identical objection applies here in identical words — trusting `factorial(n-1)` to prove `factorial(n)` correct is not assuming what is being proved, because `factorial(n-1)` and `factorial(n)` are calls on different arguments, exactly as $P(k)$ and $P(k+1)$ are different propositions.

## 3. Frame-by-frame tracing

```c file=tracedfactorial.c run
#include <stdio.h>

int factorial(int n)
{
    printf("entering factorial(%d)\n", n);
    int result;
    if (n == 0) {
        result = 1;
    } else {
        result = n * factorial(n - 1);
    }
    printf("leaving factorial(%d), returning %d\n", n, result);
    return result;
}

int main(void)
{
    printf("factorial(3) is %d\n", factorial(3));
    return 0;
}
```

```output
entering factorial(3)
entering factorial(2)
entering factorial(1)
entering factorial(0)
leaving factorial(0), returning 1
leaving factorial(1), returning 1
leaving factorial(2), returning 2
leaving factorial(3), returning 6
factorial(3) is 6
```

Every call to `factorial`, including the recursive ones, pushes its own frame exactly as `The stack and function calls` described for calls to different functions — `factorial(3)`'s frame, `factorial(2)`'s frame, and so on down to `factorial(0)`'s are four separate frames, stacked on top of each other, each with its own copy of `n` and its own copy of `result`. The "entering" lines print in the order the calls are made, `3, 2, 1, 0`, going deeper; the "leaving" lines print in the reverse order, `0, 1, 2, 3`, as each frame's own `return` pops it and control unwinds back to the frame that called it — last pushed, first popped, precisely the rule `The stack and function calls` stated for any nested calls, recursive or not. `factorial(2)`'s `result` cannot be computed, and therefore cannot print, until `factorial(1)` has fully returned, because `result = n * factorial(n - 1);` needs that call's value before the multiplication can happen at all.

## 4. Fibonacci and binary recursion

```c file=fib.c run
#include <stdio.h>

int fib(int n)
{
    if (n == 0)
        return 0;
    if (n == 1)
        return 1;
    return fib(n - 1) + fib(n - 2);
}

int main(void)
{
    for (int i = 0; i <= 10; i++)
        printf("fib(%d) = %d\n", i, fib(i));
    return 0;
}
```

```output
fib(0) = 0
fib(1) = 1
fib(2) = 1
fib(3) = 2
fib(4) = 3
fib(5) = 5
fib(6) = 8
fib(7) = 13
fib(8) = 21
fib(9) = 34
fib(10) = 55
```

`fib` has two base cases, `n == 0` and `n == 1`, and one recursive case that calls itself *twice* — `fib(n - 1) + fib(n - 2)` — rather than once. This is **binary recursion**: each call, other than the base cases, spawns two further calls rather than one. `factorial`'s single self-call built a single, straight-line chain of frames, one directly on top of the next; `fib`'s two self-calls build a branching tree of frames instead — `fib(n)` calls `fib(n-1)`, which itself calls both `fib(n-2)` and `fib(n-3)`, and so on, each branch eventually bottoming out at its own base case independently of every other branch.

## 5. The exponential cost of naive Fibonacci

```c file=fibcount.c run
#include <stdio.h>

long calls = 0;

int fib(int n)
{
    calls++;
    if (n == 0)
        return 0;
    if (n == 1)
        return 1;
    return fib(n - 1) + fib(n - 2);
}

int main(void)
{
    for (int n = 10; n <= 30; n += 10) {
        calls = 0;
        int result = fib(n);
        printf("fib(%d) = %d, total calls = %ld\n", n, result, calls);
    }
    return 0;
}
```

```output
fib(10) = 55, total calls = 177
fib(20) = 6765, total calls = 21891
fib(30) = 832040, total calls = 2692537
```

`calls` counts every single invocation of `fib`, base cases included. Going from `fib(10)` to `fib(20)` — doubling $n$ — multiplies the call count by roughly $124$, not by $2$; going from `fib(20)` to `fib(30)` — the same fixed increase of $10$ this time, not a doubling — multiplies it by roughly another $123$. The call count is not growing in proportion to $n$; it is growing explosively with every fixed increase in $n$, because section 4's branching tree roughly doubles in size, layer by layer, for every one or two levels of depth added — the same value, `fib(n - 5)` for instance, gets recomputed from scratch by an enormous number of separate, unrelated branches of the tree, none of them aware that any other branch already computed it. This wasted, repeated recomputation, not the arithmetic itself, is what makes the naive version impractical for even moderately large $n$: `fib(30)`'s tree alone needs more than two and a half million calls to compute a single number that a `factorial`-style, single-chain approach would reach in $30$ steps.

## 6. Missing base case: stack overflow

```c nocompile
int broken(int n)
{
    return n * broken(n - 1);
}
```

Not run: this compiles cleanly — there is nothing syntactically wrong with a function that always calls itself — and calling `broken(5)` never reaches a base case, because there is not one. `n` counts down, `5, 4, 3, 2, 1, 0, -1, -2, \ldots`, without limit, and every one of those calls pushes another frame, exactly as section 3's correctly-terminating chain did, except this chain never starts popping frames back off, because no call ever returns without first making another call. `The stack and function calls` already named what happens when frames keep pushing without end: the stack has a fixed maximum size, and this exhausts it — a **stack overflow**, the concrete case that article deferred to this one. In practice this crashes the program, typically within a fraction of a second, since a modern stack fits on the order of tens of thousands to a few hundred thousand frames before running out, and `broken` burns through them with nothing else to do.

A missing base case is not the only way to cause this — a base case that exists but is never actually reached, such as checking `n == 0` in a function always called with even arguments that skip past zero due to a `n - 2` step landing on a negative number first, fails identically, for the identical reason: the chain of calls has no exit, regardless of whether a `return` for some case exists in the source code that never runs.

## Exercises

1. In section 1's `factorial`, what specifically stops the recursion from continuing forever, and what would happen if the base case checked `n == 1` instead of `n == 0`, called as `factorial(0)`?

2. Using section 2, explain why trusting `factorial(n - 1)`'s result without tracing it by hand is not circular reasoning, referencing `Proof by induction` directly.

3. In section 3's traced output, `leaving factorial(0), returning 1` prints before `leaving factorial(1), returning 1`. Explain why, in terms of which frame's `return` statement can execute first.

4. How many total calls does `fib(n)` make to itself and to `fib(n-2)`'s subtree, in terms of the branching structure described in section 4, compared to `factorial(n)`'s single chain of calls?

5. Using section 5's measured numbers, describe in one sentence how the call count grows as $n$ increases by a fixed amount, without claiming a specific multiplier such as "doubles every step."

6. Section 6 states that `broken(n)` crashes "in practice," not by any guarantee of the C language itself. What does `The stack and function calls` say determines exactly when the crash happens?

7. A student fixes `broken` by adding `if (n == 0) return 1;` but calls it as `broken(7)` where the recursive case is `n * broken(n - 3)`. Does this base case get reached? Explain, referencing section 6's second paragraph.

## Answers

1. The base case, `n == 0`, stops the recursion by returning `1` directly with no further call, and `n - 1` strictly decreases toward it on every recursive call, guaranteeing it is eventually reached from any non-negative starting `n`. If the base case instead checked `n == 1`, calling `factorial(0)` would recurse to `factorial(-1)`, `factorial(-2)`, and so on, never hitting `n == 1` since `n` only decreases past it — the same missing-base-case failure section 6 describes, reached through a base case that exists but is unreachable for this particular call.

2. `Proof by induction`'s section 2 established that assuming $P(k)$ to prove $P(k+1)$ is not circular, since they are different propositions about different values, and the inductive step is a conditional claim proved outright. Trusting `factorial(n-1)` while writing `factorial(n)`'s recursive case is the identical structure: `factorial(n-1)` and `factorial(n)` are calls on different arguments, and the recursive case only has to show "if `factorial(n-1)` is correct, then `n * factorial(n-1)` correctly computes `factorial(n)`" — a conditional, proved directly from what factorial means, not an assumption of the very fact being established.

3. `factorial(1)`'s `result` is computed by the line `result = n * factorial(n - 1);`, which cannot finish, and therefore cannot reach `factorial(1)`'s own "leaving" printf, until the call `factorial(0)` it makes has fully returned. `factorial(0)`'s frame is nearer the top of the stack, pushed later, and by the last-pushed-first-popped rule from `The stack and function calls`, it is popped — and its "leaving" line printed — before `factorial(1)`'s frame can finish and pop in turn.

4. `factorial(n)` makes exactly $n$ recursive calls, one per frame in a single straight chain. `fib(n)`'s branching structure makes each call (past the base cases) spawn two further calls, so the total number of calls grows much faster than a fixed multiple of $n$ — section 5 measured this directly, rather than deriving an exact count, since the qualitative shape of the growth, not a precise formula, is the point.

5. The call count grows dramatically faster than the increase in $n$ itself — a fixed increase in $n$ multiplies the total call count by a large factor each time, rather than adding a comparable, fixed amount, the signature of the branching tree described in section 4 getting far larger as it grows one or two levels deeper.

6. `The stack and function calls` states the stack has a fixed maximum size, decided before the program starts running; the crash happens once the total space used by every currently-pushed, not-yet-popped frame exceeds that fixed size. Exactly how many frames fit, and therefore exactly when the crash occurs, depends on the platform's chosen stack size and how large each individual frame is — details outside what the C language itself specifies.

7. No. Starting from `broken(7)` and subtracting `3` each call visits `7, 4, 1, -2, -5, \ldots` — `n` passes through `1` and then jumps straight to `-2`, skipping `0` entirely, since `1 - 3 = -2`. The base case `n == 0` exists in the source but is never reached by this particular sequence of calls, exactly the failure section 6 describes: a base case's mere presence in the code does not guarantee any given call chain actually arrives at it.
