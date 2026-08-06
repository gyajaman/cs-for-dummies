---
id: c-heap
title: "The heap: malloc, free, and object lifetime"
track: c
---

# The heap: malloc, free, and object lifetime

`The stack and function calls` tied a local variable's storage to its function's stack frame: the storage appears when the frame is pushed and stops being reserved the instant the frame is popped. That coupling is convenient, and it is also a limit — sometimes you need storage whose lifetime has nothing to do with which function is currently running. The **heap** is a second region of memory, entirely separate from the stack, for exactly that: storage you request explicitly, that lasts until you explicitly give it back.

## 1. Automatic versus allocated lifetime

A variable declared normally, `int n;`, has **automatic lifetime** — the compiler manages its storage for you, tied to scope, and you never see the boundaries directly, only their consequences, as `The stack and function calls` demonstrated. Memory on the heap has **allocated lifetime** instead: nothing manages it automatically. It begins when you call `malloc`, and it lasts until you call `free`, regardless of how many function calls happen in between.

```c file=lifetimecompare.c run
#include <stdio.h>
#include <stdlib.h>

int *make_heap_int(int value)
{
    int *p = malloc(sizeof(int));
    if (p == NULL)
        return NULL;
    *p = value;
    return p;
}

void unrelated_call(void)
{
    int noise[4] = {1, 2, 3, 4};
    (void)noise;
}

int main(void)
{
    int *p = make_heap_int(99);
    unrelated_call();
    printf("*p is still %d, after make_heap_int returned and another call ran\n", *p);
    free(p);
    return 0;
}
```

```output
*p is still 99, after make_heap_int returned and another call ran
```

`make_heap_int`'s own local variable, `p`, has automatic lifetime and is gone the moment `make_heap_int` returns — its frame is popped exactly as `The stack and function calls` described. But the four bytes `p` pointed at are not part of that frame; `malloc` reserved them somewhere else, the heap, and they are untouched by `make_heap_int` returning, by `unrelated_call` running and popping its own frame in between, by anything at all except an explicit `free`. This is the entire reason the heap exists: to hold data whose lifetime needs to outlive the function that created it.

## 2. `malloc` and checking for `NULL`

```c file=mallocbasic.c run
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int *p = malloc(sizeof(int));
    if (p == NULL) {
        printf("allocation failed\n");
        return 1;
    }

    *p = 7;
    printf("*p is %d\n", *p);
    free(p);
    return 0;
}
```

```output
*p is 7
```

`malloc(n)` requests `n` bytes from the heap and returns a pointer to the first one — `void *`, a pointer typeless enough to be assigned to any pointer variable without a cast, which is why `int *p = malloc(sizeof(int));` needs none. The memory `malloc` returns is uninitialised: it holds whatever bytes were already there, following exactly the rule `Variables, types, and memory addresses` already stated for any uninitialised storage, not zero and not any particular value.

The request can fail — the system may simply have no more memory to give out — and `malloc` reports failure by returning `NULL` rather than a valid address. `if (p == NULL)` is not defensive decoration; it is the only way to find out whether the pointer that follows is safe to dereference at all.

### Wrong model: `malloc`'s return value doesn't really need checking, since allocation basically always succeeds

**What is actually true:** `malloc` returning `NULL` is rare on the small programs this book runs, which is exactly what makes the habit easy to skip and expensive to skip. `NULL` is `Pointers`' own guaranteed not-a-valid-object value, and dereferencing it is undefined behaviour with no distinguishing mark to say "this one came from a failed allocation" — the crash, if there even is one, gives no better information than any other `NULL` dereference. Section 2's `if (p == NULL)` check is the only point in the program that ever has the information needed to handle the failure sensibly; skip it, and that information is gone the instant the next line runs.

## 3. Computing the size correctly

```c file=mallocarray.c run
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    size_t n = 5;
    int *a = malloc(n * sizeof(*a));
    if (a == NULL)
        return 1;

    for (size_t i = 0; i < n; i++)
        a[i] = (int)(i * 10);

    for (size_t i = 0; i < n; i++)
        printf("a[%zu] is %d\n", i, a[i]);

    free(a);
    return 0;
}
```

```output
a[0] is 0
a[1] is 10
a[2] is 20
a[3] is 30
a[4] is 40
```

An array of `n` elements needs `n * sizeof(element)` bytes, matching `Arrays and contiguous memory`'s own formula for how far an array actually spans. `malloc(n * sizeof(*a))` writes that size in terms of `*a` — the thing `a` points to — rather than spelling out `int` a second time; if `a`'s declared type ever changes, `sizeof(*a)` changes with it automatically, while a hard-coded `sizeof(int)` would silently stop matching. Once allocated, `a[i]` indexes into it exactly as it would into a plain array — indexing, as `Pointer arithmetic and array decay` establishes in full, was never specific to arrays declared with `[]` in the first place.

Writing `malloc(n)` instead — forgetting the element size entirely — compiles without complaint and allocates far too few bytes; the resulting out-of-bounds writes are exactly the undefined behaviour `Arrays and contiguous memory` already described, now reached through a miscomputed allocation instead of a miscounted loop.

