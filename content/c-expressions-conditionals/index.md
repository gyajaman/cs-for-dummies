---
id: c-expressions-conditionals
title: "Expressions, operators, and conditionals"
track: c
---

# Expressions, operators, and conditionals

Every variable so far has just sat there holding a value. This article is where programs start making decisions from those values: computing with them, comparing them, and choosing what to do next based on the result. All of it rests on one fact you will use constantly: in C, a condition is not a special kind of thing. It is an ordinary `int`, and its truth is entirely a question of whether that `int` is zero.

## 1. Arithmetic operators

```c file=arithmetic.c run
#include <stdio.h>

int main(void)
{
    int a = 17;
    int b = 5;

    printf("%d + %d = %d\n", a, b, a + b);
    printf("%d - %d = %d\n", a, b, a - b);
    printf("%d * %d = %d\n", a, b, a * b);
    printf("%d / %d = %d\n", a, b, a / b);
    printf("%d %% %d = %d\n", a, b, a % b);

    return 0;
}
```

```output
17 + 5 = 22
17 - 5 = 12
17 * 5 = 85
17 / 5 = 3
17 % 5 = 2
```

`+`, `-`, `*` behave as expected. `%%` in the format string is how you print a literal `%` character; it has nothing to do with the `%` operator in the code itself, which is remainder.

## 2. Integer division and modulo

`17 / 5` printed `3`, not `3.4`. When both operands of `/` are integers, C performs **integer division**: it computes how many whole times the divisor goes into the dividend and discards the rest — it does not round, and it does not produce a fractional answer, because the result has to be an `int`, and an `int` cannot hold a fraction. `%`, remainder, gives you exactly the part that got discarded: `17 = 5 * 3 + 2`.

With a negative operand, the remainder takes the sign of the dividend — `-7 % 2` is `-1`, not `1`. The precise rule, and why it was chosen, is closer to `Integer representation, fixed width, and overflow` than to this article; the fact worth keeping here is narrower: do not assume `%` always returns something non-negative.

### Wrong model: `/` between two `int`s gives the exact mathematical answer

**What is actually true:** `17 / 5` is `3`, full stop — not `3.4`, not `3.4` rounded to `3`, just `3`, because integer division throws away any remainder as a matter of definition, before the result is ever considered for rounding. The value `3.4` never exists anywhere in the computation. Getting a fractional result out of division requires at least one operand to not be an integer type, which is a question about type conversion this article does not cover.

## 3. Relational and logical operators, and truth as zero versus non-zero

```c file=relational.c run
#include <stdio.h>

int main(void)
{
    int a = 5;
    int b = 10;

    printf("a < b is %d\n", a < b);
    printf("a > b is %d\n", a > b);
    printf("a == b is %d\n", a == b);
    printf("a < b && b < 20 is %d\n", a < b && b < 20);
    printf("a < b || b > 100 is %d\n", a < b || b > 100);
    printf("!(a == b) is %d\n", !(a == b));

    return 0;
}
```

```output
a < b is 1
a > b is 0
a == b is 0
a < b && b < 20 is 1
a < b || b > 100 is 1
!(a == b) is 1
```

`<`, `>`, `<=`, `>=`, `==`, `!=` are the relational operators; `&&`, `||`, `!` are the logical ones, meaning and, or, and not. Printing them with `%d` makes the point directly: every one of these expressions *is* an `int`, with value `1` for true and `0` for false. Nothing distinguishes a "boolean" from any other integer in C — there is no separate true/false type in play here. This is what `if`, in section 5, actually tests: not some special condition-shaped thing, just whether an `int` happens to be zero or not.

## 4. Precedence

Operators combine following a fixed precedence, the same idea as in ordinary arithmetic: `*` and `/` bind tighter than `+` and `-`, which in turn bind tighter than the relational operators, which bind tighter than `&&`, which binds tighter than `||`. This is why `a < b && b < 20` above did not need parentheses around `a < b` — the comparison happens first regardless. It is still good practice to parenthesize a condition once it involves more than two operators, not because C will misread it, but because a reader should not have to recite the precedence table to check.

## 5. if, else, else-if

```c file=grade.c run
#include <stdio.h>

int main(void)
{
    int score = 82;

    if (score >= 90)
        printf("A\n");
    else if (score >= 80)
        printf("B\n");
    else if (score >= 70)
        printf("C\n");
    else
        printf("F\n");

    return 0;
}
```

```output
B
```

Each condition is tried in order, top to bottom, and the first one whose `int` value is non-zero runs its branch; every later `else if` and the final `else` are skipped entirely once a match is found. `else if` is not a separate keyword — it is an `else` whose body happens to be another `if` statement, chained as far as you like.

## 6. switch

```c file=switch.c run
#include <stdio.h>

int main(void)
{
    int day = 6;

    switch (day) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
            printf("weekday\n");
            break;
        case 6:
        case 7:
            printf("weekend\n");
            break;
        default:
            printf("not a valid day\n");
            break;
    }

    return 0;
}
```

```output
weekend
```

`switch` compares `day` against each `case` label and jumps to the first one that matches. Stacking labels with nothing between them, as `case 6:` and `case 7:` are here, is the standard way to give several values the same body — execution falls from `case 6:` straight into `case 7:`'s code because there is no `break` between the labels themselves, only between complete bodies. `default` runs when nothing else matched; it does not have to be last, but writing it last reads best.

