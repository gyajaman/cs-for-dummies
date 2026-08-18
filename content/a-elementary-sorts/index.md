---
id: a-elementary-sorts
title: "Elementary sorts: selection, insertion, bubble"
track: algo
---

# Elementary sorts: selection, insertion, bubble

`Loop invariants and correctness` already proved one piece of a sorting algorithm correct — insertion sort's inner shifting loop — without naming the algorithm it belongs to or asking how it performs. This article supplies the rest: three complete, in-place sorting algorithms, each analysed with `Counting operations: analysing iterative algorithms`'s counting method, compared on the specific properties that distinguish otherwise similar-looking loops.

## 1. Selection sort

```c file=selectionsort.c run
#include <stdio.h>

void selection_sort(int *a, int n)
{
    for (int i = 0; i < n - 1; i++) {
        int min_idx = i;
        for (int j = i + 1; j < n; j++)
            if (a[j] < a[min_idx])
                min_idx = j;
        if (min_idx != i) {
            int temp = a[i];
            a[i] = a[min_idx];
            a[min_idx] = temp;
        }
    }
}

int main(void)
{
    int a[6] = {4, 1, 5, 2, 6, 3};
    selection_sort(a, 6);
    for (int i = 0; i < 6; i++)
        printf("%d ", a[i]);
    printf("\n");
    return 0;
}
```

```output
1 2 3 4 5 6 
```

**Selection sort**'s outer loop invariant: immediately before the iteration with loop variable $i$, `a[0..i-1]` holds the $i$ smallest values of the original array, in sorted order, and every value in `a[i..n-1]` is at least as large as every value in `a[0..i-1]`. **Initialisation** ($i=0$): the claim about `a[0..-1]` is vacuous, holding nothing to check. **Maintenance**: the inner loop finds `min_idx`, the index of the smallest value in `a[i..n-1]` — a direct instance of `Loop invariants and correctness`'s maximum-finding invariant with the comparison reversed — and swapping it into position `i` extends the sorted, small-valued prefix by exactly one element, restoring the invariant at $i+1$. **Termination**: the outer loop stops at $i = n-1$, at which point `a[0..n-2]` holds the $n-1$ smallest values sorted, forcing the one remaining value, `a[n-1]`, to be the largest — the whole array sorted.

## 2. Insertion sort

```c file=insertionsort.c run
#include <stdio.h>

void insertion_sort(int *a, int n)
{
    for (int i = 1; i < n; i++) {
        int key = a[i];
        int j = i - 1;
        while (j >= 0 && a[j] > key) {
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = key;
    }
}

int main(void)
{
    int a[6] = {4, 1, 5, 2, 6, 3};
    insertion_sort(a, 6);
    for (int i = 0; i < 6; i++)
        printf("%d ", a[i]);
    printf("\n");
    return 0;
}
```

```output
1 2 3 4 5 6 
```

The `while` loop here is exactly `Loop invariants and correctness`'s section 6, proved correct there in full — it shifts every element of the already-sorted prefix `a[0..i-1]` that exceeds `key` one step right, then places `key` into the gap this opens. **Insertion sort**'s own outer invariant, wrapping that proof: immediately before the iteration with loop variable $i$, `a[0..i-1]` holds the original `a[0..i-1]`'s values rearranged into sorted order — nothing about which values are smallest overall, unlike selection sort, only that the prefix considered *so far* is internally sorted. **Initialisation** ($i=1$): `a[0..0]`, a single element, is trivially sorted. **Maintenance**: `Loop invariants and correctness`'s own proof shows the inner loop correctly inserts `a[i]` into its sorted place among `a[0..i-1]`, extending the sorted prefix to `a[0..i]`. **Termination**: the outer loop stops at $i=n$, giving a fully sorted `a[0..n-1]`.

## 3. Bubble sort

