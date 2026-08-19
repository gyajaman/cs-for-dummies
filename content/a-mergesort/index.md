---
id: a-mergesort
title: "Mergesort"
track: algo
---

# Mergesort

`Analysing recursive algorithms` built the tools to read a recursive function's own body as a recurrence and solve it; **mergesort** is the algorithm those tools were built for. It sorts by splitting a problem in half, trusting `Recursion` to sort each half correctly, and doing one further piece of work — merging two already-sorted halves into one — to combine the results.

## 1. Merging two sorted runs

```c file=merge.c run
#include <stdio.h>

void merge(int *a, int lo, int mid, int hi, int *scratch)
{
    int i = lo, j = mid + 1, k = lo;
    while (i <= mid && j <= hi) {
        if (a[i] <= a[j])
            scratch[k++] = a[i++];
        else
            scratch[k++] = a[j++];
    }
    while (i <= mid)
        scratch[k++] = a[i++];
    while (j <= hi)
        scratch[k++] = a[j++];
    for (int x = lo; x <= hi; x++)
        a[x] = scratch[x];
}

int main(void)
{
    int a[8] = {1, 4, 6, 8, 2, 3, 5, 7};
    int scratch[8];
    merge(a, 0, 3, 7, scratch);
    for (int i = 0; i < 8; i++)
        printf("%d ", a[i]);
    printf("\n");
    return 0;
}
```

```output
1 2 3 4 5 6 7 8 
```

`merge` assumes `a[lo..mid]` and `a[mid+1..hi]` are each *already sorted* — two sorted **runs** — and produces one sorted run covering all of `a[lo..hi]`. `i` and `j` walk the two runs in parallel; at each step, the smaller of `a[i]` and `a[j]` is copied into `scratch` next, and only that side's pointer advances. Once one run is exhausted, the other's remaining elements — already sorted, and all at least as large as everything copied so far — are simply appended. Every element is examined exactly once, so merging two runs of total length $m$ does $\Theta(m)$ work, never more.

## 2. The scratch buffer and its allocation

`merge` writes into `scratch`, a second array, rather than rearranging `a` in place — comparing `a[i]` against `a[j]` and immediately overwriting one of them would destroy a value the other side might still need. `The heap: malloc, free, and object lifetime` is exactly where this buffer comes from in practice:

```c file=scratchalloc.c run
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int n = 8;
    int *scratch = malloc(n * sizeof(*scratch));
    if (scratch == NULL)
        return 1;

    printf("scratch allocated for %d ints\n", n);

    free(scratch);
    return 0;
}
```

```output
scratch allocated for 8 ints
```

One buffer, sized to the whole array being sorted, is enough — every merge in the algorithm, at any level of recursion, writes into some contiguous slice of the same `scratch`, then copies that slice straight back into `a`, so the buffer never needs to hold more than `n` elements at once regardless of how many merges eventually run.

## 3. Recursive splitting

```c file=mergesortrec.c run
#include <stdio.h>
#include <stdlib.h>

void merge(int *a, int lo, int mid, int hi, int *scratch)
{
    int i = lo, j = mid + 1, k = lo;
    while (i <= mid && j <= hi) {
        if (a[i] <= a[j])
            scratch[k++] = a[i++];
        else
            scratch[k++] = a[j++];
    }
    while (i <= mid)
        scratch[k++] = a[i++];
    while (j <= hi)
        scratch[k++] = a[j++];
    for (int x = lo; x <= hi; x++)
        a[x] = scratch[x];
}

void merge_sort_rec(int *a, int lo, int hi, int *scratch)
{
    if (lo >= hi)
        return;
    int mid = lo + (hi - lo) / 2;
    merge_sort_rec(a, lo, mid, scratch);
    merge_sort_rec(a, mid + 1, hi, scratch);
    merge(a, lo, mid, hi, scratch);
}

void merge_sort(int *a, int n)
{
    int *scratch = malloc(n * sizeof(*scratch));
    if (scratch == NULL)
        return;
    merge_sort_rec(a, 0, n - 1, scratch);
    free(scratch);
}

int main(void)
{
    int a[8] = {5, 3, 8, 1, 9, 2, 7, 4};
    merge_sort(a, 8);
    for (int i = 0; i < 8; i++)
        printf("%d ", a[i]);
    printf("\n");
    return 0;
}
```

