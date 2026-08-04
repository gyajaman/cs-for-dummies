---
id: c-variables-types-addresses
title: "Variables, types, and memory addresses"
track: c
---

# Variables, types, and memory addresses

Every program from here on declares variables. This article is where they stop being magic. A variable is not a labelled container the machine understands — you already met that claim in `The machine model` — it is a name your source file uses for a fixed address, together with a type that says how many bytes live there and how to interpret them. Everything else here follows from that one sentence.

## 1. Declaring a variable

```c file=declare.c run
#include <stdio.h>

int main(void)
{
    int n;
    n = 7;
    printf("n is %d\n", n);
    return 0;
}
```

```output
n is 7
```

`int n;` is a **declaration**: it introduces the name `n`, gives it the type `int`, and — because it appears inside a function body with no further qualification — it is also a **definition**: storage for `n` actually comes into existence at this point. For a local variable like this one, declaration and definition happen in the same statement, so the distinction is invisible for now. It becomes visible later, once a declaration and its definition can be in different places entirely; `Multi-file programs, headers, and linking` covers that case.

`n = 7;` is a separate statement, an assignment, covered properly in section 5.

`%d` in the format string is new: it tells `printf` to read the next argument as an `int` and print it in decimal. Section 2 explains why the format specifier has to match the type.

## 2. A type is size plus interpretation

`The machine model` established that memory is untyped: a byte is a byte, and meaning is supplied entirely by the code that reads it. A **type** is exactly that supplied meaning, fixed at compile time. `int n;` reserves `sizeof(int)` bytes — 4, on every machine this book assumes — and every later use of `n` reads or writes those same 4 bytes, interpreted as a signed integer.

```c file=sizes.c run
#include <stdio.h>

int main(void)
{
    printf("char:   %zu byte\n", sizeof(char));
    printf("int:    %zu bytes\n", sizeof(int));
    printf("double: %zu bytes\n", sizeof(double));
    return 0;
}
```

```output
char:   1 byte
int:    4 bytes
double: 8 bytes
```

`sizeof` is an operator, not a function: it does not evaluate its argument, it asks the compiler how many bytes a type, or an already-declared variable, occupies — and for these types the answer is known before the program ever runs. `sizeof(char)` is exactly `1` by definition; a byte and a `char` are the same size in C, part of why `The machine model` could describe memory in bytes in the first place. The other sizes are not guaranteed by the language, only conventional — every machine this book targets agrees on them.

This is also why the format specifier in `printf` has to match the type: `%d` tells `printf` to read 4 bytes off the argument list and interpret them as an `int`. Hand it a `double`, which is 8 bytes with a completely different bit layout, and `printf` reads the wrong number of bytes the wrong way. The compiler is not always able to catch this for you.

## 3. The address-of operator

Every variable's bytes start somewhere. `&` gives you that address:

```c file=address.c run
#include <stdio.h>

int main(void)
{
    int n = 1000;
    printf("n is %d, stored at %p\n", n, (void *)&n);
    return 0;
}
```

```output
n is 1000, stored at {{ANY}}
```

`&n` is not a value computed from `n`'s contents; it is a property of where `n` lives, fixed for as long as `n` exists. `(void *)` is a cast, needed here only because `%p` expects the generic pointer type rather than specifically the address of an `int` — a distinction that starts to matter once you can name the address itself, in `Pointers`.

Put sections 2 and 3 together and you have the full picture `The machine model` promised: a variable is an address, a size in bytes starting there, and a type that says how to interpret them.

## 4. Scope and lifetime

A variable declared inside a block exists, as a name, only for the rest of that block:

```c file=shadow.c run
#include <stdio.h>

int main(void)
{
    int x = 1;
    printf("outer x is %d\n", x);

    {
        int x = 2;
        printf("inner x is %d\n", x);
    }

    printf("outer x is still %d\n", x);
    return 0;
}
```

```output
outer x is 1
inner x is 2
outer x is still 1
```

The inner `{ }` introduces a nested block with its own `x`: a completely separate variable that happens to share a name with the outer one. Inside the inner block, the name `x` refers to the inner variable, and the outer one is simply not reachable by that name until the inner block ends. Nothing about the outer `x` changed.

Variables declared this way, inside a function body with no special keyword, have **automatic** storage duration: their storage comes into existence when execution reaches the declaration, and stops being valid once the enclosing block ends. Where that storage actually lives, and what "stops being valid" means mechanically, is the subject of `The stack and function calls`. For now, the rule you need is narrower: never assume a variable's storage still holds anything meaningful once its block has ended.

### Wrong model: the inner `x` changes the outer `x`

A common misreading of the trace above is that the second `printf` overwrites the outer variable, and the third line "changes it back" somehow.

**What is actually true:** there were two variables the entire time, `x` in the outer block and a different `x` in the inner block, occupying different storage. The inner declaration does not touch the outer variable at all — it introduces a new name binding that happens to shadow the old one for as long as the inner block is executing. The outer `x` was never `2`. It was `1` the whole time; the program simply had no way to say so while the inner name was in effect.

