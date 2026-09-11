---
id: a-generic-sort
title: "Generic sorting with comparators"
track: algo
---

# Generic sorting with comparators

`Elementary sorts: selection, insertion, bubble` wrote `selection_sort` once, for arrays of `int`. Writing it again for `double`, again for a struct, again for anything else that might need sorting would mean writing the identical loop structure over and over, changing nothing but the type. `Function pointers`'s `qsort` comparator showed the way out for *comparison*; this article builds the rest of a fully generic sort around it — one that works on any element type at all, using `void *` and nothing more specific.

## 1. The comparator function signature

```c file=cmpsig.c run
#include <stdio.h>

int cmp_int(const void *a, const void *b)
{
    int x = *(const int *)a;
    int y = *(const int *)b;
    return (x > y) - (x < y);
}

int main(void)
{
    int a = 5, b = 3;
    printf("cmp_int(&a, &b) = %d\n", cmp_int(&a, &b));
    printf("cmp_int(&b, &a) = %d\n", cmp_int(&b, &a));
    printf("cmp_int(&a, &a) = %d\n", cmp_int(&a, &a));
    return 0;
}
```

```output
cmp_int(&a, &b) = 1
cmp_int(&b, &a) = -1
cmp_int(&a, &a) = 0
```

Every comparator a generic sort accepts has the identical signature, `int (*)(const void *, const void *)` — `Function pointers`'s own `qsort` contract: negative if the first argument sorts before the second, positive if after, zero if equivalent. `(x > y) - (x < y)` computes this without an `if`: when `x > y`, it is `1 - 0 = 1`; when `x < y`, `0 - 1 = -1`; when neither, `0 - 0 = 0` — one expression covering all three cases the contract requires. `const void *` is deliberately unspecific: the comparator, not the sort that calls it, is the only piece of code that has to know what type is actually being compared.

## 2. `void *` elements

```c file=voidsig.c run
#include <stdio.h>
#include <stddef.h>

void describe(void *base, size_t nmemb, size_t size)
{
    printf("base=%p, nmemb=%zu, size=%zu, total bytes=%zu\n",
           base, nmemb, size, nmemb * size);
}

int main(void)
{
    int a[6] = {5, 3, 8, 1, 9, 2};
    describe(a, 6, sizeof(int));
    return 0;
}
```

```output
base={{ANY}}, nmemb=6, size=4, total bytes=24
```

A generic sort's own array parameter is `void *base` — an address with no element type attached at all, exactly `Pointers`' own "an address and nothing else" — which is why it needs two further parameters no type-specific sort ever required: `nmemb`, how many elements, and `size`, how many bytes each one occupies. Neither can be recovered from `base` alone; `Arrays and contiguous memory`'s `sizeof(a)/sizeof(a[0])` idiom works only because the compiler still knows `a`'s element type at that point in the source, information that is completely gone by the time only a `void *` remains.

### Wrong model: `void *` arithmetic works the same way `int *` or `char *` arithmetic does

**What is actually true:** `Pointer arithmetic and array decay` scaled every `p + 1` by `sizeof(*p)` — the size of whatever `p` points to. A `void *` points at something of unknown size, so `base + 1` has nothing to scale by; the C standard does not define pointer arithmetic on `void *` at all. A generic sort has to cast to a pointer whose size *is* known — `unsigned char *`, size `1` — before doing any arithmetic, then multiply the desired element offset by `size` itself: `(unsigned char *)base + i * size` reaches element `i`, computed by hand exactly what `int *` arithmetic would have done automatically for a known type.

## 3. Byte-level swapping

```c file=byteswap.c run
#include <stdio.h>
#include <stddef.h>

void generic_swap(void *a, void *b, size_t size)
{
    unsigned char *pa = a, *pb = b;
    for (size_t i = 0; i < size; i++) {
        unsigned char temp = pa[i];
        pa[i] = pb[i];
        pb[i] = temp;
    }
}

int main(void)
{
    int x = 111, y = 222;
    generic_swap(&x, &y, sizeof(int));
    printf("x=%d y=%d\n", x, y);

    double p = 1.5, q = 2.5;
    generic_swap(&p, &q, sizeof(double));
    printf("p=%.1f q=%.1f\n", p, q);

    return 0;
}
```

```output
x=222 y=111
p=2.5 q=1.5
```

`generic_swap` exchanges `size` bytes between `a` and `b`, one byte at a time, using `unsigned char` — a type whose size is guaranteed `1` — for the actual reads and writes, entirely independent of what type the caller believes is stored there. It works identically whether `size` is `sizeof(int)`, `sizeof(double)`, or the size of an entire struct: bytes are bytes, `The machine model`'s own point, and swapping the ones that make up one `int` is no different an operation from swapping the ones that make up any other same-sized value.

## 4. A fully generic sort

