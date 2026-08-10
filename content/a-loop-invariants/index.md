---
id: a-loop-invariants
title: "Loop invariants and correctness"
track: algo
---

# Loop invariants and correctness

`Loops and iteration` showed *what* a `while` or `for` loop does, mechanically: check a condition, run a body, check again. It never asked *why* running one actually computes the thing you meant it to compute. A **loop invariant** answers that question, using exactly the machinery `Proof by induction` already built: a statement, true before every iteration, checked with a base case and a step, that pins down what the loop has accomplished so far at every point along the way — including, critically, the point where it stops.

## 1. What an invariant is

A loop invariant is a statement $I$, parameterised by however far the loop has progressed, that is true immediately before every single iteration begins — including the very first, before the loop has done anything, and including the moment the loop's condition finally fails and it exits. It is not a description of what the loop is trying to achieve overall; it is a statement weak enough to be checkable at every intermediate stage, strong enough that, combined with the fact the loop has stopped, it pins down exactly what has been achieved.

## 2. Initialisation, maintenance, termination

Proving a loop correct with an invariant has the identical three-part shape as `Proof by induction`, with the parts renamed for a loop's own vocabulary:

- **Initialisation:** $I$ holds before the loop's first iteration. This is the base case.
- **Maintenance:** if $I$ holds before some iteration and that iteration's body runs, $I$ still holds before the next iteration. This is the inductive step — assuming $I$ at one point to prove $I$ at the next, exactly as `Proof by induction`'s section 2 defended against the charge of circularity, now applied to a loop's iterations instead of the natural numbers.
- **Termination:** the loop eventually stops — its guard condition eventually becomes false — and at that point, $I$ together with the now-false guard together say something useful about the finished computation.

Initialisation and maintenance alone only establish that $I$ holds *whenever* the loop is about to run another iteration, or has just stopped; they say nothing about *whether* it stops at all.

### Wrong model: Initialisation and maintenance are enough to prove a loop correct

**What is actually true:** `Loops and iteration`'s own section 7 already showed a loop whose guard is never made false, `while (1) { ... }` — initialisation and maintenance can both hold perfectly well for such a loop's invariant, and the loop still never produces a usable result, because it never reaches the point where the invariant and the finished guard combine into a conclusion. A correctness proof needs a separate termination argument — typically, some quantity that strictly decreases every iteration and cannot decrease forever, such as a loop counter climbing toward a fixed bound — showing the loop's guard is guaranteed to fail eventually. Initialisation and maintenance describe what is true *if* the loop reaches a given point; termination is what guarantees it reaches any point worth talking about at all.

## 3. Worked proof: summing an array

```c file=suminvariant.c run
#include <stdio.h>

int sum_array(int *a, int n)
{
    int sum = 0;
    for (int i = 0; i < n; i++)
        sum = sum + a[i];
    return sum;
}

int main(void)
{
    int a[5] = {10, 20, 30, 40, 50};
    printf("sum is %d\n", sum_array(a, 5));
    return 0;
}
```

```output
sum is 150
```

Claim: immediately before the iteration with loop variable $i$, `sum` equals $a[0] + a[1] + \cdots + a[i-1]$ — the sum of every element strictly before index $i$. Call this $I(i)$.

**Initialisation:** before the first iteration, $i = 0$ and `sum = 0`. $I(0)$ claims `sum` equals the sum of the first zero elements — nothing at all — which is $0$, since adding together no numbers leaves the running total unchanged from whatever it started at. Matches.

**Maintenance:** assume $I(i)$ holds for some arbitrary $i$ with $0 \le i < n$ — `sum` equals $a[0] + \cdots + a[i-1]$ — and the loop body runs. `sum = sum + a[i];` makes `sum` equal $\left(a[0] + \cdots + a[i-1]\right) + a[i] = a[0] + \cdots + a[i]$. `i++` then advances the loop variable to $i+1$. So immediately before the next iteration, `sum` equals $a[0] + \cdots + a[i] = a[0] + \cdots + a[(i+1)-1]$ — exactly $I(i+1)$.

