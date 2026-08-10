---
id: c-arrays
title: "Arrays and contiguous memory"
track: c
---

# Arrays and contiguous memory

Every variable so far has held exactly one value. An array holds several, of the same type, laid out one after another in memory with nothing else between them — and once you know the address of the first one, `Variables, types, and memory addresses`' rule that a type is a size plus an interpretation is enough to compute the address of every other one yourself.

## 1. Declaration and zero-based indexing

```c file=basic.c run
#include <stdio.h>

int main(void)
{
    int a[5];
    a[0] = 10;
    a[1] = 20;
    a[2] = 30;
    a[3] = 40;
    a[4] = 50;
    printf("a[0] is %d, a[4] is %d\n", a[0], a[4]);
    return 0;
}
```

```output
a[0] is 10, a[4] is 50
```

`int a[5];` declares an array of `5` `int`s. Indexing starts at `0`, not `1`: the valid indices for a `5`-element array are `0` through `4`, so `a[4]` is the last element, not `a[5]`. Nothing about that offset is arbitrary, as section 2 makes precise.

## 2. Contiguity and the address arithmetic the compiler performs

```c file=addresses.c run
#include <stdio.h>

int main(void)
{
    int a[4] = {10, 20, 30, 40};
    printf("&a[0] is %p\n", (void *)&a[0]);
    printf("&a[1] is %p\n", (void *)&a[1]);
    printf("&a[2] is %p\n", (void *)&a[2]);
    return 0;
}
```

```output
&a[0] is {{ANY}}
&a[1] is {{ANY}}
&a[2] is {{ANY}}
```

Run this yourself and look closely: each address is exactly `sizeof(int)` — `4` — bytes after the one before it. That is not a coincidence of how this particular array happened to be placed; it is what "array" means. `a[i]`'s address is computed as `a`'s own address, plus `i` times the element size — `&a[0] + i * sizeof(int)` — and the compiler inserts that arithmetic every single time you write `a[i]`, whether `i` is a literal or a variable computed at runtime. Indexing starting at `0` is exactly this formula read literally: `a[0]` is `a`'s address plus zero.

## 3. Iteration

```c file=sumarray.c run
#include <stdio.h>

int main(void)
{
    int a[5] = {10, 20, 30, 40, 50};
    int sum = 0;
    for (int i = 0; i < 5; i++)
        sum = sum + a[i];
    printf("sum is %d\n", sum);
    return 0;
}
```

```output
sum is 150
```

`for (int i = 0; i < 5; i++)` visits every valid index of a `5`-element array exactly once: `i < 5` is deliberately not `i <= 5`, matching the valid range `0` through `4` from section 1 precisely — the off-by-one discipline from `Loops and iteration` matters especially here, as section 6 makes clear.

## 4. sizeof on an array

```c file=arraysize.c run
#include <stdio.h>

int main(void)
{
    int a[5];
    printf("sizeof(a) is %zu\n", sizeof(a));
    printf("sizeof(a) / sizeof(a[0]) is %zu\n", sizeof(a) / sizeof(a[0]));
    return 0;
}
```

```output
sizeof(a) is 20
sizeof(a) / sizeof(a[0]) is 5
```

`sizeof(a)` is the array's total size in bytes — `5` elements times `sizeof(int)`, `4` bytes each, is `20` — not the number of elements. To recover the element count, divide by the size of one element: `sizeof(a) / sizeof(a[0])`, a standard idiom worth recognising on sight.

### Wrong model: `sizeof` on an array gives you the number of elements

**What is actually true:** `sizeof` always reports bytes, for every type, arrays included — there is no special case that switches it to counting elements instead. `sizeof(a)` being `20` rather than `5` for a `5`-element `int` array is that same rule applied consistently; getting the count back out requires the explicit division shown above, every time.

## 5. Fixed compile-time size

`int a[5];` fixes `a`'s size, `5` elements, as part of its type — decided while the compiler is translating your source, not something the running program can change afterward. There is no operation that grows or shrinks `a`; a length that has to be decided once execution is already underway, from a value read in or computed along the way, cannot be written as `int a[n];` for this kind of array at all. Arrays whose size genuinely needs to be decided while the program runs are `Growable arrays: realloc and amortised doubling`'s subject, not this one's — they are not the same kind of array underneath.

## 6. Absence of bounds checking

```c nocompile
int a[5];
a[10] = 1;
```

This compiles. It may even run without any visible symptom. Neither of those facts means it is safe: C performs no bounds checking on array indexing, at compile time or at run time. `a[10]` computes an address the same way `a[2]` does — `a`'s address plus `10 * sizeof(int)` — and that computed address is read or written exactly as requested, regardless of whether it belongs to `a` at all. Whatever happened to be sitting at that address, quite possibly a completely unrelated variable, gets overwritten with no warning that anything unusual occurred.

### Wrong model: An out-of-bounds array access is safely caught, or at least reliably crashes