```c file=bubblesort.c run
#include <stdio.h>

void bubble_sort(int *a, int n)
{
    for (int i = 0; i < n - 1; i++) {
        int swapped = 0;
        for (int j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) {
                int temp = a[j];
                a[j] = a[j + 1];
                a[j + 1] = temp;
                swapped = 1;
            }
        }
        if (!swapped)
            break;
    }
}

int main(void)
{
    int a[6] = {4, 1, 5, 2, 6, 3};
    bubble_sort(a, 6);
    for (int i = 0; i < 6; i++)
        printf("%d ", a[i]);
    printf("\n");
    return 0;
}
```

```output
1 2 3 4 5 6 
```

**Bubble sort**'s inner loop compares every adjacent pair in `a[0..n-2-i]` and swaps any pair found out of order, which pushes the single largest remaining value as far right as it can go in one pass — one swap at a time, each moving it past its immediate right-hand neighbour, until nothing larger remains ahead of it. **Outer invariant**: immediately before the iteration with loop variable $i$, `a[n-i..n-1]` holds the $i$ largest values, in their final sorted positions. **Initialisation** ($i=0$): the claim about `a[n..n-1]` is vacuous. **Maintenance**: one full inner pass carries the largest value not yet placed into position `n-1-i`, extending the correctly-placed suffix by one. **Termination**: after $n-1$ passes, `a[1..n-1]` holds the $n-1$ largest values correctly placed, forcing `a[0]` to be the smallest — sorted. The `swapped` flag adds an early exit: if an entire pass makes no swap at all, every adjacent pair is already in order, which means the whole array is sorted, and no further passes can change anything.

## 4. Comparison and swap counts

```c file=countsorts.c run
#include <stdio.h>

void selection_sort(int *a, int n, long *cmp, long *swp)
{
    for (int i = 0; i < n - 1; i++) {
        int min_idx = i;
        for (int j = i + 1; j < n; j++) {
            (*cmp)++;
            if (a[j] < a[min_idx])
                min_idx = j;
        }
        if (min_idx != i) {
            int temp = a[i];
            a[i] = a[min_idx];
            a[min_idx] = temp;
            (*swp)++;
        }
    }
}

void insertion_sort(int *a, int n, long *cmp, long *swp)
{
    for (int i = 1; i < n; i++) {
        int key = a[i];
        int j = i - 1;
        while (j >= 0 && a[j] > key) {
            (*cmp)++;
            a[j + 1] = a[j];
            (*swp)++;
            j--;
        }
        if (j >= 0)
            (*cmp)++;
        a[j + 1] = key;
    }
}

int main(void)
{
    int sorted[6]  = {1, 2, 3, 4, 5, 6};
    int reverse[6] = {6, 5, 4, 3, 2, 1};

    long cmp = 0, swp = 0;
    int a[6];
    for (int i = 0; i < 6; i++) a[i] = sorted[i];
    selection_sort(a, 6, &cmp, &swp);
    printf("selection, sorted input:  comparisons=%ld swaps=%ld\n", cmp, swp);

    cmp = 0; swp = 0;
    for (int i = 0; i < 6; i++) a[i] = reverse[i];
    selection_sort(a, 6, &cmp, &swp);
    printf("selection, reverse input: comparisons=%ld swaps=%ld\n", cmp, swp);

    cmp = 0; swp = 0;
    for (int i = 0; i < 6; i++) a[i] = sorted[i];
    insertion_sort(a, 6, &cmp, &swp);
    printf("insertion, sorted input:  comparisons=%ld swaps=%ld\n", cmp, swp);

    cmp = 0; swp = 0;
    for (int i = 0; i < 6; i++) a[i] = reverse[i];
    insertion_sort(a, 6, &cmp, &swp);
    printf("insertion, reverse input: comparisons=%ld swaps=%ld\n", cmp, swp);

    return 0;
}
```

```output
selection, sorted input:  comparisons=15 swaps=0
selection, reverse input: comparisons=15 swaps=3
insertion, sorted input:  comparisons=5 swaps=0
insertion, reverse input: comparisons=15 swaps=15
```

