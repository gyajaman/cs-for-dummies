---
id: a-searching
title: "Linear search and binary search"
track: algo
---

# Linear search and binary search

`Counting operations: analysing iterative algorithms` already built and measured `linear_search`, finding a target by checking every element in turn until one matches or the array runs out. This article names that algorithm properly, proves it and a second, much faster one correct with `Loop invariants and correctness`'s method, and shows exactly what extra assumption the faster one depends on.

## 1. Linear search and its linear cost

```c file=linsearch.c run
#include <stdio.h>

int linear_search(int *a, int n, int target)
{
    for (int i = 0; i < n; i++)
        if (a[i] == target)
            return i;
    return -1;
}

int main(void)
{
    int a[6] = {40, 10, 30, 20, 60, 50};
    printf("search for 20: index %d\n", linear_search(a, 6, 20));
    printf("search for 99: index %d\n", linear_search(a, 6, 99));
    return 0;
}
```

```output
search for 20: index 3
search for 99: index -1
```

**Linear search** checks elements one at a time, in whatever order they happen to sit in the array, stopping the instant a match is found or the array is exhausted. It makes no assumption about the array's contents at all — it works identically on a shuffled array, as above, or a sorted one — and `Counting operations: analysing iterative algorithms`'s section 4 already established its cost: $\Theta(1)$ best case, $\Theta(n)$ worst case, found there by counting comparisons directly. Nothing about linear search's own logic could ever do better than checking every element in the worst case, since without any structure to exploit, ruling out an element tells you nothing about any other element.

## 2. Binary search on a sorted array

```c file=binsearch.c run
#include <stdio.h>

int binary_search(int *a, int n, int target)
{
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target)
            return mid;
        else if (a[mid] < target)
            lo = mid + 1;
        else
            hi = mid - 1;
    }
    return -1;
}

int main(void)
{
    int a[10] = {2, 5, 8, 12, 16, 23, 38, 45, 56, 72};

    printf("search for 23: index %d\n", binary_search(a, 10, 23));
    printf("search for 2: index %d\n", binary_search(a, 10, 2));
    printf("search for 72: index %d\n", binary_search(a, 10, 72));
    printf("search for 100: index %d\n", binary_search(a, 10, 100));

    return 0;
}
```

```output
search for 23: index 5
search for 2: index 0
search for 72: index 9
search for 100: index -1
```

**Binary search** requires the array to already be sorted — its entire mechanism depends on it — and in exchange, rules out roughly half the remaining candidates with every single comparison. `lo` and `hi` bracket the range still possibly containing `target`; each iteration checks the midpoint, `a[mid]`. A match returns immediately. If `a[mid]` is too small, `target`, if present, must be strictly to the right, so `lo` moves past `mid`; if `a[mid]` is too large, `target` must be strictly to the left, so `hi` moves before `mid` — either way, the bracket shrinks by roughly half.

## 3. The invariant

Claim: at the top of every iteration, if `target` occurs anywhere in `a`, it occurs at some index within `a[lo..hi]`. Call this $I(\text{lo}, \text{hi})$.

**Initialisation:** before the first iteration, `lo = 0` and `hi = n - 1` — the entire array. If `target` occurs anywhere in `a` at all, it trivially occurs somewhere within all of `a[0..n-1]`.

**Maintenance:** assume $I(\text{lo}, \text{hi})$ holds for the current iteration, and the loop body runs. If `a[mid] == target`, the function returns `mid` directly — correct, since `target` was found. If `a[mid] < target`: because `a` is sorted, every index from `lo` to `mid` holds a value at most `a[mid]`, hence strictly less than `target` — `target` cannot be at any of those indices, so if it occurs at all, it occurs in `a[mid+1..hi]`, exactly the new bracket `lo = mid + 1` establishes. If `a[mid] > target`, symmetric reasoning rules out `mid` through `hi`, leaving `a[lo..mid-1]`, exactly the new bracket `hi = mid - 1` establishes. Either branch restores $I$ for the next iteration's `lo` and `hi`.

**Termination:** the loop's guard is `lo <= hi`; it exits either by returning from inside the loop (`target` found) or once `lo > hi`. In the latter case, $I(\text{lo}, \text{hi})$ says `target`, if present, would have to occur in `a[lo..hi]` — an empty range, since `lo > hi` — so `target` does not occur in `a` at all, and returning `-1` is correct.

## 4. Correct midpoint computation and the overflow bug

```c nocompile
int lo = 1500000000;
int hi = 1500000005;
int mid = (lo + hi) / 2;
```