```c file=genericsort.c run
#include <stdio.h>
#include <stddef.h>

void generic_swap(void *a, void *b, size_t size)
{
    unsigned char *pa = a, *pb = b;
    for (size_t i = 0; i < size; i++) {
        unsigned char temp = pa[i];
        pa[i] = pb[i];
        pb[i] = temp;
    }
}

void generic_sort(void *base, size_t nmemb, size_t size, int (*cmp)(const void *, const void *))
{
    unsigned char *arr = base;
    for (size_t i = 0; i + 1 < nmemb; i++) {
        size_t min_idx = i;
        for (size_t j = i + 1; j < nmemb; j++) {
            if (cmp(arr + j * size, arr + min_idx * size) < 0)
                min_idx = j;
        }
        if (min_idx != i)
            generic_swap(arr + i * size, arr + min_idx * size, size);
    }
}

int cmp_int(const void *a, const void *b)
{
    int x = *(const int *)a;
    int y = *(const int *)b;
    return (x > y) - (x < y);
}

typedef struct {
    int key;
    char label;
} item_t;

int cmp_item(const void *a, const void *b)
{
    const item_t *ia = a;
    const item_t *ib = b;
    return (ia->key > ib->key) - (ia->key < ib->key);
}

int main(void)
{
    int a[6] = {5, 3, 8, 1, 9, 2};
    generic_sort(a, 6, sizeof(int), cmp_int);
    for (int i = 0; i < 6; i++)
        printf("%d ", a[i]);
    printf("\n");

    item_t items[4] = { {30, 'a'}, {10, 'b'}, {40, 'c'}, {20, 'd'} };
    generic_sort(items, 4, sizeof(item_t), cmp_item);
    for (int i = 0; i < 4; i++)
        printf("%d%c ", items[i].key, items[i].label);
    printf("\n");

    return 0;
}
```

```output
1 2 3 5 8 9 
10b 20d 30a 40c 
```

`generic_sort` is `Elementary sorts: selection, insertion, bubble`'s selection sort, unchanged in structure — an outer loop fixing one position at a time, an inner loop finding the minimum of what remains — with every type-specific piece replaced: comparing two elements calls `cmp` instead of using `<` directly, per section 1; finding "the element at index `j`" means `arr + j * size`, per section 2's byte-offset arithmetic; swapping two elements calls `generic_swap`, per section 3. The identical function, `generic_sort`, correctly sorts both a plain array of `int` and an array of a two-field struct, with no change to `generic_sort` itself between the two calls — only the `size` and `cmp` arguments differ.

## 5. Using `qsort`

```c file=libqsort.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int key;
    char label;
} item_t;

int cmp_item(const void *a, const void *b)
{
    const item_t *ia = a;
    const item_t *ib = b;
    return (ia->key > ib->key) - (ia->key < ib->key);
}

int main(void)
{
    item_t items[4] = { {30, 'a'}, {10, 'b'}, {40, 'c'}, {20, 'd'} };
    qsort(items, 4, sizeof(item_t), cmp_item);
    for (int i = 0; i < 4; i++)
        printf("%d%c ", items[i].key, items[i].label);
    printf("\n");
    return 0;
}
```

```output
10b 20d 30a 40c 
```

`<stdlib.h>`'s `qsort` takes the identical four arguments `generic_sort` does — `void *base`, `size_t nmemb`, `size_t size`, and a comparator of the identical signature — because it is built on the identical idea: a sort with no knowledge of the element type, parameterised entirely by size and comparison. Calling it on the identical `item_t` array with the identical `cmp_item` from section 4 produces the identical sorted order, `10b 20d 30a 40c`, confirming `generic_sort` was not a simplified toy version of the technique but the same technique the standard library itself uses.

## 6. The type safety given up

```c file=typesafety.c run
#include <stdio.h>
#include <stddef.h>

void generic_swap(void *a, void *b, size_t size)
{
    unsigned char *pa = a, *pb = b;
    for (size_t i = 0; i < size; i++) {
        unsigned char temp = pa[i];
        pa[i] = pb[i];
        pb[i] = temp;
    }
}

void generic_sort(void *base, size_t nmemb, size_t size, int (*cmp)(const void *, const void *))
{
    unsigned char *arr = base;
    for (size_t i = 0; i + 1 < nmemb; i++) {
        size_t min_idx = i;
        for (size_t j = i + 1; j < nmemb; j++) {
            if (cmp(arr + j * size, arr + min_idx * size) < 0)
                min_idx = j;
        }
        if (min_idx != i)
            generic_swap(arr + i * size, arr + min_idx * size, size);
    }
}

typedef struct {
    int key;
    int extra;
} item_t;

int cmp_int(const void *a, const void *b)
{
    int x = *(const int *)a;
    int y = *(const int *)b;
    return (x > y) - (x < y);
}

int main(void)
{
    item_t items[4] = { {30, 100}, {10, 200}, {40, 300}, {20, 400} };

    printf("sizeof(item_t) is %zu, sizeof(int) is %zu\n", sizeof(item_t), sizeof(int));

    generic_sort(items, 4, sizeof(int), cmp_int);

    for (int i = 0; i < 4; i++)
        printf("key=%d extra=%d\n", items[i].key, items[i].extra);

    return 0;
}
```

```output
sizeof(item_t) is 8, sizeof(int) is 4
key=10 extra=30
key=100 extra=200
key=40 extra=300
key=20 extra=400
```

