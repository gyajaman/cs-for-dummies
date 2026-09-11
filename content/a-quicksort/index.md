---
id: a-quicksort
title: "Quicksort"
track: algo
---

# Quicksort

`Mergesort` split first and did its real work — merging — after both halves came back sorted. **Quicksort** does its real work first: it rearranges the array around a chosen **pivot** so that everything smaller ends up to its left and everything larger to its right, and only then recurses on the two now-separated parts. Nothing further needs to happen once the two parts are individually sorted — the pivot is already exactly where it belongs.

## 1. Lomuto partitioning

```c file=lomuto.c run
#include <stdio.h>

int partition_lomuto(int *a, int lo, int hi)
{
    int pivot = a[hi];
    int i = lo - 1;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) {
            i++;
            int temp = a[i];
            a[i] = a[j];
            a[j] = temp;
        }
    }
    int temp = a[i + 1];
    a[i + 1] = a[hi];
    a[hi] = temp;
    return i + 1;
}

int main(void)
{
    int a[8] = {5, 3, 8, 1, 9, 2, 7, 4};
    int p = partition_lomuto(a, 0, 7);
    for (int i = 0; i < 8; i++)
        printf("%d ", a[i]);
    printf("\npivot landed at index %d\n", p);
    return 0;
}
```

```output
3 1 2 4 9 8 7 5 
pivot landed at index 3
```

**Lomuto partitioning** always picks the last element, `a[hi]`, as the pivot. `i` tracks the boundary of everything confirmed smaller than the pivot so far; `j` scans every other element in turn, and any element found smaller than the pivot is swapped into position `i+1`, extending that boundary by one. Once the scan finishes, the pivot itself — still sitting at `a[hi]` — is swapped into position `i+1`, exactly the one slot separating everything smaller (to its left) from everything at least as large (to its right). The value `4` was the pivot; it now sits at index `3`, with `3, 1, 2` — all smaller — to its left, and `9, 8, 7, 5` — all at least as large — to its right, in whatever order the swaps happened to leave them, not sorted yet.

## 2. Hoare partitioning

```c file=hoare.c run
#include <stdio.h>

int partition_hoare(int *a, int lo, int hi)
{
    int pivot = a[lo];
    int i = lo - 1;
    int j = hi + 1;
    while (1) {
        do {
            i++;
        } while (a[i] < pivot);
        do {
            j--;
        } while (a[j] > pivot);
        if (i >= j)
            return j;
        int temp = a[i];
        a[i] = a[j];
        a[j] = temp;
    }
}

int main(void)
{
    int a[8] = {5, 3, 8, 1, 9, 2, 7, 4};
    int p = partition_hoare(a, 0, 7);
    for (int i = 0; i < 8; i++)
        printf("%d ", a[i]);
    printf("\npartition index %d\n", p);
    return 0;
}
```

```output
4 3 2 1 9 8 7 5 
partition index 3
```

**Hoare partitioning** picks the *first* element as pivot and uses two indices closing in from opposite ends: `i` advances from the left past every element already smaller than the pivot, `j` retreats from the right past every element already larger, and whenever both stop on a pair out of order relative to the pivot, they swap and continue. Unlike Lomuto, the returned index `j` is not the pivot's own final resting place — it only guarantees everything at or before `j` is at most the pivot's value and everything after `j` is at least the pivot's value, which is enough to recurse on correctly (section 3), just not the same guarantee Lomuto's return value makes.

## 3. Recursion on the parts

```c file=quicksortrec.c run
#include <stdio.h>

int partition_lomuto(int *a, int lo, int hi)
{
    int pivot = a[hi];
    int i = lo - 1;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) {
            i++;
            int temp = a[i];
            a[i] = a[j];
            a[j] = temp;
        }
    }
    int temp = a[i + 1];
    a[i + 1] = a[hi];
    a[hi] = temp;
    return i + 1;
}

void quicksort(int *a, int lo, int hi)
{
    if (lo < hi) {
        int p = partition_lomuto(a, lo, hi);
        quicksort(a, lo, p - 1);
        quicksort(a, p + 1, hi);
    }
}

int main(void)
{
    int a[8] = {5, 3, 8, 1, 9, 2, 7, 4};
    quicksort(a, 0, 7);
    for (int i = 0; i < 8; i++)
        printf("%d ", a[i]);
    printf("\n");
    return 0;
}
```