Not run: `lo + hi` here is `3000000005`, which exceeds the largest value a $32$-bit `int` can hold — this is signed overflow, undefined behaviour, exactly as `Integer representation, fixed width, and overflow` established, not a value that merely wraps to something predictable. A binary search written with `mid = (lo + hi) / 2` carries this bug latently: it works correctly on every array small enough that `lo + hi` never approaches `INT_MAX`, and fails — not merely slowly, but with genuinely undefined behaviour — the moment it is used on an array large enough that two in-range indices can sum past it.

```c file=safemid.c run
#include <stdio.h>
#include <limits.h>

int main(void)
{
    int lo = 1500000000;
    int hi = 1500000005;

    int mid = lo + (hi - lo) / 2;
    printf("lo=%d, hi=%d, safe mid=%d\n", lo, hi, mid);
    printf("INT_MAX is %d\n", INT_MAX);

    return 0;
}
```

```output
lo=1500000000, hi=1500000005, safe mid=1500000002
INT_MAX is 2147483647
```

`mid = lo + (hi - lo) / 2` computes the identical midpoint without ever summing two large values: `hi - lo` is the (small) width of the current bracket, and adding half of it back onto `lo` never produces an intermediate value larger than `hi` itself — both `lo` and `hi` are already valid array indices by assumption, well within range, so nothing in this computation can overflow the way `lo + hi` can.

### Wrong model: `(lo + hi) / 2` is a harmless simplification of the correct midpoint formula

**What is actually true:** The two formulas agree on every input small enough that `lo + hi` stays within `int`'s range, which is why the bug is easy to miss during ordinary testing on small arrays. `(lo + hi) / 2` is not a simplification with a small, bounded error — once `lo + hi` overflows, the result is undefined behaviour, with no guarantee of producing a value anywhere near the correct midpoint, or even a value that stays inside the array's bounds at all. `lo + (hi - lo) / 2` is the version worth writing from the start, not a defensive addition reserved for "large" arrays, since what counts as large enough to trigger it depends on `int`'s width, not on any property of the search itself.

## 5. Termination

Each iteration either returns directly or narrows the bracket: `lo = mid + 1` strictly increases `lo`, and `hi = mid - 1` strictly decreases `hi`, and `mid` always lies within the current `[lo, hi]` by construction, so every non-returning iteration strictly shrinks `hi - lo`. `hi - lo` cannot shrink forever while staying non-negative — it is a non-negative integer that strictly decreases every iteration that does not return, so after finitely many iterations either a match is returned or `lo` exceeds `hi` and the loop's guard fails, exactly the condition section 3's termination case addresses.

## 6. The halving recurrence and logarithmic cost

Each iteration, other than the one that finds `target`, discards at least half of the current bracket — `mid` splits `[lo, hi]` into two roughly equal pieces, and only one of them survives into the next iteration. Starting from a bracket of size $n$, after one iteration it is at most $n/2$; after two, at most $n/4$; after $k$ iterations, at most $n/2^k$. The loop can continue only as long as the bracket has more than one candidate left, so the number of iterations before it is exhausted is bounded by how many times $n$ can be halved before reaching $1$ — `Growth of functions: polynomial, exponential, logarithmic`'s own reading of $\log_2 n$, the number of halvings. Binary search's worst-case comparison count is therefore $\Theta(\log n)$, confirmed directly:

```c file=countiters.c run
#include <stdio.h>

int binary_search(int *a, int n, int target, long *iterations)
{
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        (*iterations)++;
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target)
            return mid;
        else if (a[mid] < target)
            lo = mid + 1;
        else
            hi = mid - 1;
    }
    return -1;
}

int main(void)
{
    static int a[1024];
    for (int i = 0; i < 1024; i++)
        a[i] = i * 2;

    for (int n = 8; n <= 1024; n *= 8) {
        long iterations = 0;
        binary_search(a, n, -1, &iterations);
        printf("n=%d, worst-case iterations=%ld\n", n, iterations);
    }
    return 0;
}
```

```output
n=8, worst-case iterations=3
n=64, worst-case iterations=6
n=512, worst-case iterations=9
```

Multiplying $n$ by $8 = 2^3$ adds exactly $3$ more iterations at every step — $3, 6, 9$ — the direct signature of a logarithmic count: `Growth of functions: polynomial, exponential, logarithmic`'s section 7 established that a fixed multiplicative change in $n$ corresponds to a fixed additive change in $\log_2 n$, and that is exactly what the measurements show. Contrast this with linear search's worst case, `Counting operations: analysing iterative algorithms`'s $\Theta(n)$: multiplying $n$ by $8$ would multiply linear search's worst-case comparisons by $8$ as well, not add a fixed constant to them.

