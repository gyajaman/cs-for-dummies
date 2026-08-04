---
id: c-loops
title: "Loops and iteration"
track: c
---

# Loops and iteration

Every program up to this point has run each statement exactly once, in order. A loop is the first thing you have met that runs the same statements a variable number of times, and everything about a loop's behaviour — whether it runs at all, how many times, whether it ever stops — comes down to the same `int`-is-the-condition machinery from `Expressions, operators, and conditionals`, checked again and again.

## 1. while

```c file=while.c run
#include <stdio.h>

int main(void)
{
    int i = 1;
    int sum = 0;

    while (i <= 5) {
        sum = sum + i;
        i = i + 1;
    }

    printf("sum is %d\n", sum);
    return 0;
}
```

```output
sum is 15
```

`while (i <= 5)` checks the condition before every iteration, including the first. As long as it is non-zero, the body runs and the check happens again; the moment it is `0`, the loop ends and execution continues after the closing brace. Nothing here is new — this is exactly the `if` machinery from the previous article, just checked repeatedly instead of once.

## 2. for

```c file=for.c run
#include <stdio.h>

int main(void)
{
    int sum = 0;

    for (int i = 1; i <= 5; i++)
        sum = sum + i;

    printf("sum is %d\n", sum);
    return 0;
}
```

```output
sum is 15
```

`for` packages the same three pieces `while` needed — a starting point, a condition, and an update — into one line: `int i = 1` runs once, before anything else; `i <= 5` is checked before every iteration, exactly like `while`'s condition; `i++` runs after every iteration's body, before the condition is checked again. `i++` is shorthand for `i = i + 1`, the increment operator, and you will see it in almost every `for` loop's third clause. A `for` loop and the equivalent `while` loop compute identically; `for` just keeps the bookkeeping in one place instead of split across before-the-loop and the end-of-body.

## 3. do-while

```c file=dowhile.c run
#include <stdio.h>

int main(void)
{
    printf("while loop:\n");
    int i = 10;
    while (i < 5) {
        printf("i is %d\n", i);
        i = i + 1;
    }

    printf("do-while loop:\n");
    i = 10;
    do {
        printf("i is %d\n", i);
        i = i + 1;
    } while (i < 5);

    return 0;
}
```

```output
while loop:
do-while loop:
i is 10
```

Both loops start with `i` at `10` and share the condition `i < 5`, which is false from the very first check. `while` checks its condition before ever running the body, so with a false condition to start, the body never runs at all — nothing prints between the two headers. `do-while` checks its condition only after running the body, so the body runs exactly once regardless of the condition's starting value, printing `i is 10`, before the now-also-false condition stops a second iteration. `do-while` is the only loop in C that guarantees at least one execution of its body.

## 4. break and continue

```c file=breakcontinue.c run
#include <stdio.h>

int main(void)
{
    for (int i = 1; i <= 10; i++) {
        if (i % 2 == 0)
            continue;
        if (i > 7)
            break;
        printf("%d\n", i);
    }

    return 0;
}
```

```output
1
3
5
7
```

`continue` skips the rest of the current iteration's body and jumps straight to the loop's next check — here, the update `i++` and then the condition — without running the `printf`. `break` exits the loop immediately and completely, skipping every remaining iteration, not just the current one. Even values never reach the `printf` because `continue` diverts them first; the loop stops for good once `i` reaches `9`, an odd number greater than `7`, so `9` never prints either — it triggers `break` before its own `printf` would have run.

## 5. Off-by-one errors

```c file=offbyone.c run
#include <stdio.h>

int main(void)
{
    printf("using i < 5:\n");
    for (int i = 1; i < 5; i++)
        printf("%d\n", i);

    printf("using i <= 5:\n");
    for (int i = 1; i <= 5; i++)
        printf("%d\n", i);

    return 0;
}
```

```output
using i < 5:
1
2
3
4
using i <= 5:
1
2
3
4
5
```

Both loops compile without complaint and both run without crashing — an off-by-one error is a logic mistake, not a syntax mistake, and the compiler has no way to know which bound you meant. The first loop stops as soon as `i` reaches `5`, because `5 < 5` is false, so `5` itself is never printed. The fix is not "use `<=` instead of `<`" as a blanket rule — `<` is exactly correct when counting a number of items rather than counting up to an inclusive value — the fix is checking, every time, whether the boundary you wrote actually matches the boundary you meant.

### Wrong model: the loop bound in `i < n` and `i <= n` differ by an unimportant detail

**What is actually true:** they differ by exactly one iteration, and which one is correct depends entirely on what the loop is counting. `for (int i = 0; i < 5; i++)` runs `5` times, visiting `0, 1, 2, 3, 4` — correct for touching each of `5` things once. `for (int i = 1; i <= 5; i++)` also runs `5` times, visiting `1, 2, 3, 4, 5` — correct for counting from `1` up to and including `5`. Neither form is the generally safe one; picking the wrong one for what you are actually counting is precisely what an off-by-one error is.

## 6. Nested loops

```c file=nested.c run
#include <stdio.h>

int main(void)
{
    for (int row = 1; row <= 3; row++) {
        for (int col = 1; col <= 3; col++) {
            if (col > 1)
                printf(" ");
            printf("%d", row * col);
        }
        printf("\n");
    }

    return 0;
}
```

