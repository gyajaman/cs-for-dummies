---
id: c-pointer-arithmetic
title: "Pointer arithmetic and array decay"
track: c
---

# Pointer arithmetic and array decay

`Arrays and contiguous memory` showed that `a[i]`'s address is computed as `a`'s address plus `i * sizeof(element)`, and that the compiler inserts this arithmetic every time `a[i]` appears. `Pointers` gave you a variable that holds an address and can be moved around independently of any particular array. This article puts the two together: pointers support arithmetic of their own, scaled by the type they point to, and that arithmetic is not a convenience layered on top of indexing — it is what indexing already was underneath.

## 1. `p + 1` scaled by the element size

```c file=ptrplus.c run
#include <stdio.h>

int main(void)
{
    int a[3] = {10, 20, 30};
    int *p = a;

    printf("*p is %d\n", *p);
    printf("*(p + 1) is %d\n", *(p + 1));
    printf("*(p + 2) is %d\n", *(p + 2));
    printf("byte offset from p to p + 1 is %ld\n", (long)((char *)(p + 1) - (char *)p));
    printf("sizeof(int) is %zu\n", sizeof(int));

    return 0;
}
```

```output
*p is 10
*(p + 1) is 20
*(p + 2) is 30
byte offset from p to p + 1 is 4
sizeof(int) is 4
```

`int *p = a;` copies the address of `a`'s first element into `p` — an array used where a pointer is expected supplies the address of its first element, the subject of section 3. `p + 1` does not mean "the address one *byte* after `p`"; it means "the address one *element* after `p`," and the compiler scales the `1` by `sizeof(int)` to get there, exactly the same scaling `Arrays and contiguous memory` used for `a[i]`. The byte offset printed above confirms it: moving `p` forward by `1` moved it forward by `4` bytes, `sizeof(int)`. `p + n` for any `n` moves forward by `n * sizeof(int)` bytes, and `p - n` moves backward by the same amount.

### Wrong model: `p + 1` advances the address by one byte

**What is actually true:** `p + 1` advances by `sizeof(*p)` bytes — one element's worth, not one byte. Section 1's own output shows this: `p` is `int *`, and `p + 1` lands `4` bytes further on, not `1`. A `char *` does advance by one byte per `+ 1`, since `sizeof(char)` is `1`, which is exactly why `char *` is the type reached for whenever byte-at-a-time movement is actually wanted, and why the code above casts to `char *` specifically to measure the offset in bytes rather than in `int`s.

## 2. Pointer difference

```c file=ptrdiff.c run
#include <stdio.h>

int main(void)
{
    int a[5] = {10, 20, 30, 40, 50};
    int *first = &a[0];
    int *last = &a[4];

    printf("last - first is %ld elements\n", (long)(last - first));
    printf("as bytes, that is %ld\n", (long)((char *)last - (char *)first));

    return 0;
}
```

```output
last - first is 4 elements
as bytes, that is 16
```

Subtracting two pointers into the same array gives the number of *elements* between them, not bytes — `last - first` is `4`, matching the index difference `4 - 0`, even though the two addresses are `16` bytes apart (`4` elements times `sizeof(int)`, `4` bytes each). The division by the element size happens automatically, the mirror image of section 1's multiplication. Subtracting pointers into two different, unrelated arrays is undefined behaviour: the result would claim a number of elements between two addresses that were never part of the same sequence, and nothing about that number would mean anything.

## 3. Array-to-pointer decay

```c file=decay.c run
#include <stdio.h>

void report(int *p)
{
    printf("inside report, sizeof(p) is %zu\n", sizeof(p));
}

int main(void)
{
    int a[10];
    printf("inside main, sizeof(a) is %zu\n", sizeof(a));
    report(a);
    return 0;
}
```

```output
inside main, sizeof(a) is 40
inside report, sizeof(p) is 8
```

`a` is passed to `report` by writing just `a`, with no `&`, yet `report` receives a pointer, not an array — because whenever an array is used in an expression, other than as the operand of `sizeof` or `&`, it **decays** to a pointer to its first element. Passing `a` decays it to `&a[0]`, so `report`'s parameter has to be declared `int *`, and that is genuinely a different type from `int [10]`: `sizeof(a)` inside `main` is `40`, the whole array, while `sizeof(p)` inside `report` is `8`, one pointer, because by the time `report` runs, all that arrived was an address — the "array-ness," the fact that ten `int`s follow it contiguously, was not part of what got passed.

### Wrong model: `sizeof` inside a function reports the size of the array it was given

**What is actually true:** A function parameter declared `int p[]` or `int p[10]` is, by the language rules, still exactly `int *p` — decay applies to parameter declarations too, silently. `sizeof(p)` inside such a function is always `sizeof(int *)`, `8`, regardless of what the caller's array size was or what number was written inside the brackets in the parameter declaration; that number is not enforced or even retained. Section 3's `report` makes this concrete: `40` outside, `8` inside, for the identical array. This is exactly why the count has to be passed explicitly, section 5's subject — the callee has no other way to recover it.

## 4. Passing an array with an explicit length

```c file=explicitlen.c run
#include <stdio.h>

int sum(int *p, size_t n)
{
    int total = 0;
    for (size_t i = 0; i < n; i++)
        total = total + p[i];
    return total;
}

int main(void)
{
    int a[5] = {1, 2, 3, 4, 5};
    printf("sum is %d\n", sum(a, sizeof(a) / sizeof(a[0])));
    return 0;
}
```

```output
sum is 15
```