**Termination:** `i` starts at $0$ and increases by exactly $1$ every iteration, so it takes every value $0, 1, 2, \ldots$ in order and the guard `i < n` fails for the first time exactly when $i = n$ — the loop runs exactly $n$ times and stops. At that point, $I(n)$ holds: `sum` equals $a[0] + a[1] + \cdots + a[n-1]$, the sum of the entire array — the function's postcondition, proved rather than merely observed to match one example's output.

## 4. Worked proof: finding the maximum

```c file=maxinvariant.c run
#include <stdio.h>

int max_array(int *a, int n)
{
    int max = a[0];
    for (int i = 1; i < n; i++)
        if (a[i] > max)
            max = a[i];
    return max;
}

int main(void)
{
    int a[5] = {30, 10, 50, 20, 40};
    printf("max is %d\n", max_array(a, 5));
    return 0;
}
```

```output
max is 50
```

Claim: immediately before the iteration with loop variable $i$, `max` equals the largest value among $a[0], \ldots, a[i-1]$. Call this $I(i)$; assume $n \ge 1$, so `a[0]` is a valid read.

**Initialisation:** the loop starts at $i = 1$, after `max = a[0];` has already run. $I(1)$ claims `max` equals the largest of $a[0], \ldots, a[0]$ — just $a[0]$ itself — which is exactly what was assigned. Matches.

**Maintenance:** assume $I(i)$ holds for arbitrary $i$ with $1 \le i < n$ — `max` is the largest of $a[0..i-1]$ — and the loop body runs. The `if` compares `a[i]` against `max`: if `a[i] > max`, `max` is updated to `a[i]`, making it the largest of $a[0..i-1]$ and $a[i]$ together — the largest of $a[0..i]$; if not, `max` was already at least as large as `a[i]`, so it remains the largest of $a[0..i]$ regardless. Either branch leaves `max` as the largest of $a[0..i]$, and `i++` advances the loop variable, giving exactly $I(i+1)$.

**Termination:** identical reasoning to section 3 — `i` climbs from $1$ to $n$ in unit steps, the guard fails first at $i = n$, and $I(n)$ holds at that point: `max` is the largest of $a[0], \ldots, a[n-1]$, the whole array.

## 5. Deriving the postcondition from the invariant and the negated guard

Sections 3 and 4 both ended the same way: substitute the loop's final value of its counter into $I$, and the result is the **postcondition** — the guaranteed property of the program's state once the loop has finished. The general pattern is always the same two ingredients combined: the invariant $I(i)$, true no matter which iteration the loop happens to be at, and the fact that the loop's guard is false at the moment it stops, which pins down the *specific* value of $i$ that $I$ has to be evaluated at. Neither ingredient alone is enough — $I(i)$ for an unknown $i$ says nothing specific, and "the guard is false" without an invariant says nothing about what the loop actually computed while it ran — but together, $I(i_{\text{final}}) \land \lnot(\text{guard at } i_{\text{final}})$ is a single, specific, proved fact about the finished computation.

## 6. Insertion sort's inner loop

```c file=insertinvariant.c run
#include <stdio.h>

void print_array(int *a, int n)
{
    for (int k = 0; k < n; k++)
        printf("%d ", a[k]);
    printf("\n");
}

int main(void)
{
    int a[5] = {2, 4, 5, 6, 3};
    int i = 4;
    int key = a[i];
    int j = i - 1;

    printf("before: ");
    print_array(a, 5);

    while (j >= 0 && a[j] > key) {
        a[j + 1] = a[j];
        j--;
        printf("j is now %d, array: ", j);
        print_array(a, 5);
    }
    a[j + 1] = key;

    printf("after:  ");
    print_array(a, 5);
    return 0;
}
```

```output
before: 2 4 5 6 3 
j is now 2, array: 2 4 5 6 6 
j is now 1, array: 2 4 5 5 6 
j is now 0, array: 2 4 4 5 6 
after:  2 3 4 5 6 
```

Given a sorted prefix `a[0..i-1]` and `key = a[i]`, this loop shifts every element of the prefix greater than `key` one position to the right, opening a gap for `key` to land in once the shifting stops — one pass of insertion sort's inner step, sliding a value left until it reaches the point where everything to its left is no larger. Let $v_0, \ldots, v_{i-1}$ denote the prefix's values as they stood the instant before this loop began (`2, 4, 5, 6`, with `key = 3` saved separately, in the run above).