```output
1 2 3 4 5 7 8 9 
```

`merge_sort_rec`'s base case, `lo >= hi`, covers a range of zero or one elements — already sorted, trivially, with nothing to do. The recursive case splits `[lo, hi]` at its midpoint, exactly `Analysing recursive algorithms`'s `max_of` pattern, and trusts each recursive call to correctly sort its own half — `Recursion`'s leap of faith, applied here to an entire subarray rather than a single value. `merge`, the one piece of work not delegated to a smaller instance of the problem, combines the two now-guaranteed-sorted halves into one.

## 4. $T(n) = 2\,T(n/2) + \Theta(n)$

Reading `merge_sort_rec` directly, per `Analysing recursive algorithms`'s section 1: the base case does constant work; the recursive case makes two calls, each on roughly half the range, plus one call to `merge`, which section 1 established costs $\Theta(n)$ for a range of size $n$ — not a constant, unlike every recursive function `Analysing recursive algorithms` examined. The recurrence is

$$T(n) = 2\,T(n/2) + \Theta(n)$$

`Recurrence relations`'s master theorem applies directly: $a=2, b=2$, so $n^{\log_b a} = n$, and $f(n) = \Theta(n) = \Theta(n^{\log_b a})$ — case 2 — giving $T(n)$ sandwiched between constant multiples of $n \log n$.

```c file=mergecount.c run
#include <stdio.h>
#include <stdlib.h>

long comparisons = 0;

void merge(int *a, int lo, int mid, int hi, int *scratch)
{
    int i = lo, j = mid + 1, k = lo;
    while (i <= mid && j <= hi) {
        comparisons++;
        if (a[i] <= a[j])
            scratch[k++] = a[i++];
        else
            scratch[k++] = a[j++];
    }
    while (i <= mid)
        scratch[k++] = a[i++];
    while (j <= hi)
        scratch[k++] = a[j++];
    for (int x = lo; x <= hi; x++)
        a[x] = scratch[x];
}

void merge_sort_rec(int *a, int lo, int hi, int *scratch)
{
    if (lo >= hi)
        return;
    int mid = lo + (hi - lo) / 2;
    merge_sort_rec(a, lo, mid, scratch);
    merge_sort_rec(a, mid + 1, hi, scratch);
    merge(a, lo, mid, hi, scratch);
}

int main(void)
{
    for (int n = 8; n <= 64; n *= 2) {
        int *a = malloc(n * sizeof(*a));
        int *scratch = malloc(n * sizeof(*scratch));
        for (int i = 0; i < n; i++)
            a[i] = n - i;

        comparisons = 0;
        merge_sort_rec(a, 0, n - 1, scratch);
        printf("n=%d, comparisons=%ld\n", n, comparisons);

        free(a);
        free(scratch);
    }
    return 0;
}
```

```output
n=8, comparisons=12
n=16, comparisons=32
n=32, comparisons=80
n=64, comparisons=192
```

