---
id: c-dynamic-arrays
title: "Growable arrays: realloc and amortised doubling"
track: c
---

# Growable arrays: realloc and amortised doubling

`Arrays and contiguous memory` fixed an array's size at compile time and never let it change. `The heap: malloc, free, and object lifetime` introduced `realloc` for exactly the case that rule excludes — but only as a way to resize one block, with no opinion on how often to call it or by how much. This article builds the structure that answers both questions: a **growable array**, and the specific growth rule that makes appending to it cheap on average, proved from `Summations and closed forms`'s own geometric series.

## 1. `realloc` semantics and pointer invalidation

```c file=reallocmove.c run
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int *p = malloc(4 * sizeof(*p));
    for (int i = 0; i < 4; i++)
        p[i] = i;

    printf("before: p points at %p\n", (void *)p);

    int *q = realloc(p, 1000 * sizeof(*q));

    printf("after:  q points at %p\n", (void *)q);
    printf("q[0]=%d q[3]=%d\n", q[0], q[3]);

    free(q);
    return 0;
}
```

```output
before: p points at {{ANY}}
after:  q points at {{ANY}}
q[0]=0 q[3]=3
```

`The heap: malloc, free, and object lifetime`'s section 6 already established `realloc`'s contract: it preserves the block's existing contents up to the smaller of the old and new sizes, and it is free to move the block entirely if it cannot grow in place — confirmed above, since `q`'s address frequently differs from `p`'s, and the original four values, `0` through `3`, survive the move regardless. The consequence worth naming outright: `p` itself is **not** updated by the call. Once `realloc(p, ...)` returns successfully, `p` may point at memory that has already been freed out from under it — the old block, if it moved — making `p` `The heap: malloc, free, and object lifetime`'s own dangling pointer, by definition, the instant the call returns. Only `q`, the value `realloc` actually returned, is safe to use afterward.

## 2. Capacity versus length

```c file=capacitylength.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int *data;
    int length;
    int capacity;
} dynarray_t;

void da_init(dynarray_t *a)
{
    a->data = NULL;
    a->length = 0;
    a->capacity = 0;
}

int main(void)
{
    dynarray_t a;
    da_init(&a);
    printf("length=%d, capacity=%d\n", a.length, a.capacity);
    return 0;
}
```

```output
length=0, capacity=0
```

A growable array keeps two separate counts, not one. **Length** is how many elements the caller has actually stored — what `Arrays and contiguous memory`'s own `sizeof(a)/sizeof(a[0])` would report for a fixed array holding the same logical content. **Capacity** is how many elements the underlying block currently has *room* for, which can be, and usually is, larger than length — the slack is exactly what lets an append avoid calling `realloc` on every single insertion. `data` itself is the pointer `malloc` and `realloc` hand back; a freshly initialised growable array starts with no block at all, `NULL`, and both counts at `0`.

## 3. Geometric growth

```c file=push.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int *data;
    int length;
    int capacity;
} dynarray_t;

void da_init(dynarray_t *a)
{
    a->data = NULL;
    a->length = 0;
    a->capacity = 0;
}

void da_push(dynarray_t *a, int value)
{
    if (a->length == a->capacity) {
        int new_capacity = (a->capacity == 0) ? 1 : a->capacity * 2;
        int *new_data = realloc(a->data, new_capacity * sizeof(*new_data));
        if (new_data == NULL)
            return;
        a->data = new_data;
        a->capacity = new_capacity;
    }
    a->data[a->length] = value;
    a->length++;
}

int main(void)
{
    dynarray_t a;
    da_init(&a);

    for (int i = 0; i < 10; i++) {
        da_push(&a, i * 10);
        printf("length=%d, capacity=%d\n", a.length, a.capacity);
    }

    free(a.data);
    return 0;
}
```

```output
length=1, capacity=1
length=2, capacity=2
length=3, capacity=4
length=4, capacity=4
length=5, capacity=8
length=6, capacity=8
length=7, capacity=8
length=8, capacity=8
length=9, capacity=16
length=10, capacity=16
```