Claim: immediately before the iteration with loop variable $j$, three things hold simultaneously: $a[k] = v_k$ for every $k \le j$ (the untouched left portion); $a[k+1] = v_k$ for every $k$ with $j < k < i$ (the right portion, each value shifted one slot right of where it started); and every one of $v_{j+1}, \ldots, v_{i-1}$ is greater than `key`. Call this $I(j)$.

**Initialisation:** before the first iteration, $j = i - 1$. The shifted-right clause, $j < k < i$, has no integer $k$ satisfying it — an empty condition, vacuously true, since nothing has been shifted yet. The untouched clause, $a[k] = v_k$ for $k \le i-1$, holds trivially: nothing has changed. The "greater than key" clause is vacuous too, over the same empty range. $I(i-1)$ holds with nothing yet to check.

**Maintenance:** assume $I(j)$ holds for some arbitrary $j \ge 0$ with `a[j] > key`, which is exactly the condition the `while` guard just confirmed to still be true. The body runs `a[j+1] = a[j];`, moving $v_j$ (by the untouched-clause part of $I(j)$, `a[j]` still holds $v_j$ at this point) into position $j+1$; then `j--` decreases the loop variable to $j - 1$. Re-check the three clauses at the new value, $j - 1$: positions $k \le j - 1$ are untouched by this iteration's single write to `a[j+1]`, so the untouched clause still holds; the shifted clause now needs to cover $k$ with $j - 1 < k < i$, which is the previous range plus $k = j$ itself, and $a[j+1]$ was just set to $v_j$, extending the shifted correspondence by exactly one; and $v_j$ is greater than `key` precisely because the loop's guard, `a[j] > key`, checked `a[j] = v_j` (by the untouched clause) before running the body. All three clauses hold at $j - 1$, giving $I(j-1)$.

**Termination:** $j$ starts at $i - 1$ and strictly decreases by $1$ every iteration, so it eventually either drops below $0$ or lands on an index where `a[j] > key` is false — the guard `j >= 0 && a[j] > key` fails at whichever comes first. At that final $j$, $I(j)$'s shifted clause says every value greater than `key` in the original prefix has been moved one slot right, and its untouched clause says `a[j]`, if $j \ge 0$, still holds a value that is *not* greater than `key` (or $j$ has gone negative, meaning nothing in the prefix was). `a[j + 1] = key;`, run once after the loop exits, places `key` into exactly the gap the shifting opened — the one slot not claimed by either clause — completing a sorted arrangement of the original `i + 1` values.

### Wrong model: The invariant has to hold at every line inside the loop body, not just between iterations

**What is actually true:** Every invariant in this article is stated as holding *immediately before* an iteration begins — a specific point in time, not a claim about every intermediate statement executed while the body is running. Section 3's `sum = sum + a[i];` genuinely, if momentarily, leaves `sum` matching neither $I(i)$ nor $I(i+1)$ exactly during the instant between that assignment and the following `i++` — `sum` has already advanced but `i` has not yet — and this is not a bug in the invariant; the invariant was never claimed to hold there. It only has to hold at iteration boundaries, which is exactly the set of points sections 3, 4, and 6's initialisation-maintenance-termination arguments actually check.

## Exercises

1. State, in your own words, what section 3's invariant $I(i)$ claims when $i = 3$ for the array `{10, 20, 30, 40, 50}`, and verify it directly by computing both sides.

2. Using section 4's invariant, explain why the loop in `max_array` starts at `i = 1` rather than `i = 0`, referencing what `max` is initialised to before the loop begins.

3. `Loops and iteration`'s off-by-one section showed `for (int i = 1; i < 5; i++)` and `for (int i = 1; i <= 5; i++)` producing different results. Using section 5, explain how an incorrect loop bound would show up as a mismatch between the *intended* postcondition and the one actually derivable from the invariant and negated guard.

4. In section 6's trace, after the iteration where `j` becomes `1`, state the concrete values of $a[0], a[1], a[2], a[3], a[4]$ that $I(1)$'s three clauses predict, and check them against the printed array.