This compiles without a single warning, `-Wall -Wextra` included, and runs to completion with no crash. `items` is an array of `item_t`, `8` bytes each, but `generic_sort` was told `size = sizeof(int)`, `4` — half the truth. It proceeds exactly as instructed: comparing and swapping `4`-byte chunks as though the array held eight separate `int`s rather than four `item_t` structs, `cmp_int` reading only the first four bytes of whatever chunk it is handed, which sometimes lines up with a real `key` field and sometimes does not. The output is garbage relative to what was intended, not a crash and not a compiler error — nothing in `void *`'s type checks the caller's claimed `size` against the array's actual element size, because by the time `generic_sort` runs, that information was never captured at all. `Elementary sorts: selection, insertion, bubble`'s type-specific `selection_sort(int *a, int n)` cannot make this particular mistake — passing an array of `item_t` where `int *` is expected is a type error the compiler rejects outright, before the program ever runs. That compile-time guarantee is exactly what `void *`-based genericity gives up in exchange for working with any type at all.

## Exercises

1. Using section 1, evaluate `cmp_int(&a, &b)` by hand for `a = 3, b = 3`, and explain which of the three required return-value categories it falls into.

2. Using section 2's wrong-model box, explain why `generic_sort` casts `base` to `unsigned char *` specifically, rather than leaving it as `void *` throughout the function body.

3. Using section 3, explain why `generic_swap` works correctly on a `double`, even though it never mentions floating-point numbers anywhere in its own code.

4. Using section 4, identify which three lines of `generic_sort` would need to change if it were rewritten to sort `double`s directly using `<`, and explain why none of the surrounding loop structure would need to change.

5. Using section 5, explain what evidence in this article supports the claim that `qsort` is not fundamentally different from the `generic_sort` built by hand in section 4.

6. Using section 6, explain precisely why the incorrect call in section 6 does not read or write outside the bounds of the `items` array, despite `size` being wrong, referencing `nmemb * size` against the array's actual total size.

7. A student claims that using `void *` and a runtime `size` parameter is strictly worse than writing a type-specific sort, with no upside at all. Using section 4 and section 6 together, evaluate this claim.

## Answers

1. `(3 > 3) - (3 < 3) = 0 - 0 = 0`. This falls into the "equivalent for ordering purposes" category — neither argument sorts before the other — matching the contract's requirement that equal keys return exactly `0`.

2. `void *` arithmetic is not defined by the C standard, per section 2's wrong-model box — there is no way to compute `base + i * size` while `arr` is still typed `void *`. Casting to `unsigned char *` gives a pointer whose element size is known to be exactly `1`, so ordinary pointer arithmetic, scaled by `size` manually, becomes well-defined again.

3. `generic_swap` operates purely on bytes, using `unsigned char`, regardless of what those bytes represent — `The machine model`'s own point that memory is just bytes with no inherent type applies here directly. Swapping every one of a `double`'s `8` bytes between two locations produces the identical result as swapping the two `double` values directly, since a `double`'s value is entirely determined by its bytes, and nothing about `generic_swap`'s loop cares what those particular bytes are meant to represent.

4. The `cmp` parameter and its call (`cmp(arr + j * size, arr + min_idx * size) < 0`) would no longer be needed, replaced by a direct `<` comparison on `double` values; the `unsigned char *arr` casting and the `arr + j * size` byte-offset arithmetic would be replaced by ordinary `double *` indexing; and `generic_swap`'s byte-level swap would be replaced by a plain three-line `double` swap. None of the outer or inner loop's structure — which index does what, when a swap happens — would need to change, since that structure is `Elementary sorts: selection, insertion, bubble`'s selection sort algorithm itself, untouched by which type is being sorted.

5. Section 5 called `qsort` with the identical arguments — the same array, the same `4`, the same `sizeof(item_t)`, the same `cmp_item` — used for `generic_sort` in section 4, and got the identical sorted output, `10b 20d 30a 40c`, back from both. Matching behaviour under matching inputs, using an identical four-argument signature, is direct evidence the two are built on the same underlying technique, not merely similar in name.

6. `items` occupies `nmemb_actual * sizeof(item_t) = 4 * 8 = 32` bytes in total. The incorrect call passes `size = sizeof(int) = 4` with `nmemb = 4` unchanged, so every byte offset `generic_sort` computes stays within `4 * 4 = 16` bytes — well inside the `32` bytes the array actually occupies. The result is wrong, not out-of-bounds, precisely because the mismatch here happened to understate the true element size while `nmemb` matched the real element count, not because anything checked or guaranteed safety.

7. The claim overstates its case. Section 6 is real evidence of a genuine cost — a mismatched `size` compiles cleanly and fails silently, a mistake a type-specific sort's compiler-checked parameter types would catch immediately. But section 4 is equally real evidence of a genuine benefit: one `generic_sort` function, written once, correctly sorted both an `int` array and a struct array, where a type-specific approach would need a separately written, separately maintained sort for every element type ever needed. The tradeoff is real in both directions, not a one-sided loss.