Since decay strips the element count away, any function that needs to know how far an array extends has to be told separately — `sum` takes `n` as its own parameter, computed at the call site with `Arrays and contiguous memory`'s `sizeof(a) / sizeof(a[0])` idiom, while `sizeof(a)` is still `a`, the full array, and has not yet decayed. Inside `sum`, `p[i]` works exactly as `a[i]` did outside it — indexing does not care whether the pointer being indexed came from decay or was declared directly — because, as section 6 makes precise, they were never different operations to begin with.

## 5. One-past-the-end

```c file=onepastend.c run
#include <stdio.h>

int main(void)
{
    int a[4] = {10, 20, 30, 40};
    int *begin = &a[0];
    int *end = &a[4];

    int total = 0;
    for (int *p = begin; p != end; p++)
        total = total + *p;

    printf("total is %d\n", total);
    return 0;
}
```

```output
total is 100
```

`&a[4]` computes the address one element past the last valid one, `a[3]`. Computing this address is explicitly legal in C, even though `a[4]` itself is out of bounds — `Arrays and contiguous memory` already established that reading or writing `a[4]` is undefined behaviour, and that has not changed. What is new is that *forming the address itself*, without dereferencing it, is a defined operation, useful precisely as a stopping point: the loop above walks `p` from `begin` to `end`, comparing addresses rather than counting indices, and stops the instant `p` reaches `end`, never dereferencing it. This one-past-the-end address is the C convention that ranges like this build on throughout the rest of the book.

### Wrong model: A one-past-the-end pointer is safe to dereference because it doesn't crash

**What is actually true:** Forming `&a[4]` is legal; dereferencing it, `*end`, is undefined behaviour, exactly like `a[4]` — it reads whatever memory happens to sit immediately after `a`, which might belong to another variable entirely. Section 5's loop never dereferences `end`; it only compares `p` against it as a stopping condition, `p != end`, which is the one operation the one-past-the-end address is guaranteed to support safely. Nothing about the address failing to crash when dereferenced would mean the read was valid — `Arrays and contiguous memory`'s point about undefined behaviour not reliably crashing applies here without modification.

## 6. The equivalence of `a[i]` and `*(a + i)`

```c file=equivalence.c run
#include <stdio.h>

int main(void)
{
    int a[4] = {10, 20, 30, 40};

    printf("a[2] is %d\n", a[2]);
    printf("*(a + 2) is %d\n", *(a + 2));

    return 0;
}
```

```output
a[2] is 30
*(a + 2) is 30
```

`a[i]` is, by definition, exactly `*(a + i)`: `a` decays to a pointer to its first element, `+ i` advances that pointer by `i` elements as in section 1, and `*` dereferences the result. The two are not two operations that happen to agree — `a[i]` is notation for the second form, nothing more. This is also why `a[i]` and `i[a]` compute the same thing: `*(a + i)` and `*(i + a)` are the same expression once addition is known to commute, though writing it as `i[a]` is a curiosity to understand, not a style to use.

## Exercises

1. Given `int a[6]; int *p = a;`, what address does `p + 3` hold, in terms of `a`'s address and `sizeof(int)`?

2. Given `int *first = &a[1]; int *last = &a[5];` for some array `a`, what does `last - first` evaluate to, and what would `(char *)last - (char *)first` evaluate to instead, assuming `sizeof(int)` is `4`?

3. A function is declared `void f(int arr[20])`. What is `sizeof(arr)` inside `f`, and why does the `20` not change the answer?

4. Rewrite `sum` from section 4 so that it is called as `sum(a, 5)` with a literal `5` instead of the `sizeof` idiom. What has to be true about the caller for this to still be correct?

5. Explain why `&a[n]` is legal to compute for an `n`-element array `a`, but `a[n]` is not legal to dereference.

6. Using section 6, expand `a[3]` into its `*(a + i)` form, then explain in one sentence why `3[a]` computes the identical value.

7. A student writes a loop using `int *p = &a[0]; int *end = &a[10];` and then, inside the loop body, dereferences `end` on the final iteration by mistake. What kind of error is this, and does the program failing to crash prove it is correct?

## Answers

1. `p + 3` holds the address `a`'s address `+ 3 * sizeof(int)` — three elements further along, scaled by `sizeof(int)`, exactly as `Arrays and contiguous memory`'s `a[i]` formula computes it.

2. `last - first` is `4` — the number of elements between index `1` and index `5`. `(char *)last - (char *)first` is `16` bytes, `4` elements times `sizeof(int) = 4`.

3. `sizeof(arr)` is `sizeof(int *)`, `8` — a function parameter written `int arr[20]` still decays to `int *arr`, and the `20` is not retained or enforced anywhere in the compiled function.

4. `int sum(int *p, size_t n) { ... }` called as `sum(a, 5)`. This is correct only if the caller supplies the true element count as the literal — nothing checks that `5` actually matches `a`'s real size, so a mismatched literal would make `sum` read past or short of the array with no warning.

5. `&a[n]` only computes an address — one past the last valid element — without reading or writing through it, which the C standard explicitly permits as a well-defined address, even though it does not belong to `a`. `a[n]` dereferences that same address, reading memory that is not part of `a`, which is undefined behaviour exactly as `Arrays and contiguous memory` described for any out-of-bounds access.

6. `a[3]` is `*(a + 3)`. `3[a]` is `*(3 + a)`, and addition commutes, so `3 + a` and `a + 3` are the same address — `3[a]` and `a[3]` were never different expressions once the `[]` notation is unfolded into pointer arithmetic.

7. This is undefined behaviour, the same one-past-the-end dereference from section 5's misconception, not a defined error the language catches. The program not crashing proves nothing about correctness — the read still touched memory outside `a`, and the absence of a visible symptom is exactly the danger `Arrays and contiguous memory` already warned about for any out-of-bounds access.