## 7. Boundary off-by-one errors

```c nocompile
int lo = 0, hi = n;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (a[mid] == target) return mid;
    else if (a[mid] < target) lo = mid + 1;
    else hi = mid;
}
```

Not run as a demonstration of a bug — this is actually a second, equally correct way to write binary search, using a half-open bracket `[lo, hi)` instead of section 2's closed `[lo, hi]`, with `hi` initialised to `n` rather than `n - 1` and the guard `lo < hi` rather than `lo <= hi`. What is *not* correct is mixing the two conventions: initialising `hi = n` (half-open style) but guarding with `lo <= hi` (closed-bracket style) reads one past the array's last valid index the first time `mid` can equal `hi`; initialising `hi = n - 1` (closed style) but guarding with `lo < hi` can terminate one iteration early, missing a target that occurs exactly at the final remaining index, `lo == hi`. Both of section 2's and section 7's forms are correct exactly because every piece — the initial value of `hi`, the loop guard, and the update `hi = mid` versus `hi = mid - 1` — was chosen consistently with the same closed-or-half-open convention throughout; picking pieces from each independently is `Loops and iteration`'s off-by-one error in a form specific to binary search's two brackets instead of one.

## Exercises

1. Using section 1, explain why linear search's worst case cannot be improved below $\Theta(n)$ without assuming anything about the array's contents.

2. Trace section 2's `binary_search(a, 10, 16)` on `{2, 5, 8, 12, 16, 23, 38, 45, 56, 72}` by hand: what are `lo`, `hi`, and `mid` on each iteration, and at which iteration does it return?

3. Using section 3's invariant, explain precisely why binary search would be incorrect if run on an unsorted array, identifying which step of the maintenance argument breaks.

4. Using section 4, compute the smallest `lo` and `hi` (with `hi = lo + 5`, matching the article's example) at which `lo + hi` would first exceed `INT_MAX`, given `INT_MAX = 2147483647`.

5. Using section 5, explain why `hi - lo` strictly decreasing every non-returning iteration is enough, on its own, to guarantee the loop terminates.

6. Using section 6, predict how many worst-case iterations `binary_search` would need for `n = 4096`, and justify your answer using the halving argument rather than running the code.

7. A student combines `int hi = n;` with the guard `while (lo <= hi)` from section 2. Using section 7, identify exactly which index this could cause the search to read that is outside the array's valid bounds.

## Answers

1. Without any assumption about how the elements are arranged, ruling out one element (finding it does not match `target`) provides no information about any other element — the target could be anywhere among the remaining ones with equal likelihood, so in the worst case, every element genuinely has to be checked before concluding `target` is absent.

2. Iteration 1: `lo=0, hi=9`, `mid=4`, `a[4]=16=target` — matches immediately, returns `4`. No further iterations needed.

3. If `a` is not sorted, the maintenance step's claim "every index from `lo` to `mid` holds a value at most `a[mid]`" no longer holds — an unsorted array can have a value larger than `target` sitting to the left of `mid` even when `a[mid] < target`, so ruling out `a[lo..mid]` when `a[mid] < target` is no longer justified, and the narrowed bracket can exclude the very index where `target` actually sits.

4. `lo + hi = lo + (lo + 5) = 2\,lo + 5 > 2147483647 \implies lo > 1073741821$, so the smallest integer `lo` is `1073741822`, giving `hi = 1073741827` and `lo + hi = 2147483649`, one more than `INT_MAX`.

5. `hi - lo` is a non-negative integer throughout (by the invariant, `lo <= hi` is what keeps the loop running) that strictly decreases by at least `1` every iteration that does not return — a strictly decreasing sequence of non-negative integers cannot continue indefinitely, so after at most `hi - lo`'s initial value many iterations, either the function has returned or the guard `lo <= hi` fails.

6. $12$ iterations. $4096 = 512 \times 8$, and section 6's table showed each additional factor of $8$ in $n$ adds exactly $3$ more iterations, so continuing from $9$ iterations at $n=512$ gives $9 + 3 = 12$ at $n=4096$ — matching the halving argument directly, since $\log_2 4096 = 12$.

7. With `hi` initialised to `n` (one past the last valid index) but the guard left as `lo <= hi` (section 2's closed-bracket style), `mid` can end up equal to `n` once `lo` and `hi` both reach `n` — `a[mid]` would then read `a[n]`, one past the array's last valid index, `Arrays and contiguous memory`'s out-of-bounds access, undefined behaviour reached here through a boundary-convention mismatch rather than a miscounted loop bound directly.