```output
1 2 3
2 4 6
3 6 9
```

The inner loop runs to completion — all three values of `col` — for every single value of `row`: once for `row == 1`, then again in full for `row == 2`, then again for `row == 3`. Nesting does not share iteration counts between the two loops; each `row` gets its own independent run of the entire inner loop.

```c file=innerbreak.c run
#include <stdio.h>

int main(void)
{
    for (int row = 1; row <= 3; row++) {
        for (int col = 1; col <= 3; col++) {
            if (col == 2)
                break;
            printf("row %d, col %d\n", row, col);
        }
    }

    return 0;
}
```

```output
row 1, col 1
row 2, col 1
row 3, col 1
```

### Wrong model: `break` inside a nested loop exits every enclosing loop

**What is actually true:** `break` exits only the single nearest loop — or `switch` — that directly contains it. Here, `break` fires when `col == 2` and stops the *inner* loop for that row, but the *outer* loop over `row` is completely unaffected and continues to `row = 2` and `row = 3`, each running the inner loop again from `col = 1`. If `break` exited both loops, this program would print exactly one line, `row 1, col 1`, and stop. It prints three.

## 7. Termination and non-termination

Every loop in this article stops because something inside it eventually makes the condition false: `i` climbs past a bound, or a fixed number of iterations runs out. A loop is only as safe as that guarantee.

```c nocompile
while (1) {
    printf("looping forever\n");
}
```

`1` is always non-zero, so this condition is never going to become false on its own — nothing inside the loop changes it, and nothing needs to. Loops written this way are not automatically wrong; a program that waits for events in a loop that only `break`s when one arrives is a completely ordinary pattern. What makes a loop like this dangerous is writing it *without* any `break`, or writing a bounded-looking loop where the update to the loop variable was forgotten, or where the condition was mistyped so that it can never actually become false. The machine will not notice for you; it will simply keep fetching, decoding, and executing the loop's instructions, exactly as `The machine model` described, for as long as you let it.

## Exercises

1. Trace the program in section 1. If the condition were changed from `i <= 5` to `i < 5`, what would `sum` be instead of `15`, and why?

2. Identify which part of the `for` loop in section 2 corresponds to which of the `while` loop's three separate pieces in section 1: initialisation, condition, and update.

3. In section 3, why does `do-while loop:` appear immediately followed by `i is 10`, with nothing printed between `while loop:` and `do-while loop:`?

4. In section 4, explain why `8` never appears in the output, being specific about which mechanism, `continue` or `break`, is responsible.

5. The buggy loop in section 5 uses `i < 5` starting from `i = 1`. Give two different one-character edits that would each independently make it print all five numbers.

6. In the nested-loop example under the misconception in section 6, predict the full output if `break` were changed to `continue`.

7. Why is `while (1) { ... }` with no `break` anywhere inside considered dangerous, even though it is completely legal C?

8. A student claims a `for` loop and a `while` loop can never do exactly the same thing, since `for` has three parts and `while` only has one. Is the student correct? Justify your answer using sections 1 and 2.

## Answers

1. `sum` would be `10`. The loop stops as soon as `i` reaches `5`, because `5 < 5` is false, so `5` is never added — only `1 + 2 + 3 + 4`.

2. `int i = 1` corresponds to the initialisation that appears before `while` in section 1. `i <= 5` corresponds directly to `while`'s condition. `i++` corresponds to `i = i + 1`, the update statement at the end of the `while` loop's body.

3. `while`'s condition, `i < 5`, is checked before the body ever runs; with `i` starting at `10`, it is false immediately, so the body never executes and nothing prints. `do-while` checks its condition only after running the body once, so with the same starting value it runs exactly once regardless, printing `i is 10`, before the also-false condition stops it from running again.

4. `8` is even, so `continue` sends execution straight to the next iteration before its `printf` can run — it is filtered out for being even, not because the loop had already stopped. The loop does stop soon after, at `i = 9`, once `i > 7` becomes true and `break` exits, but that happens on a later iteration than the one that skipped `8`.

5. Change `i < 5` to `i <= 5`, fixing the comparison; or change `i < 5` to `i < 6`, fixing the bound while leaving `<` as it is. Either alone is sufficient.

6. With `continue` instead of `break`, each row would print two lines instead of one — `col 1` and `col 3`, skipping only `col 2` — giving six lines total: `row 1, col 1`, `row 1, col 3`, `row 2, col 1`, `row 2, col 3`, `row 3, col 1`, `row 3, col 3`.

7. Nothing inside the loop can ever make its condition false — `1` is always non-zero — so the loop runs forever unless something outside ordinary control flow, such as a crash or an external interrupt, stops it. A loop's termination has to come from the loop itself, and this one has no mechanism for that at all.

8. The student is not correct. `while`'s "one part" is only the condition written after the keyword; nothing stops a programmer from writing initialisation before the loop and an update at the end of its body, exactly as section 1 does. A `for` loop's three clauses make those same three pieces explicit in one line rather than requiring them to be found elsewhere; the identical sums in sections 1 and 2 show the two forms computing exactly the same thing.
