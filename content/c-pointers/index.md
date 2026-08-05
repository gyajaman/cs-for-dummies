---
id: c-pointers
title: "Pointers"
track: c
---

# Pointers

`&n` has appeared in almost every article since `The machine model`: an address, printed, looked at, never kept. This article is where you stop just looking and start keeping one — declaring a variable whose job is to hold an address, and using it to reach back into the storage it names. Nothing conceptually new is happening; `Variables, types, and memory addresses` already said a type is a size plus an interpretation, and a pointer is exactly that, applied to the idea of an address itself.

## 1. A pointer as a typed address

```c file=holdaddress.c run
#include <stdio.h>

int main(void)
{
    int n = 42;
    int *p = &n;
    printf("n is %d, stored at %p\n", n, (void *)&n);
    printf("p holds the address %p\n", (void *)p);
    printf("sizeof(p) is %zu\n", sizeof(p));
    return 0;
}
```

```output
n is 42, stored at {{ANY}}
p holds the address {{ANY}}
sizeof(p) is 8
```

`int *p` declares `p` as a variable of type "pointer to `int`" — its own storage, its own address, exactly like any other variable, except that the value stored *in* `p` is itself an address: `n`'s. Run this and compare the two printed addresses; they are identical, because `p` was initialised with exactly `&n`. `sizeof(p)` is `8` on every machine this book targets — the size of an address itself, the same for a pointer to any type, since a pointer's job is always to hold one address, regardless of what lives there.

## 2. Dereference

```c file=deref.c run
#include <stdio.h>

int main(void)
{
    int n = 42;
    int *p = &n;

    printf("*p is %d\n", *p);
    *p = 100;
    printf("n is now %d\n", n);

    return 0;
}
```

```output
*p is 42
n is now 100
```

`*p` is the **dereference** operator: given an address, go there and read — or, on the left of an assignment, write — the value stored at it. `*p = 100;` does not change what address `p` holds; it changes the `int` living at that address, which happens to be `n`'s own storage. `n` becomes `100` because `*p` and `n` were never two different things — `p` just holds `n`'s address, and dereferencing it reaches `n` directly.

## 3. NULL

```c file=nullcheck.c run
#include <stdio.h>

int main(void)
{
    int n = 5;
    int *p = &n;
    int *q = NULL;

    if (p != NULL)
        printf("p points somewhere\n");

    if (q == NULL)
        printf("q points nowhere\n");

    return 0;
}
```

```output
p points somewhere
q points nowhere
```

`NULL` is a pointer value guaranteed to not be the address of any real object — a deliberate, checkable way to say "this pointer does not point anywhere valid right now." Dereferencing a `NULL` pointer is undefined behaviour, not a graceful failure, which is exactly why code checks for it first, as both `if`s above do, rather than finding out by dereferencing and seeing what happens.

## 4. Pointer to pointer

```c file=pointertopointer.c run
#include <stdio.h>

int main(void)
{
    int n = 7;
    int *p = &n;
    int **pp = &p;

    printf("n is %d\n", n);
    printf("*p is %d\n", *p);
    printf("**pp is %d\n", **pp);

    return 0;
}
```

```output
n is 7
*p is 7
**pp is 7
```

`p` is a variable, which means it has its own address too, and nothing stops you from taking it: `int **pp = &p;` declares `pp` as a pointer to a pointer to `int`, holding `p`'s address. `*pp` dereferences once, giving you back `p` itself — the address it holds. `**pp` dereferences twice: once to reach `p`, once more to reach `n`. Each `*` peels back exactly one layer of address.

## 5. Out-parameters

`Functions, parameters, and pass-by-value` demonstrated, deliberately, that a function cannot change the caller's variable — only its own local copy. That was never the whole story; it was true because every example passed a value. Passing an address instead changes what is reachable:

```c file=outparam.c run
#include <stdio.h>

void increment(int *x)
{
    *x = *x + 1;
}

int main(void)
{
    int n = 5;
    increment(&n);
    printf("n is now %d\n", n);
    return 0;
}
```

```output
n is now 6
```

`increment` still only ever receives a copy — pass-by-value has not been repealed. What got copied this time is `n`'s *address*, not `n`'s value, and a copy of an address still points at the original. `*x = *x + 1;` dereferences that copied address and writes through it, reaching `n` directly, the same way section 2's `*p = 100;` reached `n` through `p`. A parameter used this way, purely to hand a value back out through an address rather than through `return`, is called an **out-parameter**.

## 6. Swap

```c file=swap.c run
#include <stdio.h>

void swap(int *a, int *b)
{
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main(void)
{
    int x = 1;
    int y = 2;
    printf("before: x is %d, y is %d\n", x, y);
    swap(&x, &y);
    printf("after: x is %d, y is %d\n", x, y);
    return 0;
}
```

```output
before: x is 1, y is 2
after: x is 2, y is 1
```

Swapping two variables' values is impossible to write with plain parameters — `Functions, parameters, and pass-by-value` never had the tools for it, and this is the reason `swap` had no correct version until now. Given the *addresses* of `x` and `y` instead of copies of their values, `swap` can dereference both, exactly as `increment` did, to reach the caller's actual storage and rearrange what lives there.

## 7. Why the pointed-to type matters