Selection sort's inner loop always runs to completion, checking every remaining element regardless of what it finds — its comparison count is $\sum_{i=0}^{n-2}(n-1-i) = \frac{n(n-1)}{2}$, `Counting operations: analysing iterative algorithms`'s triangular sum exactly, and identical — $15$ — on both the already-sorted and fully-reversed six-element input. Its swap count, by contrast, is at most one per outer iteration and often far fewer, since a swap only happens when `min_idx != i`: zero on already-sorted input, where every element is already in its own minimum position. Insertion sort's counts move in the opposite direction: `5` comparisons on sorted input (each element compared once against its immediate predecessor and found already in place) against `15` on reversed input (every element shifted past everything before it) — for insertion sort, unlike selection sort, the *input's order itself*, not just its size, drives the count, section 7's subject.

## 5. Best, worst, and average case

Selection sort's comparison count, $\frac{n(n-1)}{2}$, does not depend on the input's arrangement at all — best case, worst case, and average case are all exactly the same function of $n$, $\Theta(n^2)$, since the inner loop's search for the minimum has no way to stop early regardless of what it has found so far. Insertion sort's best case is $\Theta(n)$ — an already-sorted array, where every element's `while` loop condition fails on its very first check, section 4's measured $5 = n - 1$ comparisons for $n=6$ — and its worst case is $\Theta(n^2)$ — a reverse-sorted array, where every element shifts past everything before it, section 4's measured $15 = \frac{n(n-1)}{2}$. Bubble sort matches insertion sort's best and worst cases exactly, for the same reason section 3's early-exit flag provides: one pass with no swaps, only possible when the array is already sorted, stops the algorithm in $\Theta(n)$ time; a reverse-sorted array forces every pass to run its full length with no early exit, giving $\Theta(n^2)$.

## 6. Stability

```c file=stability.c run
#include <stdio.h>

typedef struct {
    int key;
    char label;
} item_t;

void selection_sort_items(item_t *a, int n)
{
    for (int i = 0; i < n - 1; i++) {
        int min_idx = i;
        for (int j = i + 1; j < n; j++)
            if (a[j].key < a[min_idx].key)
                min_idx = j;
        if (min_idx != i) {
            item_t temp = a[i];
            a[i] = a[min_idx];
            a[min_idx] = temp;
        }
    }
}

void insertion_sort_items(item_t *a, int n)
{
    for (int i = 1; i < n; i++) {
        item_t key = a[i];
        int j = i - 1;
        while (j >= 0 && a[j].key > key.key) {
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = key;
    }
}

void print_items(item_t *a, int n)
{
    for (int i = 0; i < n; i++)
        printf("%d%c ", a[i].key, a[i].label);
    printf("\n");
}

int main(void)
{
    item_t a[5] = { {3, 'a'}, {1, 'b'}, {3, 'c'}, {2, 'd'}, {3, 'e'} };
    item_t b[5];
    for (int i = 0; i < 5; i++)
        b[i] = a[i];

    printf("before:          ");
    print_items(a, 5);

    selection_sort_items(a, 5);
    printf("after selection: ");
    print_items(a, 5);

    insertion_sort_items(b, 5);
    printf("after insertion: ");
    print_items(b, 5);

    return 0;
}
```

```output
before:          3a 1b 3c 2d 3e 
after selection: 1b 2d 3c 3a 3e 
after insertion: 1b 2d 3a 3c 3e 
```

A sort is **stable** if elements with equal keys keep their original relative order. The three items keyed `3` start in the order `a, c, e`. Insertion sort's output keeps them `3a 3c 3e` — that same order — because its `while` condition, `a[j].key > key.key`, is a *strict* inequality: an element equal in key to `key` is never shifted past, so two equal elements never cross each other. Selection sort's output is `3c 3a 3e` — `a` and `c` have swapped places — because swapping `a[i]` directly with `a[min_idx]` can leap an equal-keyed element over others sitting between them; here, the first-found `3`, at index `0`, gets swapped far down the array once a smaller element is found at its position, displacing it past the *other* `3`s along the way. Bubble sort, like insertion sort, only ever swaps strictly-out-of-order adjacent pairs, so it never crosses two equal keys either, and is stable by the identical reasoning.

