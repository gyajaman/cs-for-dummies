---
id: c-structs
title: "Structs and memory layout"
track: c
---

# Structs and memory layout

Every type so far has held one value: one integer, one character, one address. A `struct` holds several, bundled under one name — and because `Variables, types, and memory addresses` already established that a type is nothing more than a size plus an interpretation, a struct is simply a bigger version of the same idea: more bytes, with a more detailed rule for reading them.

## 1. Aggregate types

```c file=point.c run
#include <stdio.h>

struct point {
    int x;
    int y;
};

int main(void)
{
    struct point p;
    p.x = 3;
    p.y = 4;
    printf("p is (%d, %d)\n", p.x, p.y);
    return 0;
}
```

```output
p is (3, 4)
```

`struct point { int x; int y; };` declares a new type, `struct point`, whose values are two `int`s bundled together, each with its own name. `struct point p;` declares a variable of that type exactly the way `int n;` declares one `int` — same rules of scope and lifetime from `Variables, types, and memory addresses`, just for a type with more than one member.

## 2. Member access with the dot operator

`p.x` and `p.y` in the program above use the **dot operator** to reach a specific member: the name to the left of `.` is a struct value, and the name to the right picks one of its members, itself usable anywhere a variable of that member's type could be — assigned to, read from, passed to `printf`. There is a second member-access operator, `->`, used when what you have is not the struct itself but the address of one; that needs `Pointers`, not covered yet, before it means anything.

## 3. sizeof, padding, and alignment

```c file=layout.c run
#include <stdio.h>

struct point {
    int x;
    int y;
};

struct mixed {
    char c;
    int n;
};

int main(void)
{
    printf("sizeof(struct point) is %zu\n", sizeof(struct point));
    printf("sizeof(struct mixed) is %zu\n", sizeof(struct mixed));
    printf("sizeof(char) + sizeof(int) is %zu\n", sizeof(char) + sizeof(int));
    return 0;
}
```

```output
sizeof(struct point) is 8
sizeof(struct mixed) is 8
sizeof(char) + sizeof(int) is 5
```

`struct point` is two `int`s back to back: `4 + 4 = 8`, no surprises. `struct mixed` is a `char`, one byte, followed by an `int`, four bytes — and `sizeof` reports `8`, not `5`. The missing three bytes are **padding**: the compiler is required to place `n` at an address that is a multiple of `4`, `int`'s **alignment** requirement, and `c` alone does not reach one, so three unused bytes are inserted between them to push `n` into position. Padding is not wasted by accident; it is the price of letting every member be read with a single, aligned access instead of an awkward one spanning a boundary it was not meant to cross.

### Wrong model: `sizeof` a struct always equals the sum of its members' sizes

**What is actually true:** it is at least that sum, but the compiler is free to insert padding between members, or after the last one, to satisfy each member's alignment requirement, and the total can come out larger than the members alone would suggest. `struct mixed` is the demonstration: `1 + 4 = 5`, but `sizeof(struct mixed)` is `8`. Reordering members can change how much padding a compiler chooses to insert, but reasoning about the exact bytes without asking `sizeof` directly is guesswork, not something to hand-compute and trust.

## 4. Nesting

```c file=nested.c run
#include <stdio.h>

struct point {
    int x;
    int y;
};

struct rectangle {
    struct point top_left;
    struct point bottom_right;
};

int main(void)
{
    struct rectangle r;
    r.top_left.x = 0;
    r.top_left.y = 0;
    r.bottom_right.x = 10;
    r.bottom_right.y = 5;
    printf("rectangle from (%d,%d) to (%d,%d)\n", r.top_left.x, r.top_left.y, r.bottom_right.x, r.bottom_right.y);
    return 0;
}
```

```output
rectangle from (0,0) to (10,5)
```

A struct member can itself be a struct. `r.top_left` is a whole `struct point`, occupying its own two `int`s inside `r`'s own storage — not a reference to some `point` living elsewhere, an actual, physical copy of one, laid out contiguously as part of `r`. Reaching `r.top_left.x` chains the dot operator: first to the member `top_left`, then to its own member `x`.

## 5. typedef

```c file=typedefdemo.c run
#include <stdio.h>

typedef struct point {
    int x;
    int y;
} point_t;

int main(void)
{
    point_t p;
    p.x = 1;
    p.y = 2;
    printf("(%d, %d)\n", p.x, p.y);
    return 0;
}
```

```output
(1, 2)
```

`typedef` gives an existing type a new name. `point_t` here means exactly `struct point` — nothing about the type changed, only what you are allowed to call it. Declaring `struct point` and its `typedef` together, as one declaration, is a common convention purely to save writing `struct` before every later use of the type's name.

## 6. Structs are copied on assignment