5. Why is the "greater than key" clause needed at all in section 6's invariant — what would go wrong with the proof of correctness (not the code itself) if it were dropped?

6. A student writes a loop intended to count down from `n` to `1` but forgets to decrement the loop variable, so the guard never becomes false. Using section 2's wrong-model box, explain what specifically fails in a correctness argument for this loop, even if a plausible invariant can be stated and its maintenance step proved.

7. Explain, using the wrong-model box in section 6, why claiming `sum` equals $a[0] + \cdots + a[i]$ (rather than $a[0] + \cdots + a[i-1]$) partway through the loop body's execution, after `sum = sum + a[i];` has run but before `i++` has, does not contradict section 3's proof.

## Answers

1. $I(3)$ claims that immediately before the iteration with $i = 3$, `sum` equals $a[0] + a[1] + a[2] = 10 + 20 + 30 = 60$. Tracing the loop by hand confirms `sum` is indeed `60` at that point, having accumulated the first three elements over the first three iterations.

2. `max` is initialised to `a[0]` before the loop runs at all, so $I(1)$ — "`max` is the largest of $a[0..0]$" — already holds the instant the loop starts, with no iteration needed to establish it. Starting the loop at `i = 0` would redundantly compare `a[0]` against itself and would break the invariant's clean base case, since $I(0)$ would have to describe `max` as the largest of an empty range, which `a[0]`'s actual, already-assigned value does not represent.

3. An incorrect bound changes which value of the loop counter the guard actually fails at, so section 5's substitution, $I(i_{\text{final}})$, evaluates the invariant at the wrong $i_{\text{final}}$ — for instance, `i < n` stopping one iteration early evaluates $I(n-1)$ instead of $I(n)$, producing a proved postcondition ("`sum` equals $a[0] + \cdots + a[n-2]$") that is a true fact about the loop but not the one intended ("summed the whole array"). The invariant and maintenance step can be entirely correct while still proving the wrong postcondition, because termination determined the wrong stopping value of $i$.

4. $I(1)$'s untouched clause predicts $a[0] = v_0 = 2$ and $a[1] = v_1 = 4$ (both $k \le 1$). Its shifted clause, for $k$ with $1 < k < 4$, i.e. $k = 2, 3$, predicts $a[3] = v_2 = 5$ and $a[4] = v_3 = 6$. This leaves $a[2]$ unconstrained by either clause. The printed array at that point is `2 4 5 5 6`: $a[0]=2$, $a[1]=4$ match the untouched clause; $a[3]=5=v_2$, $a[4]=6=v_3$ match the shifted clause; $a[2] = 4$ is the one position neither clause commits to, consistent with it being unconstrained.

5. Without that clause, the maintenance step could no longer justify why the loop is entitled to keep shifting — the guard `a[j] > key` is what the code actually checks, but the *proof* uses "every shifted value is greater than key" to eventually conclude, once the loop stops, that `key` belongs to the left of everything shifted and to the right of whatever stopped the loop. Dropping the clause would still leave the shifting mechanics correctly described, but the proof would no longer establish that the final arrangement is actually sorted with respect to `key` — only that values got moved, not that they ended up in the right order.

6. A plausible invariant's initialisation and maintenance could both be proved exactly as in sections 3, 4, and 6 — maintenance only requires that *if* another iteration runs, the invariant still holds afterward, which forgetting to decrement does not disturb. What fails is termination: the guard never becomes false, so there is no point at which the invariant and the negated guard can be combined into a postcondition, exactly as section 2's wrong-model box describes for `while (1) { ... }` — the loop's partial correctness might be provable while the loop itself never finishes to make that correctness observable.

7. Section 6's wrong-model box states the invariant is only claimed to hold at iteration boundaries — immediately before an iteration begins — not at arbitrary points mid-body. The moment described, after `sum = sum + a[i];` but before `i++`, is exactly such a mid-body point, one section 3's proof never claims anything about. Once `i++` runs and the next iteration boundary is reached, the invariant $I(i+1)$ does hold again, exactly as the maintenance step proved; the intermediate mismatch during the body's execution was never part of what was being claimed.