### Wrong model: Stability is a property of what a sort computes, not how it computes it

**What is actually true:** All three algorithms in this article compute the identical final *set* of sorted values for a given input — stability is not about whether the output is correctly sorted, which section 1 through 3's invariant proofs already established for all three. It is specifically about what happens to elements that compare equal, which the sortedness invariants say nothing about at all, since `a[j] > a[j+1]` being false permits `a[j] == a[j+1]` just as much as `a[j] < a[j+1]`. Section 6's demonstration used a `key` plus a `label` specifically because a plain array of `int`s can never reveal instability — two equal `int`s are indistinguishable once sorted, whichever one ends up on the left. Stability only becomes observable, and only starts to matter, when equal-keyed elements carry other data that a later step of a program might depend on being in original order.

## 7. In-place operation

All three algorithms in this article sort by rearranging the given array's own elements, using a constant number of extra variables — `min_idx`, `key`, `j`, `temp`, `swapped` — regardless of `n`. This is what **in-place** means: the extra space needed does not grow with the input size, in contrast to an algorithm that builds a separate output array of size $n$ to write results into. Counting that extra space works exactly like counting operations, `Counting operations: analysing iterative algorithms`'s method, just applied to memory instead of steps: the sort's own variables are $\Theta(1)$ space, and no allocation beyond the input array itself ever happens.

## 8. Why insertion sort wins on nearly-sorted input

```c file=nearlysorted.c run
#include <stdio.h>

void selection_sort(int *a, int n, long *cmp)
{
    for (int i = 0; i < n - 1; i++) {
        int min_idx = i;
        for (int j = i + 1; j < n; j++) {
            (*cmp)++;
            if (a[j] < a[min_idx])
                min_idx = j;
        }
        if (min_idx != i) {
            int temp = a[i];
            a[i] = a[min_idx];
            a[min_idx] = temp;
        }
    }
}

void insertion_sort(int *a, int n, long *cmp)
{
    for (int i = 1; i < n; i++) {
        int key = a[i];
        int j = i - 1;
        while (j >= 0 && a[j] > key) {
            (*cmp)++;
            a[j + 1] = a[j];
            j--;
        }
        if (j >= 0)
            (*cmp)++;
        a[j + 1] = key;
    }
}

int main(void)
{
    int a[10] = {1, 2, 3, 4, 5, 6, 7, 9, 8, 10};
    int b[10] = {1, 2, 3, 4, 5, 6, 7, 9, 8, 10};

    long cmp_a = 0, cmp_b = 0;
    insertion_sort(a, 10, &cmp_a);
    selection_sort(b, 10, &cmp_b);

    printf("insertion sort comparisons: %ld\n", cmp_a);
    printf("selection sort comparisons: %ld\n", cmp_b);

    return 0;
}
```

```output
insertion sort comparisons: 10
selection sort comparisons: 45
```

On this ten-element input, only one adjacent pair (`9, 8`) is out of place. Insertion sort needs one comparison per already-in-place element — each fails on its very first check against its immediate predecessor — plus the one extra shift needed to move the single out-of-place value back: a count close to $n$, not $\frac{n(n-1)}{2}$. Selection sort's inner loop has no way to detect this: it scans every remaining element on every single outer iteration regardless of how the input is arranged, exactly `Counting operations: analysing iterative algorithms`'s point that a loop's actual count has to be derived from its bounds, not read off the algorithm's overall shape — selection sort's structure simply gives it no mechanism to notice, or benefit from, an input that is already almost entirely in order. Insertion sort's total comparison count is bounded by the number of **inversions** in the input — pairs out of their correct relative order — plus $n-1$; an input with only a handful of inversions costs insertion sort only a handful more than its absolute best case, where selection sort pays its full $\Theta(n^2)$ regardless.