The `break` at the end of each body matters more than it looks. Leave one out after a case that actually contains code, and execution keeps going into the next case's body regardless of whether its label matched — a real fallthrough, not the harmless label-stacking above. `-Wextra`, part of every compile command in this book, usually catches exactly this mistake and refuses to stay quiet about it.

## 7. Short-circuit evaluation

`&&` and `||` do not always evaluate both sides. `a && b` evaluates `a` first, and if `a` is `0`, stops immediately without ever evaluating `b` — the whole expression must be `0` regardless of what `b` is, so there is no need to. `a || b` works the same way in reverse: if `a` is non-zero, the expression must be non-zero, and `b` is skipped.

This is not just an optimisation. It is routinely load-bearing:

```c file=guard.c run
#include <stdio.h>

int main(void)
{
    int a = 0;
    if (a != 0 && 10 / a > 1)
        printf("a: reached the division\n");
    else
        printf("a is zero, division skipped\n");

    int b = 5;
    if (b != 0 && 10 / b > 1)
        printf("b: division result was greater than 1\n");
    else
        printf("b: division result was not greater than 1\n");

    return 0;
}
```

```output
a is zero, division skipped
b: division result was greater than 1
```

`10 / a` would be division by zero — undefined behaviour — if it ever ran with `a` equal to `0`. It never does: `a != 0` is `0` in that case, so short-circuiting guarantees `10 / a` is never evaluated at all. This pattern, a safety check written as the left-hand side of `&&`, is the reason short-circuit evaluation is a rule of the language and not just an implementation detail — code is allowed to depend on it.

## 8. The assignment-in-condition error

```c nocompile
if (x = 5)
{
    printf("this always runs\n");
}
```

This is not excluded here because it fails to compile — it does not. It is excluded because it is legal C that does something other than what it looks like it does, and there is no well-defined output worth checking: `x`'s prior value, and the fact that it gets silently overwritten, are the entire point.

### Wrong model: `if (x = 5)` tests whether `x` equals `5`

**What is actually true:** `=` is assignment, not comparison, and an assignment is itself an expression — it evaluates to the value that was just assigned. `if (x = 5)` sets `x` to `5`, unconditionally, as a side effect of evaluating the condition, and then tests whether `5` is non-zero, which it always is. The branch runs on every single execution, regardless of what `x` held beforehand, and `x`'s old value is gone. The comparison you almost certainly meant is `==`, two characters, not one. Compilers commonly warn about exactly this — one more reason this book always compiles with `-Wall -Wextra`.

## Exercises

1. What does `9 / 4` evaluate to in C, and what does `9 % 4` evaluate to? Explain both from the same underlying fact.

2. Why does `printf("%d\n", 3 < 5);` print `1` rather than the word `true`?

3. Rewrite the grade-classifying program in section 5 so that a `score` of `95` prints `A`. Trace through which conditions are tested and which are skipped.

4. In the `switch` example, what would change if the `break` after `printf("weekday\n");` were removed, and `day` were `3`? Describe the output.

5. Explain, using the vocabulary of short-circuit evaluation, why `n != 0 && 10 / n > 1` is safe for any value of `n`, while `10 / n > 1 && n != 0` is not.

6. A student writes `if (count = 0)` intending to check whether `count` is zero. Name two things wrong with the resulting program's behaviour, not just one.

7. Precedence lets `a < b && b < 20` be written without parentheses. Add parentheses to that expression that make the grouping explicit without changing what it computes.

8. What is `-9 % 4` in C? What general rule about the sign of `%`'s result does that follow?

## Answers

1. `9 / 4` is `2`: integer division discards the remainder rather than rounding. `9 % 4` is `1`: the part that division discarded, satisfying `9 = 4 * 2 + 1`.

2. `3 < 5` is an ordinary `int` expression whose value is `1`, because it is true; `%d` prints that `int` in decimal. C has no separate boolean type or "true" literal in play here — `1` is the true value, not a stand-in for it.

3. Changing `score` to `95`: `score >= 90` is now true, so the first branch runs and prints `A`; every `else if` and the final `else` are skipped, exactly as when `82` matched the second condition and skipped everything after it.

4. With `day` equal to `3` and the `break` removed after `weekday`, execution would match `case 3:`, print `weekday`, and then — with no `break` — fall straight through into the `weekend` case's code and print `weekend` too, before finally hitting that case's `break`. Both lines would print.

5. In `n != 0 && 10 / n > 1`, `n != 0` is evaluated first; when it is false, short-circuiting skips `10 / n` entirely, so division by zero never happens. In `10 / n > 1 && n != 0`, the division is the left operand and is evaluated first, unconditionally — if `n` is `0`, the division by zero already happened before the `!= 0` check ever runs.

6. First, it does not check whether `count` is zero at all — it sets `count` to `0` and then tests that `0`, which is always false, so the branch never runs, regardless of what `count` held before. Second, `count`'s previous value has been silently destroyed by the assignment.

7. `(a < b) && (b < 20)`. The parentheses make explicit what precedence already does implicitly: each relational comparison is a complete `int` expression before `&&` ever looks at it.

8. `-9 % 4` is `-1`. The result of `%` in C takes the sign of the dividend (the left operand) — here, negative — regardless of the sign of the divisor.