**What is actually true:** Nothing catches it, and nothing guarantees a crash. `a[10]` on a `5`-element array is undefined behaviour: the address computed is simply wherever the arithmetic lands, and what happens next depends entirely on what else occupies that memory. It might silently corrupt a variable that has nothing to do with `a`. It might, if the address happens to fall well outside memory the program is allowed to touch, be stopped by the operating system — a crash, but a lucky one, not a language guarantee. It might do nothing visible at all, this run, and something different the next time the program is compiled with different settings. Every one of these is a legitimate outcome of the same undefined behaviour; none of them is C "handling" the mistake.

## 7. Two-dimensional arrays in row-major order

```c file=grid.c run
#include <stdio.h>

int main(void)
{
    int grid[2][3];
    grid[0][0] = 1;
    grid[0][1] = 2;
    grid[0][2] = 3;
    grid[1][0] = 4;
    grid[1][1] = 5;
    grid[1][2] = 6;

    for (int row = 0; row < 2; row++) {
        for (int col = 0; col < 3; col++) {
            if (col > 0)
                printf(" ");
            printf("%d", grid[row][col]);
        }
        printf("\n");
    }

    printf("sizeof(grid) is %zu\n", sizeof(grid));

    return 0;
}
```

```output
1 2 3
4 5 6
sizeof(grid) is 24
```

`int grid[2][3];` is not two separate arrays — it is one contiguous block of `2 * 3 = 6` `int`s, `24` bytes, exactly matching `sizeof(grid)` above. **Row-major order** is the rule for how the two-dimensional index maps onto that single flat block: all of row `0` first, `grid[0][0]`, `grid[0][1]`, `grid[0][2]`, immediately followed by all of row `1`. `grid[row][col]`'s address follows directly from section 2's formula, just with a slightly longer computation: `grid`'s address, plus `(row * 3 + col) * sizeof(int)` — the number of columns, `3`, is what lets the compiler know how far one whole row spans.

## Exercises

1. Given `int a[5];`, what are the valid indices, and what is the address relationship between `a[i]` and `a[i + 1]`?

2. Why does `sizeof(a)` on `int a[10];` give `40`, not `10`? What do you divide by what to recover the element count?

3. In section 3, what would `sum` become if the loop condition were changed from `i < 5` to `i <= 5`? Why is this a dangerous mistake rather than merely a wrong-answer one?

4. Explain what "row-major order" means for how `grid[row][col]` is actually laid out in memory, using section 7.

5. A student writes `int a[3]; a[3] = 1;`, runs it, and nothing visibly goes wrong. Does this mean the write was safe? Explain.

6. Why can't the size in `int a[n];` be decided using a value only known once the program is already running?

7. Compute `sizeof(int[2][3])` given `sizeof(int)` is `4`, and explain your answer using contiguity, not memorisation.

8. Why is "C prevents you from writing past the end of an array" a dangerous belief to hold, rather than merely an inaccurate one?

## Answers

1. Valid indices are `0` through `4`. `a[i + 1]`'s address is exactly `sizeof(int)`, `4` bytes, after `a[i]`'s address, on every machine this website targets.

2. `sizeof(a)` reports total bytes: `10` elements times `sizeof(int)`, `4` bytes each, is `40`. Recovering the element count needs `sizeof(a) / sizeof(a[0])`.

3. With `i <= 5`, the loop would also run for `i = 5`, reading `a[5]` — one past the last valid index. `sum` would include whatever byte pattern happened to occupy that address, an unpredictable value rather than a fixed wrong number. It is dangerous, not just wrong, because nothing in C stops the read from happening; it reads real memory that does not belong to `a`.

4. All of row `0`'s elements are stored first, contiguously, immediately followed by all of row `1`'s elements, and so on — the whole two-dimensional array is one flat block. `grid[row][col]`'s address is `grid`'s address plus `(row * number_of_columns + col) * sizeof(element)`.

5. No. The absence of a visible symptom is not evidence of safety. `a[3]` on a `3`-element array computes an address past the array's own storage and writes to it regardless; whether anything looks wrong depends entirely on what else happened to occupy that memory, which can differ between runs, compilers, or optimisation settings.

6. Because the array's size is part of its type, and the compiler has to know a type's size while it is translating the program — before the program has run at all, and therefore before any value read in while running could exist yet.

7. `sizeof(int[2][3])` is `2 * 3 * sizeof(int) = 6 * 4 = 24`. A two-dimensional array is one contiguous block holding all `rows * columns` elements back to back with nothing else mixed in, so its total size is always the element count times the element size, exactly as for a one-dimensional array.

8. Believing bounds are enforced encourages writing code that assumes an out-of-range access will be caught or stopped, when in fact nothing stops it: the program will not raise an error, it will silently touch memory belonging to something else, with effects ranging from nothing visible to a crash far from the line that actually caused it. The danger is not the inaccuracy on its own — it is the false confidence that inaccuracy produces.
