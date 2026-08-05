---
id: c-linking
title: "Multi-file programs, headers, and linking"
track: c
---

# Multi-file programs, headers, and linking

Every program in this book so far has been one file. Real programs are rarely one file for long: splitting code across several lets separate pieces be compiled, and understood, independently. Doing that honestly requires taking `Building and running a C program`'s compile-then-run cycle apart further than "the toolchain as a black box" needed to — there is a whole stage between compiling and running that a single-file program never exposes.

## 1. Translation units

The compiler processes one `.c` file at a time, together with everything its `#include` lines pull in, flattened by the preprocessor into one stream of text before the compiler itself ever runs. That flattened result is a **translation unit**. A program built from `point.c` and `main.c` has two translation units, compiled separately, each one compiled with no knowledge of what the other file contains beyond what it was explicitly told through a declaration.

## 2. Declaration versus definition, revisited

`Building and running a C program` first drew this line within a single file: a prototype declares a function, its body defines it, and the two can be written apart. Splitting across files is the same distinction, sharper: a function's **declaration** can live in a header, included by every file that calls it, while its **definition** lives in exactly one `.c` file, compiled once.

```c file=point.h nocompile
#ifndef POINT_H
#define POINT_H

struct point {
    int x;
    int y;
};

struct point point_new(int x, int y);
void point_print(struct point p);

#endif
```

```c file=point.c nocompile
#include <stdio.h>
#include "point.h"

struct point point_new(int x, int y)
{
    struct point p;
    p.x = x;
    p.y = y;
    return p;
}

void point_print(struct point p)
{
    printf("(%d, %d)\n", p.x, p.y);
}
```

```c file=main.c nocompile
#include "point.h"

int main(void)
{
    struct point p = point_new(3, 4);
    point_print(p);
    return 0;
}
```

These three files are not compiled individually by the harness in this book — they are a real, complete, three-file project, shown as three separate excerpts because that is what a multi-file project actually looks like. `point.h` declares; `point.c` defines; `main.c` only ever sees the declaration, through `#include "point.h"`, and that is enough for it to call both `point_new` and `point_print` correctly.

## 3. Header files and include guards

`#ifndef POINT_H` / `#define POINT_H` / `#endif` around `point.h`'s contents is an **include guard**. If anything ever causes `point.h` to be `#include`d twice within the same translation unit — directly, or indirectly through two other headers that each include it — the second `#include` finds `POINT_H` already defined and skips straight to `#endif`, seeing nothing the second time. Every header you write should have one.

### Wrong model: including a header twice is harmless if both copies are identical

**What is actually true:** the compiler does not check whether two copies of a definition agree before objecting to them — it objects to seeing `struct point` defined twice in one translation unit at all, word-for-word identical or not. Section 6 shows exactly this error, triggered directly rather than through a missing include guard; the guard's entire job is making sure the compiler never sees the second copy in the first place.

## 4. extern

A function needs only a prototype to be shared across files. A plain global variable needs `extern`, the keyword that means "this variable is defined somewhere — not necessarily here":

```c file=counter.h nocompile
#ifndef COUNTER_H
#define COUNTER_H

extern int counter;
void counter_increment(void);

#endif
```

```c file=counter.c nocompile
#include "counter.h"

int counter = 0;

void counter_increment(void)
{
    counter = counter + 1;
}
```

`extern int counter;` in the header is a declaration, promising a definition exists somewhere. `counter.c` fulfils that promise exactly once, with `int counter = 0;` and no `extern` — the one place `counter`'s actual storage is created. Any file that includes `counter.h` can read and write `counter` as though it were their own, because every one of them is reaching the same storage, defined in `counter.c` alone.

## 5. static for internal linkage

```c file=util.c nocompile
static int square(int n)
{
    return n * n;
}

void util_print_square(int n)
{
    printf("%d squared is %d\n", n, square(n));
}
```

`static` on a file-scope function gives it **internal linkage**: `square` is usable anywhere inside `util.c`, and invisible everywhere else, on purpose. Another file writing a matching prototype for `square` and trying to call it would compile — the prototype is enough to satisfy the compiler — and then fail exactly the way section 6 fails, because as far as the linker is concerned, no definition of `square` exists outside `util.c` at all.

## 6. Distinguishing compiler errors from linker errors