## 5. Assignment is a write to an address

`n = 7;` from section 1 does exactly what `The machine model` said writing does: it computes the value on the right, `7`, and writes it to the address associated with `n` on the left, replacing whatever was there.

```c file=reassign.c run
#include <stdio.h>

int main(void)
{
    int n = 1;
    printf("%d\n", n);

    n = 2;
    printf("%d\n", n);

    n = n + 40;
    printf("%d\n", n);

    return 0;
}
```

```output
1
2
42
```

`n = n + 40;` reads the current value at `n`'s address, adds 40, and writes the result back to that same address. The address never changes across all three lines; only the bytes stored there do. This is the entire mechanism behind every assignment you will ever write — there is no other kind.

## 6. Uninitialised variables

`int n;` on its own, with no `= value`, reserves `n`'s storage but writes nothing to it. Whatever bit pattern was already sitting at that address — left over from whatever last used that memory — is what a read of `n` would return.

```c nocompile
int n;
printf("%d\n", n);
```

This fragment is not compiled here, deliberately: reading a variable before it has been assigned is undefined behaviour in C, and there is no fixed value to check the output against. Compilers will often warn about exactly this when they can prove it statically, which is one honest way to catch the mistake before running anything.

### Wrong model: an uninitialised variable is zero

**What is actually true:** an automatic variable's initial contents are whatever bytes were already at its address; nothing zeroes them for you. It might print `0` by coincidence, on a given run, on a given machine, and print something else entirely the next time the program starts, or after an unrelated change elsewhere shifts what used to occupy that memory. `The machine model`'s answer to "what does a byte holding `00` mean" applies here without modification: a byte, or four of them, always holds some pattern; nothing marks a variable's storage as empty. Always assign a variable before reading it.

## Exercises

1. What two pieces of information does a type give the compiler about a variable?

2. `sizeof(char)` is guaranteed by the C language to be exactly `1`. Why does that make it different from `sizeof(int)`, which this book states as `4` but the language itself does not guarantee?

3. Rewrite the program in section 4 with three levels of nested blocks, each declaring its own `x` with a different value, and predict the full output before running it.

4. Using the vocabulary "address," "size," and "type," explain why `printf("%d\n", n)` and `printf("%f\n", n)` produce completely different-looking output for the same `int` variable `n` — and why the second call is a mistake, not a feature.

5. What does it mean for a variable to have automatic storage duration? Name one thing you should never assume about a variable's storage once its enclosing block has ended.

6. A student declares `int total;` and immediately writes `total = total + 5;`. What is wrong with this line, independent of what it happens to print when run?

7. Two variables in different, non-nested blocks — one after another, not one inside the other — are both named `count`. Are they the same variable? Could they occupy the same address?

8. True or false, with justification: an uninitialised local variable is guaranteed to hold `0` the first time a program is run, even if it holds something else on later runs.

## Answers

1. Its size in bytes, and how to interpret the bits stored in those bytes — as a signed integer, an unsigned integer, a character, and so on.

2. The C language defines a `char` to be exactly one byte, so `sizeof(char)` is `1` on every conforming C implementation, by the language's own rules. The size of `int` is left to the implementation; 4 bytes is what every machine this book targets uses, but a conforming C implementation is free to choose differently.

3. Output follows the nesting: each block's `printf` reports that block's own `x`, and unwinding back out reports the enclosing block's `x`, unchanged, at each step. For example, with outer `1`, middle `2`, inner `3`: `1`, `2`, `3`, `2`, `1`.

4. `n`'s storage is a fixed address holding 4 bytes, laid out as a signed integer because `n` was declared `int`. `%d` tells `printf` to read those 4 bytes as an `int`. `%f` tells `printf` to read 8 bytes and interpret them using the bit layout of a `double` — a different size and a completely different encoding. `printf` reads whatever bytes it is told to read; asking for the wrong type does not fail loudly, it just produces meaningless output from real bytes.

5. It means the variable's storage exists only while execution is inside the block where it was declared — created when the declaration is reached, gone once that block ends. You should never assume its storage still holds anything meaningful, or still exists at all, after the block has ended.

6. `total` is read on the right-hand side before it has ever been assigned a value. Its storage exists, but nothing has written a meaningful value to it yet, so the read is of unpredictable, undefined content.

7. They are not the same variable — each declaration introduces its own storage. Because the two blocks do not overlap in time, the second variable's storage could legitimately reuse the same address the first one used, once the first block has ended; nothing in C prevents that, and nothing guarantees it either.

8. False. Nothing in C guarantees the initial contents of an uninitialised automatic variable, on the first run or any run. It may happen to be `0` — memory a program has never touched before is often zero-filled by the operating system before the program even starts — but a C program cannot rely on that, and once the same memory has been used and freed by other things, it usually will not be.