```output
1 2 3 4 5 7 8 9 
```

`quicksort`'s base case, `lo >= hi`, covers zero or one elements, already sorted. Its recursive case partitions first, then recurses on `[lo, p-1]` and `[p+1, hi]` — the two ranges section 1 established are, respectively, entirely at most and entirely at least the pivot's value. Neither recursive call ever needs to touch index `p` again, and nothing after either call needs to do any further combining work, unlike `Mergesort`'s `merge` step — once both parts are individually sorted, the whole range is sorted, because the pivot already sat exactly where it belonged the moment section 1's partition finished.

## 4. Best, worst, and average case

Reading `quicksort` as a recurrence, per `Analysing recursive algorithms`'s method: the partition step itself does $\Theta(n)$ work for a range of $n$ elements — every element is examined exactly once, section 1's single pass over `j`. The recursive case's cost then depends entirely on how evenly the pivot splits the range.

**Worst case:** the pivot lands at one extreme every time — the smallest or largest element — putting all $n-1$ remaining elements into one recursive call and none into the other:

$$T(n) = T(n-1) + T(0) + \Theta(n) = T(n-1) + \Theta(n)$$

exactly `Recurrence relations`'s section 1 shape, solved there by unrolling to $\Theta(n^2)$.

**Best case:** the pivot splits the range evenly in half every time:

$$T(n) = 2\,T(n/2) + \Theta(n)$$

identical to `Mergesort`'s own recurrence, `Recurrence relations`'s master theorem case 2, giving $\Theta(n \log n)$.

**Average case**, over random input, turns out to land in the same $\Theta(n \log n)$ class as the best case — a pivot does not need to split *exactly* in half every time to avoid the worst case's behaviour, only to avoid splitting at one extreme consistently, and a uniformly random pivot choice does this with high probability, a fact stated here, not derived — the full argument belongs to a more detailed treatment of probabilistic analysis than `Counting and expected value`'s scope covers.

## 5. Pivot choice

```c file=randompivot.c run
#include <stdio.h>
#include <stdlib.h>

int partition_lomuto(int *a, int lo, int hi)
{
    int r = lo + rand() % (hi - lo + 1);
    int temp = a[r];
    a[r] = a[hi];
    a[hi] = temp;

    int pivot = a[hi];
    int i = lo - 1;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) {
            i++;
            temp = a[i];
            a[i] = a[j];
            a[j] = temp;
        }
    }
    temp = a[i + 1];
    a[i + 1] = a[hi];
    a[hi] = temp;
    return i + 1;
}

void quicksort_random(int *a, int lo, int hi)
{
    if (lo < hi) {
        int p = partition_lomuto(a, lo, hi);
        quicksort_random(a, lo, p - 1);
        quicksort_random(a, p + 1, hi);
    }
}

int main(void)
{
    int n = 10;
    int a[10];
    for (int i = 0; i < n; i++)
        a[i] = i;

    quicksort_random(a, 0, n - 1);

    int sorted = 1;
    for (int i = 1; i < n; i++)
        if (a[i - 1] > a[i])
            sorted = 0;

    printf("array is sorted: %s\n", sorted ? "yes" : "no");
    return 0;
}
```

```output
array is sorted: yes
```

Choosing which element serves as the pivot is a free parameter section 1 through 3 left fixed at "always the last element." `partition_lomuto` here instead swaps a *uniformly random* index into the last position first, then runs the identical Lomuto scan — the correctness argument from section 1 is untouched, since it never depended on which value ended up at `a[hi]` before the scan began, only that it does end up there. Section 4's "average case" is not a property of the *input* alone; with a fixed pivot rule, an adversary who knows the rule can always construct a worst-case input (section 6). With a randomised pivot, no fixed input can reliably trigger the worst case, because the pivot itself is no longer a fixed function of the input's arrangement — the exact sequence of splits differs from run to run, but the sorted output does not, confirmed above.

## 6. Quadratic behaviour on sorted input with a naive pivot