```c file=undefinedref.c expect_fail
void undefined_function(void);

int main(void)
{
    undefined_function();
    return 0;
}
```

This has a prototype for `undefined_function`, so the compiler accepts the call without complaint — a prototype is all it needs to check the call is well-formed. What fails is the step after compiling: the **linker**, which searches every translation unit for an actual definition of `undefined_function` and finds none.

```output
/usr/bin/ld: undefinedref.o: in function `main':
undefinedref.c:(.text+0x9): undefined reference to `undefined_function'
collect2: error: ld returned 1 exit status
```

Compare that shape to `Building and running a C program`'s compiler error: no file-and-line pointing at your source, no caret, nothing about syntax at all — a linker error names the missing *symbol* instead, because by this stage there is no source text left to point at, only translation units' worth of compiled code waiting to be stitched together.

```c file=redefinition.c expect_fail
struct point {
    int x;
    int y;
};

struct point {
    int x;
    int y;
};

int main(void)
{
    return 0;
}
```

This one fails during compiling itself, before linking is ever reached — a genuine compiler error, "redefinition of `point`," from writing the same type twice in one file. This is precisely what an un-guarded header, included twice, would hand the compiler.

### Wrong model: a program that compiles without error must have every function it calls properly defined

**What is actually true:** compiling checks only that every call matches a known declaration — a prototype is sufficient, whether or not a definition exists anywhere in the program. Whether a definition actually exists is checked afterward, by the linker, as a separate stage with its own separate class of error. `undefinedref.c` above compiles cleanly and still fails to become a working program.

## 7. A minimal Makefile

```
prog: point.c main.c
	gcc -Wall -Wextra -std=c17 -o prog point.c main.c
```

A rule with `make` names what it builds, `prog`; what it depends on, `point.c` and `main.c`; and, on the indented line beneath, the exact command that builds it — the same `gcc` invocation you would type by hand, just saved under a name you can rerun with `make` instead of retyping. This is the smallest useful Makefile; real ones grow rules per source file so `make` only recompiles what actually changed, a refinement this book does not need yet.

## Exercises

1. What is a translation unit, and how does it relate to a single `.c` file?

2. In the `point.h` / `point.c` / `main.c` example, which file defines `struct point`, and which files only ever see it through `#include`?

3. Why does an include guard matter even when a header would only ever be included with textually identical content each time?

4. Predict what error results from calling a function that has a prototype but no definition anywhere in the program, and name the stage — compiling or linking — where it appears.

5. What does `extern int counter;` in a header actually promise, and which file is responsible for fulfilling that promise?

6. A function is declared `static` in `util.c`. Another file writes a matching prototype and tries to call it. What happens, and why?

7. Why is "the program compiled with zero errors" not, by itself, evidence that every function it calls has been properly defined somewhere?

8. In the Makefile in section 7, what two things does the indented build command need to be told?

## Answers

1. A translation unit is the flattened text the compiler actually processes in one pass: a `.c` file together with everything its `#include` lines pull in. Each `.c` file becomes its own translation unit, compiled with no direct knowledge of any other.

2. `point.h` contains `struct point`'s one definition. `point.c` and `main.c` both see it only through `#include "point.h"`; neither defines it independently.

3. Because the compiler does not check whether two definitions agree before rejecting them — it rejects seeing the same type or function defined twice in one translation unit regardless of whether the two copies are identical. The include guard's job is making sure the compiler never sees the second copy at all.

4. Compiling succeeds, since the prototype is enough to check the call is well-formed. Linking fails, with an "undefined reference" error naming the missing symbol, because the linker searches every translation unit for a definition and finds none.

5. It promises a variable named `counter` is defined somewhere in the program, with real storage. The file that writes `int counter = 0;` — without `extern` — is the one responsible for fulfilling that promise; every other file just borrows it.

6. Linking fails, the same way calling a truly undefined function fails. `static` gives `square` internal linkage, meaning it does not exist as far as any other translation unit's linking is concerned, prototype or not.

7. Because compiling only checks that calls match known declarations, which a prototype alone satisfies. Whether an actual definition exists anywhere in the program is a separate question, checked afterward by the linker; a program can compile perfectly and still fail to link into a working executable.

8. Which source files to compile and link together — `point.c` and `main.c` — and what name to give the resulting executable, `prog`.