## Exercises

1. Using section 1's invariant, explain why selection sort's outer loop only needs to run to `i = n - 2`, not `i = n - 1`, to fully sort the array.

2. In section 2, explain in one sentence why insertion sort's outer invariant makes a weaker claim than selection sort's outer invariant from section 1.

3. Using section 3, explain why bubble sort's inner loop bound is `n - 1 - i` rather than a fixed `n - 1` on every pass.

4. Using section 4's counting method, derive selection sort's exact comparison count for `n = 8`, and check it against $\frac{n(n-1)}{2}$.

5. A sort swaps `a[i]` directly with `a[k]` for some `k` possibly far from `i`, without regard for elements in between. Using section 6, explain why this pattern is inherently at risk of instability, referencing selection sort specifically.

6. Explain, using section 7, why an algorithm that sorts by copying elements into a freshly allocated array of size $n$ before copying them back would not count as in-place, even if it never allocates a second array of size $n$ ever again afterward.

7. Using section 8, explain why "insertion sort is slower than selection sort because insertion sort's inner loop can run up to $i$ times per iteration, more than selection sort's fixed structure" is misleading as a general comparison.

## Answers

1. By the invariant, once $i = n-1$ is reached, `a[0..n-2]` already holds the $n-1$ smallest values in sorted order, which forces the one remaining element, `a[n-1]`, to already be the largest — there is nothing left to compare or swap, so running the outer loop one more time, to `i = n-1`, would only ever compare `a[n-1]` against itself in an inner loop bounded by nothing (`j` from `n` to `n-1`, an empty range), doing no useful work.

2. Selection sort's invariant claims the sorted prefix holds the globally smallest $i$ values; insertion sort's invariant only claims the prefix considered so far is internally sorted, saying nothing about whether those values are the smallest $i$ values overall — a strictly weaker guarantee, sufficient for insertion sort's own correctness but not interchangeable with selection sort's.

3. Each completed pass places one more of the largest remaining values into its final position at the right-hand end, by the maintenance step in section 3 — positions `n-1, n-2, \ldots` are already correctly placed and never need to be revisited, so each subsequent pass can stop one position earlier than the last, shrinking `n - 1 - i` as `i` grows.

4. $\frac{n(n-1)}{2} = \frac{8 \times 7}{2} = 28$. Deriving it directly: the inner loop for outer index $i$ runs $n - 1 - i$ times ($i$ from $0$ to $6$), giving $\sum_{i=0}^{6}(7-i) = 7+6+5+4+3+2+1 = 28$, matching.

5. Section 6 showed selection sort's swap moves `a[min_idx]` directly into position `i`, potentially leaping over every element strictly between the two positions, including any equal-keyed elements sitting in between — an equal-keyed element that was originally to the left of `a[min_idx]` can end up to its right after the swap, exactly the crossing that occurred between the two equal `3`s in section 6's trace.

6. In-place, per section 7, means the *extra* space needed does not grow with $n$ — copying into a size-$n$ array and back uses $\Theta(n)$ extra space during that operation, regardless of whether that array is ever allocated again afterward; the definition is about peak extra space used during the algorithm's own execution, not about total allocations across a program's whole lifetime.

7. It compares only how many times a loop *body* can execute per outer iteration, not the total count across the whole run, which section 8 shows depends heavily on the input: on a nearly-sorted input, insertion sort's inner loop runs close to zero times per iteration on average, giving a total far below selection sort's fixed $\Theta(n^2)$, exactly the reversal section 8 measured (`10` against `15`) on a real example. A per-iteration bound on one loop's maximum possible length says nothing about the total until the input's actual effect on that bound is accounted for.
