---
id: c-function-pointers
title: "Function pointers"
track: c
---

# Function pointers

`Pointers` held the address of an `int`, and dereferencing reached the `int` living there. `The machine model` established something else early on and then mostly left alone: instructions are bytes in memory too, at their own addresses, fetched by `PC` exactly like any other read. A function's compiled code lives somewhere, which means a function has an address, which means a pointer can hold it — a **function pointer** — and calling through that pointer means "go to this address and start executing," the same fetch-decode-execute loop running on a destination chosen at runtime instead of hard-coded into the calling instruction.

## 1. Syntax and taking a function's address

```c file=fpbasic.c run
#include <stdio.h>

int add(int a, int b) { return a + b; }
int multiply(int a, int b) { return a * b; }

int main(void)
{
    int (*fp)(int, int) = add;
    printf("fp(3, 4) is %d\n", fp(3, 4));

    fp = &multiply;
    printf("fp(3, 4) is now %d\n", fp(3, 4));

    return 0;
}
```

```output
fp(3, 4) is 7
fp(3, 4) is now 12
```

`int (*fp)(int, int)` declares `fp` as a variable holding the address of a function that takes two `int`s and returns an `int` — the parentheses around `*fp` are required, since `int *fp(int, int)` would instead declare a function named `fp` returning `int *`, a completely different type. `fp`'s own type has to match exactly the functions it is going to point at: return type and parameter types, not just "some function."

A function name, written on its own, already denotes its address — `fp = add;` and `fp = &multiply;` both compile and both work, with or without the explicit `&`, because a bare function name in an expression is a pointer to that function, needing no address-of operator to become one. `fp` starts pointing at `add`, then is reassigned to point at `multiply` instead; the same variable, the same call syntax, `fp(3, 4)`, produces a different computation purely because `fp` holds a different address the second time.

## 2. Calling through a pointer

```c file=fpcall.c run
#include <stdio.h>

int add(int a, int b) { return a + b; }

int main(void)
{
    int (*fp)(int, int) = add;

    printf("fp(3, 4) is %d\n", fp(3, 4));
    printf("(*fp)(3, 4) is %d\n", (*fp)(3, 4));

    return 0;
}
```

```output
fp(3, 4) is 7
(*fp)(3, 4) is 7
```

`fp(3, 4)` and `(*fp)(3, 4)` are both valid and compute the identical call — the explicit dereference is never required, since a function pointer used in call position is understood to mean "call the function at this address" either way. `fp(3, 4)` is the form actually used in practice; `(*fp)(3, 4)` exists mostly to make the mechanism visible the first time it is seen — dereferencing an address and then invoking whatever code sits there, no different in kind from dereferencing an `int *` to reach the `int` sitting at that address.

## 3. Passing behaviour as an argument

```c file=applyeach.c run
#include <stdio.h>

int square(int x) { return x * x; }
int negate(int x) { return -x; }

void apply_to_each(int *a, int n, int (*f)(int))
{
    for (int i = 0; i < n; i++)
        a[i] = f(a[i]);
}

int main(void)
{
    int a[5] = {1, 2, 3, 4, 5};

    apply_to_each(a, 5, square);
    for (int i = 0; i < 5; i++)
        printf("%d ", a[i]);
    printf("\n");

    apply_to_each(a, 5, negate);
    for (int i = 0; i < 5; i++)
        printf("%d ", a[i]);
    printf("\n");

    return 0;
}
```

```output
1 4 9 16 25 
-1 -4 -9 -16 -25 
```

`apply_to_each`'s third parameter, `int (*f)(int)`, lets the *caller* decide what operation runs on every element, without `apply_to_each` itself containing any code specific to squaring or negating — the loop is written once, and `f`'s identity is supplied fresh at each call site. This is the entire point of a function pointer as a parameter: previously, every function's behaviour was fixed by its own body, decided once, at the point it was written; a function pointer parameter defers that decision to whoever calls it, exactly as an `int` parameter defers *which number* to whoever calls it.

## 4. The `qsort` comparator

```c file=qsortdemo.c run
#include <stdio.h>
#include <stdlib.h>

int cmp_int(const void *a, const void *b)
{
    int x = *(const int *)a;
    int y = *(const int *)b;
    if (x < y)
        return -1;
    if (x > y)
        return 1;
    return 0;
}

int main(void)
{
    int a[6] = {5, 3, 8, 1, 9, 2};

    qsort(a, 6, sizeof(int), cmp_int);

    for (int i = 0; i < 6; i++)
        printf("%d ", a[i]);
    printf("\n");

    return 0;
}
```

```output
1 2 3 5 8 9 
```

`<stdlib.h>`'s `qsort` sorts any array of any element type, which is only possible because it does not know, and does not need to know, how to compare two elements — that decision is handed to it as a function pointer, the **comparator**, supplied by the caller. `qsort`'s comparator contract fixes the signature — `int (*)(const void *, const void *)` — and the meaning of its return value: negative if the first argument should sort before the second, positive if after, zero if they are equivalent for ordering purposes, exactly the convention `cmp_int` follows. `const void *` is a pointer to an unknown, unspecified, and here `const`-qualified (read-only) type; `cmp_int` recovers the actual type by casting each `const void *` back to `const int *` before dereferencing, since `qsort` itself is written once, generically, with no idea it is being used on `int`s specifically this time.