### Wrong model: `sizeof` on a heap pointer reports how many bytes were allocated

**What is actually true:** `a` in section 3 is an `int *`, and `sizeof(a)` reports the size of that pointer — `8` — with no relationship to the `5 * sizeof(int) = 20` bytes `malloc` actually reserved. `Pointers` already established that a pointer's own size never depends on what it points to; `malloc`'s return value does not change that fact just because the memory behind it happens to have come from an allocation. The allocation's size is not retrievable from the pointer at all — it exists only in the number originally passed to `malloc`, which is why that number, `n` in section 3, has to be kept around separately, the same discipline `Pointer arithmetic and array decay` required for a decayed array parameter.

## 4. `calloc`

```c file=callocdemo.c run
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int *a = calloc(5, sizeof(*a));
    if (a == NULL)
        return 1;

    for (size_t i = 0; i < 5; i++)
        printf("a[%zu] is %d\n", i, a[i]);

    free(a);
    return 0;
}
```

```output
a[0] is 0
a[1] is 0
a[2] is 0
a[3] is 0
a[4] is 0
```

`calloc(count, size)` takes the element count and element size as two separate arguments rather than one pre-multiplied total, and, unlike `malloc`, guarantees the memory it returns is zeroed — every bit `0` — rather than left as leftover, indeterminate bytes. Section 3's `a` would have printed unpredictable values without initialising the loop first; `calloc`'s `a` does not need that loop to reach an all-zero starting state, at the cost of doing the zeroing whether the caller needed it or not.

## 5. `free`

```c file=freedemo.c run
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int *p = malloc(sizeof(int));
    if (p == NULL)
        return 1;

    *p = 42;
    printf("before free, *p is %d\n", *p);

    free(p);
    printf("p itself still holds %p after free\n", (void *)p);

    return 0;
}
```

```output
before free, *p is 42
p itself still holds {{ANY}} after free
```

`free(p)` returns the memory `p` points to back to the heap, making it available for a future allocation to reuse — the heap equivalent of a stack frame being popped. What `free` does not do is touch `p` itself: `p` is an ordinary variable, and `free` has no way to reach into it and change what address it holds. The printed address after `free` is identical to the one before it; `p` is now a **dangling pointer**, an address that no longer refers to memory you own, and dereferencing it is undefined behaviour, exactly as dereferencing any other invalid pointer would be. `Memory errors: leaks, dangling pointers, use-after-free` covers the full range of mistakes this enables; this article stops at the mechanical fact that `free` frees the memory and nothing else.

### Wrong model: `free(p)` sets `p` to `NULL` automatically

**What is actually true:** Section 5's own output shows `p` printing the identical address both before and after `free` — nothing about calling `free` reaches back into the caller's variable. `free` is a function taking `p`'s value as a plain, pass-by-value argument, in exactly `Functions, parameters, and pass-by-value`'s sense: it receives a copy of the address, frees the memory that address names, and has no route back to the original variable at all, the same limitation any function has toward any parameter it did not receive through an explicit pointer to that variable itself. Setting `p = NULL;` after `free(p);`, by hand, is a real and common discipline for making an accidental later dereference at least detectable — but it is something you do, not something `free` does for you.

## 6. `realloc`

```c file=reallocdemo.c run
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int *a = malloc(3 * sizeof(*a));
    if (a == NULL)
        return 1;

    a[0] = 1;
    a[1] = 2;
    a[2] = 3;

    int *bigger = realloc(a, 5 * sizeof(*a));
    if (bigger == NULL) {
        free(a);
        return 1;
    }
    a = bigger;

    a[3] = 4;
    a[4] = 5;

    for (size_t i = 0; i < 5; i++)
        printf("a[%zu] is %d\n", i, a[i]);

    free(a);
    return 0;
}
```

```output
a[0] is 1
a[1] is 2
a[2] is 3
a[3] is 4
a[4] is 5
```

`realloc(p, newsize)` resizes a previous allocation, preserving the bytes already there up to the smaller of the old and new sizes. It does not necessarily resize in place: if the heap has no room to grow the existing block, `realloc` allocates a new block elsewhere, copies the old contents over, and frees the old block itself — which is why the result is captured into a separate variable, `bigger`, and checked for `NULL` before `a` is overwritten with it. Assigning straight into `a` — `a = realloc(a, ...)` — would, on failure, overwrite the only pointer to the original block with `NULL`, making that still-valid memory unreachable and therefore unfreeable, before the failure has even been detected.

## 7. Ownership

Every allocation needs exactly one place in the program responsible for eventually calling `free` on it — its **owner**. Section 1's `make_heap_int` allocates the memory but returns it, handing ownership to its caller rather than freeing it itself, which would be a mistake: freeing memory the caller still intends to use is exactly the kind of error `Memory errors: leaks, dangling pointers, use-after-free` catalogues. Ownership is a discipline enforced by nobody but the programmer — the type system does not distinguish an owning pointer from a borrowed one, so the only record of who is responsible is whatever the code's structure and comments make clear.

## 8. Returning allocated memory from a function