```c file=sortedworst.c run
#include <stdio.h>
#include <stdlib.h>

long comparisons = 0;
int depth = 0, max_depth = 0;

int partition_lomuto(int *a, int lo, int hi)
{
    int pivot = a[hi];
    int i = lo - 1;
    for (int j = lo; j < hi; j++) {
        comparisons++;
        if (a[j] < pivot) {
            i++;
            int temp = a[i];
            a[i] = a[j];
            a[j] = temp;
        }
    }
    int temp = a[i + 1];
    a[i + 1] = a[hi];
    a[hi] = temp;
    return i + 1;
}

void quicksort(int *a, int lo, int hi)
{
    depth++;
    if (depth > max_depth)
        max_depth = depth;
    if (lo < hi) {
        int p = partition_lomuto(a, lo, hi);
        quicksort(a, lo, p - 1);
        quicksort(a, p + 1, hi);
    }
    depth--;
}

int main(void)
{
    for (int n = 10; n <= 40; n *= 2) {
        int *a = malloc(n * sizeof(*a));
        for (int i = 0; i < n; i++)
            a[i] = i;

        comparisons = 0;
        depth = 0;
        max_depth = 0;
        quicksort(a, 0, n - 1);
        printf("sorted input, n=%d: comparisons=%ld, max depth=%d\n", n, comparisons, max_depth);
        free(a);
    }
    return 0;
}
```

```output
sorted input, n=10: comparisons=45, max depth=10
sorted input, n=20: comparisons=190, max depth=20
sorted input, n=40: comparisons=780, max depth=40
```

With the last-element pivot rule and an *already-sorted* input, `a[hi]` is always the largest element remaining — every other element is smaller than it, so `partition_lomuto` puts all of them into the left part and none into the right, exactly section 4's worst case, every single call. `n=10` gives $45 = \frac{10 \times 9}{2}$ comparisons; `n=20` gives $190 = \frac{20 \times 19}{2}$; `n=40` gives $780 = \frac{40 \times 39}{2}$ — `Summations and closed forms`'s arithmetic series exactly, matching section 4's $T(n) = T(n-1) + \Theta(n)$ unrolled to $\Theta(n^2)$, confirmed directly rather than asserted.

## 7. In-place operation

Neither `partition_lomuto` nor `partition_hoare` allocates anything — both rearrange `a`'s own elements using a constant number of extra index variables (`i`, `j`, `pivot`, `temp`), regardless of `n`. Quicksort needs no second array the way `Mergesort`'s `scratch` buffer did: every swap happens directly within the input array, and the partition boundary itself, not a copy, is what separates the two parts before recursing.

## 8. Recursion depth

Section 6's `max_depth` measurements — `10`, `20`, `40`, exactly matching `n` — show the worst case's recursion going as deep as the array is long: with one side of every partition always empty, each recursive call only ever peels off a single element before recursing again, so the chain of nested, unreturned calls grows by one for every element, `Analysing recursive algorithms`'s own linear-recursion space cost, `Θ(n)`, not the `Θ(\log n)` a balanced split would give. Since `The stack and function calls` already established that every unreturned call keeps its frame on the stack, this is a genuine, measurable cost: a worst-case quicksort on a large enough sorted array, with a naive pivot, can exhaust the stack from recursion depth alone, well before it exhausts it from anything else.

### Wrong model: Quicksort's stack usage is proportional to how much total work it does