```c file=copy.c run
#include <stdio.h>

struct point {
    int x;
    int y;
};

int main(void)
{
    struct point a;
    a.x = 1;
    a.y = 2;

    struct point b = a;
    b.x = 100;

    printf("a is (%d, %d)\n", a.x, a.y);
    printf("b is (%d, %d)\n", b.x, b.y);
    return 0;
}
```

```output
a is (1, 2)
b is (100, 2)
```

`struct point b = a;` copies every byte of `a` into `b`'s own, separate storage — all of it, both members, in one statement, the same way `n = m;` copies a plain `int`. Changing `b.x` afterward has no effect on `a.x`, because after that line the two variables share nothing; `a` and `b` are two independent addresses in memory, each holding its own complete `struct point`. Passing a struct as a function argument, or returning one, copies it the exact same way, for the same reason: it follows the pass-by-value rule `Functions, parameters, and pass-by-value` already established for every other type, without exception for having more than one member.

### Wrong model: assigning one struct variable to another links them

**What is actually true:** `b = a;` copies `a`'s bytes into `b` once, at that moment, and nothing more — it does not make `b` an alternate name for `a`'s storage, and no later change to either one is reflected in the other. This is worth stating plainly because it is not universal across programming languages: some languages assign composite values by reference, so that two names end up pointing at one shared object. C does not. A struct assignment is a full, independent copy, exactly like every other assignment in this book.

## 7. Arrays of structs

A struct is a type like any other, which means arrays of them work exactly the way arrays of `int` would — one after another, contiguous, each element a complete, independent `struct point` with its own members. The array mechanics themselves, indexing and iteration, are `Arrays and contiguous memory`'s subject, not this article's; the fact worth keeping here is narrower: nothing about a struct being several members bundled together changes how arrays of it behave.

## Exercises

1. Given `struct point { int x; int y; };`, what does `p.y` mean, and what does the value to the left of the dot have to be for `.` to make sense?

2. `struct mixed` in section 3 has a `char` followed by an `int`, and `sizeof` reports `8`, not `5`. Where do the extra three bytes go, and why does the compiler insert them?

3. In section 4, is `r.top_left` a separate `struct point` that happens to live somewhere else, or is it physically part of `r`'s own storage? Justify your answer.

4. What does `typedef struct point { int x; int y; } point_t;` actually create — a new type, or a new name for an existing type?

5. In section 6, after `struct point b = a;` and then `b.x = 100;`, what is `a.x`? Explain why, referencing what assignment does to a struct's bytes.

6. A student says C structs "work like objects in other languages, where assignment just makes two names for the same thing." Using section 6, explain what is wrong with that claim for C specifically.

7. Why can't `->` be explained properly yet in this article?

8. Two structs, `struct a { int x; }` and `struct b { char c; int x; }`, are otherwise identical in their `int` member. Would you expect `sizeof(struct a)` and `sizeof(struct b)` to be equal? Why or why not?

## Answers

1. `p.y` reaches the member named `y` inside the struct value `p`, using it afterward exactly as an `int` — since that is what `y` is. The value to the left of `.` has to be an actual struct value, such as a struct variable, not an address of one; that second case is what `->` is for.

2. They go between `c` and `n`, as padding. `int` requires its address to be a multiple of `4`; placing `n` immediately after a single-byte `c` would put it at an unaligned address, so the compiler inserts three unused bytes to push `n` forward to the next multiple of `4`.

3. It is physically part of `r`'s own storage. Nesting a struct inside another does not create a separate, independently-allocated object elsewhere; `r`'s memory contains both `top_left`'s bytes and `bottom_right`'s bytes laid out one after the other, as part of one contiguous block.

4. A new name for an existing type. `point_t` and `struct point` refer to the exact same type afterward; nothing about the type's members, size, or layout is different depending on which name you use.

5. `a.x` is still `1`. Assignment copied `a`'s bytes into `b` once, at the moment `struct point b = a;` ran; after that, `a` and `b` are separate storage, so `b.x = 100;` only ever touches `b`'s copy.

6. In many other languages, assigning one variable holding a composite value to another makes both names refer to the same underlying object, so a change through one name is visible through the other. Section 6 shows C does not do this for structs: `b = a;` copies every byte into `b`'s own storage, and the two are independent from that point on, exactly like assigning two plain `int` variables.

7. `->` is used to access a member through the address of a struct rather than the struct value itself, which requires understanding what an address-typed variable is and how to declare one — the subject of `Pointers`, which this article's single prerequisite does not yet provide.

8. No — `sizeof(struct b)` would very likely be larger, not merely `sizeof(struct a)` plus one byte for `c`. `struct b`'s `char` sits before an `int` that needs 4-byte alignment, so the compiler is likely to insert padding after `c`, the same situation `struct mixed` demonstrated in section 3; the two structs are not "otherwise identical" in size just because their `int` members match.