`da_push` only calls `realloc` when `length == capacity` — every other call finds room already waiting and just writes into it, an $O(1)$ operation with no allocation at all. When it does resize, it **doubles** the capacity rather than adding any fixed amount: `1, 2, 4, 8, 16`, confirmed directly above. This is **geometric growth** — each resize multiplies the available room by a constant factor, rather than adding a constant amount — and section 5 is where the specific choice of factor $2$ pays for itself.

## 4. Why growing by a constant is quadratic

```c file=growconstant.c run
#include <stdio.h>

long total_copies_constant(int n, int k)
{
    long total = 0;
    int capacity = 0, length = 0;
    for (int i = 0; i < n; i++) {
        if (length == capacity) {
            capacity += k;
            total += length;
        }
        length++;
    }
    return total;
}

int main(void)
{
    for (int n = 1000; n <= 8000; n *= 2)
        printf("n=%d: total elements copied = %ld\n", n, total_copies_constant(n, 1));
    return 0;
}
```

```output
n=1000: total elements copied = 499500
n=2000: total elements copied = 1999000
n=4000: total elements copied = 7998000
n=8000: total elements copied = 31996000
```

Growing capacity by a fixed amount $k$ every time the array fills — here $k=1$, the most extreme case — means a resize happens on *every single push* past the first, and each resize copies however many elements are already present, `length`, into the new block (`realloc`'s own contract from section 1). Summed over $n$ pushes, the total number of elements ever copied is $0 + 1 + 2 + \cdots + (n-1)$ — `Summations and closed forms`'s own arithmetic series, $\frac{n(n-1)}{2}$, $\Theta(n^2)$. Doubling $n$ from $1000$ to $2000$ roughly quadruples the total copying work, $499500 \to 1999000$ — the unmistakable signature of a quadratic count, confirmed directly rather than asserted.

## 5. Why doubling is amortised constant

```c file=growdouble.c run
#include <stdio.h>

long total_copies_doubling(int n)
{
    long total = 0;
    int capacity = 0, length = 0;
    for (int i = 0; i < n; i++) {
        if (length == capacity) {
            capacity = (capacity == 0) ? 1 : capacity * 2;
            total += length;
        }
        length++;
    }
    return total;
}

int main(void)
{
    for (int n = 1000; n <= 8000; n *= 2)
        printf("n=%d: total elements copied = %ld\n", n, total_copies_doubling(n));
    return 0;
}
```

```output
n=1000: total elements copied = 1023
n=2000: total elements copied = 2047
n=4000: total elements copied = 4095
n=8000: total elements copied = 8191
```

With doubling, a resize at `length = 1` copies `1` element; the next, at `length = 2`, copies `2`; the next, at `length = 4`, copies `4` — every resize's copy count is exactly the previous resize's *capacity*, which is exactly `Summations and closed forms`'s geometric series, $1 + 2 + 4 + \cdots + 2^{k-1} = 2^k - 1$, where $2^k$ is the first capacity at or past $n$. Since capacity only ever needs to grow to roughly $n$ itself, $2^k - 1 < 2n$ always — confirmed directly: `n=1000` gives `1023`, and `1023 < 2000`; `n=8000` gives `8191 < 16000`. Total copying work across all of $n$ pushes is $O(n)$, not $\Theta(n^2)$ — spread back out over the $n$ pushes that produced it, that is $O(n)/n = O(1)$ **amortised** per push: not every individual push is $O(1)$ (the ones that trigger a resize cost more), but the *average*, over any long enough sequence of pushes, is bounded by a constant.

### Wrong model: Amortised constant time means every push costs the same, small amount

**What is actually true:** Section 3's own measurements show pushes costing wildly different amounts — most are a single write, `O(1)`, but the pushes that land exactly on `length == capacity` each copy up to the *entire* array so far, `Θ(current length)`, visibly more expensive than their neighbours. "Amortised constant" is a claim about the **total** cost divided by the **number of pushes**, not a claim about any individual push — section 5's own total, $2^k - 1$, spread over $n$ pushes, averages out to a small constant per push specifically because the expensive pushes become exponentially rarer as the array grows, not because any single push is secretly cheap. Section 4's constant-growth rule fails this exact averaging: its resizes are not rare enough, happening every single push, which is precisely why its total is $\Theta(n^2)$ instead.

## Exercises

1. Using section 1, explain why `free(p);` after a successful `realloc(p, ...)` call (rather than `free(q);`) would be a mistake, referencing what `p` might already be pointing at by that point.

2. Using section 2, explain why `da_push` checks `a->length == a->capacity` specifically, rather than checking whether `a->data` is `NULL`.

3. Trace section 3's `da_push` by hand for the fifth call (`i=4`, pushing `40`), starting from `length=4, capacity=4` — what does `new_capacity` become, and why does this push, specifically, trigger a `realloc` call while the one before it (`i=3`) did not?

4. Using section 4, derive the exact total number of elements copied for `n=10` pushes under constant growth with `k=1`, and check it against $\frac{n(n-1)}{2}$.

5. Using section 5, explain why the doubling sequence's total copy count, $2^k - 1$, is always strictly less than $2n$, referencing the relationship between $2^k$ and $n$.

6. Using the wrong-model box, explain what is wrong with the claim "since doubling is amortised $O(1)$, the single most expensive push in a long sequence of appends is also $O(1)$."

7. A grow-by-constant scheme uses $k=100$ instead of $k=1$. Is its total copying cost over $n$ pushes still $\Theta(n^2)$? Justify briefly using section 4's derivation.

## Answers

1. By the point `realloc(p, ...)` has returned successfully into `q`, `p` may already be a dangling pointer to memory that has been freed, if the block moved — calling `free(p)` would then be a double free on memory already released as part of the move (if it moved), or, even if it happened not to move, `p` and `q` hold the identical address, making `free(p)` and `free(q)` free the same block, just accessed through two different variable names, doing nothing extra but making the intent to free `q`'s memory specifically less clear. `The heap: malloc, free, and object lifetime`'s discipline is to free exactly the pointer actually returned and in use going forward, `q`.

2. `a->length == a->capacity` is true exactly when there is no room left for another element, regardless of whether the array has ever allocated anything at all — an empty array starts with `length = capacity = 0`, so the very first push already satisfies this check and triggers the first allocation. Checking `a->data == NULL` alone would miss every *later* resize, once `data` is already a valid, non-`NULL` pointer that simply has no more room.

3. `new_capacity` becomes `a->capacity * 2 = 8`. This push triggers `realloc` because `length` (`4`) equals `capacity` (`4`) at that point — no room remains. The previous push (`i=3`, `length` going from `3` to `4`) did not trigger it, because at that point `length` was `3` and `capacity` was already `4` (set by the earlier resize at `i=2`), so `length == capacity` was false and the value was simply written into the existing room.

4. $0+1+2+\cdots+9 = \frac{9 \times 10}{2} = 45$. Checking against $\frac{n(n-1)}{2}$ with $n=10$: $\frac{10 \times 9}{2} = 45$. Matches.

5. $2^k$ is defined as the first power of two at or past $n$, so $2^k \ge n$ but also $2^{k-1} < n$ (otherwise a smaller power would already have sufficed), meaning $2^k < 2n$. Since $2^k - 1 < 2^k$, it follows directly that $2^k - 1 < 2n$ as well.

6. The wrong-model box states amortised cost is an average over the whole sequence, not a bound on any individual operation — a single push that happens to trigger a resize when the array already holds a huge number of elements can cost $\Theta(\text{that many elements})$, genuinely expensive in isolation, even though the running average per push, taken over a long enough sequence, stays $O(1)$. "Amortised $O(1)$" says nothing at all about the cost of any one specific push picked out on its own.

7. Yes, still $\Theta(n^2)$, for the identical reason as $k=1$: the total copying work is $\sum$ (length at each resize), and with a fixed $k$, a resize still happens roughly every $k$ pushes, so the count of resizes is still $\Theta(n)$ (specifically $n/k$, a constant fraction of $n$ for fixed $k$), and each one copies up to $\Theta(n)$ elements near the end — $k$ only rescales the constant in front of the $n^2$, per `Asymptotic notation: O, Omega, Theta`'s constant-absorption argument, it does not change the underlying quadratic shape the way switching to a *multiplicative*, geometric rule does.