Doubling $n$ from $8$ to $64$, comparisons grow $12 \to 32 \to 80 \to 192$ — each doubling of $n$ roughly doubling the count and adding a bit more, exactly the shape $\Theta(n \log n)$ predicts (a pure doubling with no extra growth would signal $\Theta(n)$; these ratios, $32/12 \approx 2.7$, $80/32=2.5$, $192/80=2.4$, each exceed $2$ and shrink toward it as $n$ grows, the signature of the $\log n$ factor's own slow growth layered on top of the doubling).

## 5. Stability

```c file=mergestable.c run
#include <stdio.h>

typedef struct {
    int key;
    char label;
} item_t;

void merge_items(item_t *a, int lo, int mid, int hi, item_t *scratch)
{
    int i = lo, j = mid + 1, k = lo;
    while (i <= mid && j <= hi) {
        if (a[i].key <= a[j].key)
            scratch[k++] = a[i++];
        else
            scratch[k++] = a[j++];
    }
    while (i <= mid)
        scratch[k++] = a[i++];
    while (j <= hi)
        scratch[k++] = a[j++];
    for (int x = lo; x <= hi; x++)
        a[x] = scratch[x];
}

void merge_sort_items_rec(item_t *a, int lo, int hi, item_t *scratch)
{
    if (lo >= hi)
        return;
    int mid = lo + (hi - lo) / 2;
    merge_sort_items_rec(a, lo, mid, scratch);
    merge_sort_items_rec(a, mid + 1, hi, scratch);
    merge_items(a, lo, mid, hi, scratch);
}

int main(void)
{
    item_t a[5] = { {3, 'a'}, {1, 'b'}, {3, 'c'}, {2, 'd'}, {3, 'e'} };
    item_t scratch[5];

    merge_sort_items_rec(a, 0, 4, scratch);

    for (int i = 0; i < 5; i++)
        printf("%d%c ", a[i].key, a[i].label);
    printf("\n");

    return 0;
}
```

```output
1b 2d 3a 3c 3e 
```

A sort is **stable** if elements with equal keys keep their original relative order. The three items keyed `3` start in the order `a, c, e`, and mergesort's output keeps them in that exact order. This traces directly to `merge_items`'s comparison, `a[i].key <= a[j].key`: when the two runs' current fronts have equal keys, the left run's element (`i`) is taken, never the right run's — and since every merge only ever combines a *left* run with a *right* run that was originally positioned after it, an element from the left run with a key equal to one in the right run is guaranteed to have started out earlier in the array, so taking it first never disturbs the original relative order of equal keys.

## 6. Linear extra space

Section 2's `scratch` is allocated once, sized $n$, and reused across every merge at every level of recursion — but it is not zero extra space: mergesort needs a second array as large as the input to do its work, $\Theta(n)$ additional memory beyond the input array itself. This is a genuine cost compared to an algorithm that sorts by rearranging the input array using only a constant number of extra variables and no second array at all — a real tradeoff, not a free improvement, traded here for mergesort's $\Theta(n \log n)$ worst-case time regardless of the input's initial order.

### Wrong model: Mergesort's recursive calls each need their own scratch buffer

**What is actually true:** Section 2 and section 3's code allocate `scratch` exactly once, in `merge_sort`, and pass the identical pointer down through every recursive call — `merge_sort_rec` never allocates anything itself. Each individual call to `merge` only ever writes into the slice `scratch[lo..hi]` corresponding to its own range, and different calls active at different points in the recursion use disjoint slices of that one buffer, never overlapping, so one array sized to the whole input is sufficient for the entire sort, not one buffer per recursive call.

## 7. The bottom-up variant

```c file=mergebottomup.c run
#include <stdio.h>
#include <stdlib.h>

void merge(int *a, int lo, int mid, int hi, int *scratch)
{
    int i = lo, j = mid + 1, k = lo;
    while (i <= mid && j <= hi) {
        if (a[i] <= a[j])
            scratch[k++] = a[i++];
        else
            scratch[k++] = a[j++];
    }
    while (i <= mid)
        scratch[k++] = a[i++];
    while (j <= hi)
        scratch[k++] = a[j++];
    for (int x = lo; x <= hi; x++)
        a[x] = scratch[x];
}

void merge_sort_bottom_up(int *a, int n)
{
    int *scratch = malloc(n * sizeof(*scratch));
    if (scratch == NULL)
        return;

    for (int width = 1; width < n; width *= 2) {
        for (int lo = 0; lo < n - width; lo += 2 * width) {
            int mid = lo + width - 1;
            int hi = lo + 2 * width - 1;
            if (hi > n - 1)
                hi = n - 1;
            merge(a, lo, mid, hi, scratch);
        }
    }

    free(scratch);
}

int main(void)
{
    int a[7] = {5, 3, 8, 1, 9, 2, 7};
    merge_sort_bottom_up(a, 7);
    for (int i = 0; i < 7; i++)
        printf("%d ", a[i]);
    printf("\n");
    return 0;
}
```

```output
1 2 3 5 7 8 9 
```

The **bottom-up** variant reaches the identical result with no recursion at all: it merges adjacent runs of length `width`, starting at `width = 1` — every single element is trivially a sorted run of length one — then doubles `width` each pass, merging pairs of length-`1` runs into length-`2` runs, then pairs of length-`2` runs into length-`4` runs, and so on, until `width` reaches or exceeds `n`. The `if (hi > n - 1) hi = n - 1;` guards the case where `n` is not an exact power of two, so a run near the array's end is shorter than `width` — `merge` still works correctly on a shorter final run, since nothing in it assumed the two runs are equal length. This variant does the identical total amount of merging as the recursive version — $\Theta(\log n)$ passes, each doing $\Theta(n)$ total work across all its merges, the same $\Theta(n \log n)$ — without ever building a call stack of pending recursive calls: `The stack and function calls` established that every one of `merge_sort_rec`'s calls pushes its own frame, automatically tracking which ranges still need to be split and merged, while the bottom-up version tracks the identical information itself, explicitly, in `width` and the loop that doubles it.

## Exercises

1. Using section 1, explain why `merge` never needs to compare an element of the left run against more than one candidate from the right run before deciding which to copy next.

2. In section 3, what does `merge_sort_rec`'s base case, `lo >= hi`, actually cover — explain both the `lo == hi` and `lo > hi` cases separately.

3. Using section 4, explain why mergesort's recurrence lands in the master theorem's case 2 rather than case 1 or case 3, referencing what $f(n)$ actually is here.

4. In section 5, explain what would break about mergesort's stability if `merge_items`'s comparison were changed from `a[i].key <= a[j].key` to `a[i].key < a[j].key` (strict, rather than `<=`) — trace what happens on a tie.

5. Using section 6, explain why mergesort's $\Theta(n)$ extra space is not a cost that grows with the depth of the recursion, even though the recursion itself goes $\Theta(\log n)$ levels deep.

6. Using section 7, explain why the bottom-up variant's outer loop condition is `width < n` rather than, say, `width <= n`.

7. A student claims the bottom-up variant must be doing different work from the recursive version, since one uses nested loops and the other uses recursive calls. Using section 7's final sentence, evaluate this claim.

## Answers

1. Once `a[i]` (or `a[j]`) is determined to be the smaller of the two current fronts and copied into `scratch`, that side's index advances to the *next* element of its own run, and the comparison repeats fresh with whichever two elements are now at the front of each run — every comparison only ever needs the two current fronts, since both runs are already internally sorted and nothing earlier in either run could still be a candidate.

2. `lo == hi` is a range of exactly one element, already sorted trivially since there is nothing to compare it against. `lo > hi` is an empty range, arising when `mid + 1 > hi` inside a recursive call on a range that was already down to one element (so its "right half" is empty) — both are already-sorted, doing-nothing base cases, just covering a single element and zero elements respectively.

3. $f(n)$ is `merge`'s own cost at the top level, $\Theta(n)$, exactly matching $n^{\log_b a} = n^{\log_2 2} = n^1 = n$ up to constants — case 1 would require $f(n)$ to be polynomially *smaller* than $n$, and case 3 polynomially *larger*; here $f(n)$ and $n^{\log_b a}$ are the same order of growth, which is precisely case 2's condition.

4. With strict `<`, when `a[i].key == a[j].key`, the comparison `a[i].key < a[j].key` is false, so the *right* run's element would be taken first instead of the left's — an element originally positioned later in the array (the right run) would end up placed before an equal-keyed element originally positioned earlier (the left run), breaking the exact ordering-preservation section 5 relies on.

5. The $\Theta(n)$ `scratch` buffer is allocated once, in `merge_sort`, entirely outside the recursion, and every recursive call merely reuses slices of that same, already-allocated array — no additional buffer is allocated per level of recursion or per call, so the space cost stays fixed at $\Theta(n)$ regardless of how many levels deep the recursion goes (the recursion's own stack frames are a separate, additional cost, not discussed here, but the `scratch` buffer specifically does not multiply by recursion depth).

6. `width` doubles every pass and represents the length of the runs about to be merged; once `width >= n`, a single run already spans the entire array (or more), meaning the whole array is already one sorted run and there is nothing left to merge — `width < n` is exactly the condition "there is still more than one run," matching `merge_sort_rec`'s own base case, `lo >= hi`, meaning "this range is already trivially sorted."

7. The claim does not hold up. Section 7's final sentence states the bottom-up and recursive versions do the identical total amount of merging, $\Theta(n \log n)$ — the same merges, in a different order and organised by an explicit loop rather than the call stack's automatic bookkeeping, not a different computation. The visible difference in control-flow structure (loops versus recursive calls) reflects how the bookkeeping of "which pieces still need merging" is managed, not a difference in what gets merged.