```c file=typematters.c run
#include <stdio.h>

int main(void)
{
    int n = 1000;
    int *pi = &n;
    unsigned char *pc = (unsigned char *)&n;

    printf("*pi reads all %zu bytes as one int: %d\n", sizeof(*pi), *pi);
    printf("*pc reads just %zu byte: %u\n", sizeof(*pc), *pc);

    return 0;
}
```

```output
*pi reads all 4 bytes as one int: 1000
*pc reads just 1 byte: 232
```

`pi` and `pc` hold the exact same address — `&n` — yet `*pi` and `*pc` read completely different things, because dereferencing does not just "get the value at an address"; it reads however many bytes the pointer's type says to read, and interprets them however that type says to. `*pi` reads all `4` bytes of `n` as an `int`: `1000`. `*pc` reads only the first, single byte, as an `unsigned char`: `232`, the same least-significant byte `The machine model` and `Integer representation, fixed width, and overflow` would predict from `1000`'s bit pattern. The type is not decoration on a pointer — it is what makes dereferencing mean anything specific at all. Doing arithmetic on a pointer, `p + 1` and beyond, depends on this same type just as heavily; that is `Pointer arithmetic and array decay`'s subject.

### Wrong model: a pointer contains the value it points to

**What is actually true:** a pointer contains an address, and nothing else — the value lives separately, at that address, in storage the pointer merely names. `p` in section 1 never held `42`; it held `n`'s address, and `42` stayed exactly where it always was, in `n`'s own storage. Reaching the value takes an explicit step, dereferencing, precisely because the pointer and the value are two different things at two different addresses, one of which happens to point at the other.

### Wrong model: a NULL pointer and an uninitialised pointer are the same thing

**What is actually true:** `NULL` is one specific, well-defined value, deliberately assigned. An uninitialised pointer, declared with no `= value`, follows the exact same rule `Variables, types, and memory addresses` established for every uninitialised variable: its bits are whatever was already sitting in that storage, not `NULL`, not any particular value at all. `p != NULL` says nothing useful about a pointer nobody has ever assigned — it might not be `NULL` by sheer accident of leftover bits, and dereferencing it is exactly as dangerous as dereferencing one you know is `NULL`, for exactly the same reason: neither one has ever been pointed anywhere meaningful.

## Exercises

1. Given `int n = 9; int *p = &n;`, what is stored inside `p` itself — `9`, `n`'s address, or something else?

2. Why is `sizeof(p)` the same, `8`, whether `p` is declared `int *p` or `double *p`, even though `int` and `double` are different sizes?

3. In section 5, explain why `increment` is able to change `n` in `main`, when the plain-parameter functions in `Functions, parameters, and pass-by-value` could not.

4. Trace `swap(&x, &y)` in section 6 line by line: what does `temp` hold after the first line of `swap`'s body, and why is a third variable needed at all?

5. In section 7, `pi` and `pc` hold the same address. Explain why `*pi` and `*pc` nonetheless produce different results.

6. A student writes `int *p; if (p != NULL) { ... }` without ever assigning `p`. What is wrong with using this check to decide whether it is safe to dereference `p`?

7. What does `**pp` mean, given `int **pp = &p;` and `int *p = &n;`? Describe what each of the two `*`s does.

8. Explain, in one or two sentences, why "a pointer holds the value" and "a pointer holds the address of the value" are not just two ways of saying the same thing.

## Answers

1. `n`'s address. `p` never holds `9`; it holds wherever `n` lives, and dereferencing `p` is the separate step that reaches `9`.

2. A pointer's size is the size of an address, not the size of whatever it points to. Every pointer, regardless of the type it points to, holds exactly one address, so they are all the same size on a given machine — `8` bytes on the ones this book targets.

3. `increment` receives a copy of `n`'s address, not a copy of `n`'s value. Dereferencing that copied address, `*x = *x + 1;`, reaches `n`'s actual storage directly, which plain pass-by-value never allowed, since a copied value has no route back to where it came from.

4. After `int temp = *a;`, `temp` holds a copy of `x`'s value, `1`. A third variable is needed because `*a = *b;` would otherwise overwrite `x`'s value with `y`'s before `x`'s original value had been saved anywhere, making it impossible to give `y` `x`'s original value afterward.

5. `pi` is `int *`, so `*pi` reads all `4` bytes at that address, interpreted as an `int`. `pc` is `unsigned char *`, so `*pc` reads only the first `1` byte, interpreted as an `unsigned char`. Same address, different type, different number of bytes read, different interpretation of those bytes.

6. `p` was never assigned, so it holds whatever leftover bits happened to already be in its storage — not necessarily `NULL`, and not necessarily any particular value. `p != NULL` being true tells you nothing except that those leftover bits do not happen to equal `NULL`; the address they do represent, if any, was never set deliberately, and dereferencing it is just as dangerous as dereferencing a known-`NULL` pointer.

7. `**pp` dereferences twice. The first `*` reaches `p`, the address `pp` holds. The second `*` dereferences `p` itself, reaching `n`, the address `p` holds. Each `*` peels back exactly one layer of "address of."

8. Because they describe two different addresses. "The value" is stored at its own address; "the address of the value" is a completely separate quantity, stored at the pointer's own, different address. Confusing the two is exactly the difference between reading a variable directly and reading a pointer to it without dereferencing.