## 5. Dispatch tables

```c file=dispatch.c run
#include <stdio.h>

int op_add(int a, int b) { return a + b; }
int op_sub(int a, int b) { return a - b; }
int op_mul(int a, int b) { return a * b; }

int main(void)
{
    int (*ops[3])(int, int) = { op_add, op_sub, op_mul };
    const char *names[3] = { "add", "sub", "mul" };

    for (int i = 0; i < 3; i++)
        printf("%s(6, 2) = %d\n", names[i], ops[i](6, 2));

    return 0;
}
```

```output
add(6, 2) = 8
sub(6, 2) = 4
mul(6, 2) = 12
```

`int (*ops[3])(int, int)` declares an array of three function pointers, all sharing the same signature — an ordinary array, exactly as `Arrays and contiguous memory` described, just holding function addresses instead of `int`s. Indexing into it, `ops[i]`, selects which function runs, and calling `ops[i](6, 2)` runs it — a **dispatch table**: choosing behaviour by array index rather than by a chain of `if`/`else if` comparing `i` against every case by hand. Adding a fourth operation means adding one more entry to `ops` (and `names`), not adding another branch to an ever-growing conditional; the loop that calls through the table never has to change at all.

### Wrong model: A function pointer variable can point at functions with different signatures interchangeably

**What is actually true:** `int (*fp)(int, int)` can only correctly point at functions taking exactly two `int`s and returning `int` — `fp`'s declared type is part of what the compiler checks an assignment against, exactly as `int *` and `double *` are different, incompatible pointer types despite both being "just addresses." Section 5's `ops` array requires every element to share the identical signature for the same reason: `ops[i](6, 2)` compiles because the compiler knows, from `ops`'s own declared type, exactly how many arguments to pass and of what types, and exactly what type to expect back — information that comes entirely from the pointer's type, not from inspecting whatever function happens to be stored there at runtime.

## Exercises

1. Given `int (*fp)(double, double)`, what has to be true about a function `f` for `fp = f;` to compile correctly?

2. Explain why `fp(3, 4)` and `(*fp)(3, 4)` in section 2 produce identical results, referencing what a function name denotes on its own.

3. In section 3, why does `apply_to_each` not need to be rewritten to support a third operation, such as cubing each element?

4. Using section 4, explain what `cmp_int` returning `0` communicates to `qsort`, and why `qsort` itself never needs to know it is sorting `int`s specifically.

5. Rewrite section 5's dispatch table to add a fourth operation, integer division (ignore division by zero), listing exactly which lines change.

6. A student declares `int (*fp)(int)` and tries to assign it a function `double square(double x)`. Using section 5's wrong-model box, explain why this does not compile.

7. Explain, using `The machine model`'s stored-program idea, why a function's address is a meaningful thing to hold in a variable at all.

## Answers

1. `f` has to take exactly two `double` parameters and return `double` — `fp`'s declared type, `int (*)(double, double)`, fixes both the parameter types and the return type that any function assigned to it must match exactly.

2. A function name used in an expression already denotes the function's address, with no explicit dereference required to call through it — `fp(3, 4)` calls directly through the address `fp` holds, and `(*fp)(3, 4)` dereferences that same address first, which C treats as an equally valid, equivalent way of writing the identical call.

3. `apply_to_each`'s loop only ever calls `f(a[i])`, with `f` supplied by whoever calls `apply_to_each` — adding a cubing function elsewhere in the program and passing it as `apply_to_each(a, 5, cube)` requires no change to `apply_to_each` itself, since the specific operation was never hard-coded into its body in the first place.

4. Returning `0` tells `qsort` the two elements being compared are equivalent for ordering purposes — neither has to come before the other. `qsort` never needs to know the element type because every type-specific decision, including what "equal," "before," and "after" mean for that type, is delegated entirely to the comparator function it is handed; `qsort`'s own code only ever calls that function and interprets the sign of its return value.

5. Add `int op_div(int a, int b) { return a / b; }` alongside the other three function definitions; change the array declarations to `int (*ops[4])(int, int) = { op_add, op_sub, op_mul, op_div };` and `const char *names[4] = { "add", "sub", "mul", "div" };`; change the loop bound from `3` to `4`. No other line needs to change.

6. `fp`'s declared type, `int (*)(int)`, requires a function taking one `int` and returning `int`. `square` takes a `double` and returns `double` — a different signature entirely, not merely a different name — so assigning it to `fp` is a type mismatch the compiler rejects, exactly as the wrong-model box states: a function pointer's type fixes exactly which signatures are compatible, not merely "any function."

7. `The machine model` established that instructions are ordinary bytes in memory, fetched from whatever address `PC` currently holds — a function's compiled body is simply a range of such bytes starting at a specific address, the same kind of thing any other data occupies. Holding that starting address in a variable and later using it to redirect execution there is not a special case bolted onto the language; it follows directly from code being addressable memory in the first place, exactly like any other data the CPU can be pointed at.