```c file=returnheap.c run
#include <stdio.h>
#include <stdlib.h>

int *make_squares(size_t n)
{
    int *a = malloc(n * sizeof(*a));
    if (a == NULL)
        return NULL;
    for (size_t i = 0; i < n; i++)
        a[i] = (int)(i * i);
    return a;
}

int main(void)
{
    int *squares = make_squares(5);
    if (squares == NULL)
        return 1;

    for (size_t i = 0; i < 5; i++)
        printf("squares[%zu] is %d\n", i, squares[i]);

    free(squares);
    return 0;
}
```

```output
squares[0] is 0
squares[1] is 1
squares[2] is 4
squares[3] is 9
squares[4] is 16
```

`make_squares` returns `a`'s value — a heap address — not `a` itself; `a` the local variable is gone once `make_squares` returns, exactly as any local is, but the memory it pointed to is not, since that memory was never part of `make_squares`'s stack frame to begin with. `main` receives the address as `squares`, and by section 7's ownership rule, becomes responsible for eventually freeing it — which it does, once it is done reading from it.

## 9. Why the stack cannot do this

`The stack and function calls` showed that returning the address of a stack-local variable hands back an address whose frame may already be reused by the very next call. Nothing in this article's `make_squares` is a special case avoiding that problem — `a`, the pointer variable, would be just as gone as any other local if you tried to read it after the call returned. What is different is *what `a` pointed to*: a block on the heap, whose lifetime was never tied to `make_squares`'s frame at all. The stack cannot offer this by its very structure — frames are pushed and popped strictly in call order, section 2 of `The stack and function calls`, so nothing on the stack can outlive the call that created it. The heap has no such ordering constraint; a block allocated first can be freed last, freed first, or freed in any order relative to every other allocation, which is exactly the flexibility returning data from a function to an arbitrarily distant caller requires.

## Exercises

1. What determines when automatic-lifetime storage begins and ends? What determines when allocated-lifetime storage begins and ends?

2. A program calls `malloc(10 * sizeof(int))` and gets back `NULL`. What does this mean, and what is unsafe about proceeding to write `p[0] = 1;` regardless?

3. Given `double *d;`, write the `malloc` call that allocates room for `20` `double`s, using the `sizeof(*d)` idiom from section 3 rather than spelling out `double`.

4. What is the key difference between what `malloc` and `calloc` guarantee about the contents of the memory they return?

5. Explain why `p = NULL;` immediately after `free(p);` is a habit the programmer has to add by hand, using section 5's own demonstration that `free` does not do this automatically.

6. Why does section 6's example assign `realloc`'s result to `bigger` first, rather than directly to `a`?

7. In section 8, `make_squares` returns `a`. Explain precisely which parts of `a` "disappear" when the function returns and which do not.

8. Using section 9, explain in one or two sentences why a function can safely return the address of heap-allocated memory but not the address of one of its own local variables.

## Answers

1. Automatic-lifetime storage begins when its declaring scope is entered and ends when that scope, ultimately its function's stack frame, is popped — managed entirely by the compiler, tied to `The stack and function calls`' push and pop. Allocated-lifetime storage begins at the specific `malloc` (or `calloc`/`realloc`) call that creates it and ends at the specific `free` call that releases it, with no connection to any function's frame.

2. It means the allocation failed — no memory was available to satisfy the request — and `p` does not hold a valid address at all; it holds `NULL`. `p[0] = 1;` would dereference `NULL`, which is undefined behaviour, exactly as dereferencing any other invalid pointer is.

3. `double *d = malloc(20 * sizeof(*d));` — `*d` is a `double`, so `sizeof(*d)` is `sizeof(double)`, computed automatically from `d`'s own declared type.

4. `malloc` makes no guarantee about the contents of the memory it returns — it is uninitialised, leftover bytes, following `Variables, types, and memory addresses`' general rule. `calloc` guarantees the memory is entirely zeroed.

5. Section 5 showed `p` printing the identical address both before and after `free(p);` — `free` receives only a copy of `p`'s value, by ordinary pass-by-value, and has no route back to the variable `p` itself to modify it. Since `free` cannot reach `p`, the only way `p` ends up `NULL` afterward is if the programmer's own code sets it there explicitly.

6. Because `realloc` can fail and return `NULL`, and on failure the original block pointed to by `a` is still valid and still needs to be freed. Assigning `a = realloc(a, ...)` directly would, on failure, overwrite `a` with `NULL`, losing the only pointer to the still-valid original allocation and making it impossible to free.

7. The local variable `a` itself — the storage holding the address, part of `make_squares`'s stack frame — disappears when the function returns, exactly as any local does. The memory `a` pointed to, the block `malloc` returned, does not disappear; it was never part of `make_squares`'s frame, and it persists until an explicit `free`, which is why `main` can still read `squares[0]` through `squares[4]` afterward.

8. Heap memory's lifetime is controlled entirely by explicit `malloc` and `free` calls and has no relationship to any function's stack frame, so it is still valid after the allocating function returns. A local variable's storage is part of its function's stack frame specifically, and that frame is popped, and its space made available for reuse, the instant the function returns — there is no version of "return its address" that is safe, because the frame is already gone by the time the caller could use that address.