**What is actually true:** Section 6 measured $780$ total comparisons at $n=40$ but only $40$ levels of simultaneous recursion depth — the same distinction `Analysing recursive algorithms` drew between total call count and maximum simultaneous stack depth for `max_of` and `fib`. Here they happen to coincide in the worst case, both $\Theta(n)$, because the worst-case split is maximally *unbalanced*, leaving one long chain of nested calls; a well-balanced split would keep total work at $\Theta(n \log n)$ while cutting the recursion depth further, to $\Theta(\log n)$, since recursing on the smaller of the two parts first and discarding that frame before starting the larger part (a refinement not shown in section 3's code) bounds the stack depth independently of how much total work the sort ends up doing.

## Exercises

1. Using section 1, trace `partition_lomuto` on `{4, 2, 6, 1, 3}` (`lo=0, hi=4`, pivot `3`), giving the array's contents and the returned index after the call.

2. Using section 2, explain why Hoare's returned index `j` cannot be used the same way section 3 uses Lomuto's `p` — specifically, why `quicksort(a, lo, j)` includes index `j` itself while Lomuto's version excludes `p` from both recursive calls.

3. Using section 4, explain in your own words why quicksort's worst case and mergesort's *only* case (`Mergesort`'s section 4) are both $\Theta(n \log n)$-adjacent recurrences with different resulting bounds — what specifically differs between $T(n) = T(n-1) + \Theta(n)$ and $T(n) = 2T(n/2) + \Theta(n)$.

4. Using section 5, explain why `quicksort_random`'s correctness does not depend on which specific index `rand()` happens to choose, even though its *performance* does.

5. Using section 6, predict (without running code) roughly how many comparisons sorted input of size $n=80$ would need with the naive last-element pivot, and justify your prediction using the measured pattern.

6. Using section 7, name the one respect in which quicksort is a strictly better fit than mergesort for a system with very limited extra memory, referencing `Mergesort`'s section 6 directly.

7. Using section 8's wrong-model box, explain why "quicksort does $\Theta(n \log n)$ work on average" does not, by itself, guarantee $\Theta(\log n)$ recursion depth on average, without the refinement mentioned there.

## Answers

1. Pivot is `3`. Scanning `j=0..3`: `a[0]=4` not `< 3`, skip; `a[1]=2 < 3`, `i` becomes `0`, swap `a[0]` and `a[1]`: array is `{2,4,6,1,3}`; `a[2]=6` not `<3`, skip; `a[3]=1<3`, `i` becomes `1`, swap `a[1]` and `a[3]`: array is `{2,1,6,4,3}`. Final swap: swap `a[2]` (`i+1=2`) with `a[4]`: array becomes `{2,1,3,4,6}`. Returned index: `2`.

2. Hoare's partition only guarantees `a[lo..j]` are at most the pivot and `a[j+1..hi]` are at least the pivot — it makes no promise that the pivot itself sits exactly at index `j`, unlike Lomuto's `p`, which is the pivot's own confirmed final position. Excluding `j` from Hoare's recursive calls (using `p-1` and `p+1`-style bounds as Lomuto does) risks leaving an element belonging to the left partition permanently unsorted, since `j` itself might still need to move; including it in the left call (`lo` to `j`) and starting the right call at `j+1` is what correctly covers every element exactly once.

3. Both recurrences add $\Theta(n)$ of work per level, but $T(n) = T(n-1) + \Theta(n)$ only shrinks the remaining problem by $1$ element per call, giving $n$ levels total and a total cost that is a sum of $n$ terms each up to $\Theta(n)$, landing at $\Theta(n^2)$; $T(n) = 2T(n/2) + \Theta(n)$ halves the remaining problem per level, giving only $\Theta(\log n)$ levels, each still contributing $\Theta(n)$ total work summed across that level's several smaller calls, landing at $\Theta(n \log n)$. The difference is entirely in how many levels of recursion the split produces, not in how much work happens at any single level.

4. Section 1's correctness argument for `partition_lomuto` only used the fact that some fixed value ends up at `a[hi]` before the scan runs and gets compared against every other element — it never assumed anything about *which* value that is. `rand()`'s specific choice only changes which value plays that role and, consequently, how evenly the resulting split falls, which section 4 already established governs performance, not whether the result ends up correctly partitioned.

5. Following the pattern $\frac{n(n-1)}{2}$ confirmed at $n=10,20,40$: at $n=80$, $\frac{80 \times 79}{2} = 3160$ comparisons — continuing the same quadratic closed form the three measured points already matched exactly, rather than a fresh guess.

6. Quicksort partitions in place, using only a constant number of extra index variables regardless of `n`, where `Mergesort`'s section 6 established its `scratch` buffer costs $\Theta(n)$ additional memory beyond the input array itself; a system with very limited extra memory can run quicksort without that additional allocation at all.

7. The wrong-model box shows total work and maximum simultaneous stack depth are different quantities — an average-case $\Theta(n \log n)$ total work figure describes work summed across the *entire* run, while stack depth depends specifically on how the recursive calls nest, which the refinement (recursing on the smaller part first, discarding its frame before starting the larger part) controls directly; without it, an otherwise well-balanced sort could still, in principle, nest its calls in an order that keeps more frames alive simultaneously than the total work figure alone would suggest.
