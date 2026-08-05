---
id: c-stack
title: "The stack and function calls"
track: c
---

# The stack and function calls

`Functions, parameters, and pass-by-value` established two facts without explaining the mechanism behind either: a parameter is a fresh local variable on every call, and a local variable's storage does not outlive the block it was declared in. Both are consequences of where that storage actually lives — a region of memory called the **stack** — and how a function call and return manage it.

## 1. Stack frames

Every active function call owns a chunk of the stack called its **stack frame**, holding that call's parameters, its local variables, and one thing you have never written yourself: the **return address**, the location in the caller to resume at once this call finishes. `The machine model` already named the register that return address gets loaded into when a call ends: `PC`, the program counter.

```c file=nested.c run
#include <stdio.h>

void inner(void)
{
    int b = 2;
    printf("inner's b is at %p\n", (void *)&b);
}

void outer(void)
{
    int a = 1;
    printf("outer's a is at %p\n", (void *)&a);
    inner();
}

int main(void)
{
    outer();
    return 0;
}
```

```output
outer's a is at {{ANY}}
inner's b is at {{ANY}}
```

`outer` is still running, its frame still on the stack, when it calls `inner` — `inner`'s frame does not replace `outer`'s, it sits alongside it, nearer the top. Run this yourself and compare the two addresses: they are close together but distinct, and on the machines this book targets, `inner`'s locals land at a numerically lower address than `outer`'s — the stack grows *downward* as calls nest deeper, a convention of the platforms this book targets, not a rule the C language itself states.

## 2. Push on call, pop on return

Calling a function **pushes** a new frame onto the stack: space for its parameters and locals is reserved, and the return address is recorded. Returning **pops** that frame off: the space it used stops being reserved, immediately, as part of `return` itself — not at some later, unspecified point. Frames come off in exactly the reverse order they went on, last pushed, first popped, which is why `inner` finishing does not disturb `outer`'s already-pushed frame at all; `outer` resumes exactly where it left off, using its own frame, still intact underneath.

## 3. Why locals cease to exist

```c file=reuse.c run
#include <stdio.h>

void first(void)
{
    int a = 111;
    printf("first's a is at %p\n", (void *)&a);
}

void second(void)
{
    int b;
    printf("second's b is at %p\n", (void *)&b);
}

int main(void)
{
    first();
    second();
    return 0;
}
```

```output
first's a is at {{ANY}}
second's b is at {{ANY}}
```

Unlike section 1's example, `first` has completely finished, its frame already popped, before `second` is ever called — the two calls do not overlap. Compare the two printed addresses yourself: on many machines, including the one this was written on, they come out identical. "Local variable storage stops existing when its function returns" was always figurative — the bytes are not erased, nothing reaches in and clears them — what actually happens is narrower and more mechanical: the space stops being reserved, and the very next thing that needs stack space, here `second`'s own frame, is free to use exactly the same addresses. Reading `a` through its old name after `first` has returned would be undefined behaviour, but not because the bytes vanished — because nothing protects them from being claimed by whatever runs next.

### Wrong model: a local variable's storage is cleared once its function returns

**What is actually true:** returning pops the frame, which means the memory is no longer reserved for that variable — it does not mean the memory is zeroed, wiped, or otherwise reset. Whatever bit pattern was last written there stays exactly as it was until something else, typically the very next call's frame, writes over it. This is the same fact `Variables, types, and memory addresses` stated about uninitialised variables in general, now with a specific, common source: a variable's leftover bytes are frequently the leftovers of some previous call's locals, not a fresh, blank slate.

## 4. Call depth and stack overflow

The stack has a fixed maximum size, decided before your program starts running, not something that grows to accommodate however many calls you make. Every call currently in progress — every frame not yet popped — takes up part of that fixed space, so calls nested deeply enough will eventually run out of room. That failure has a name, **stack overflow**, describing exactly what happens: the stack has grown past the space allotted to it. This becomes concretely reachable once a function can call itself, which `Recursion` covers properly; a function that calls other functions, without ever calling itself, essentially never nests deeply enough by hand to reach this limit.

## 5. Why returning a pointer to a local is wrong

Once a function returns, its frame is popped, whether or not anyone kept a copy of an address that pointed into it. Handing the caller the address of one of your own local variables — a possibility only once `Pointers` gives you the syntax to write it — hands back an address whose frame may be reused by literally the next function call, including one as innocuous as `printf` itself.

### Wrong model: returning the address of a local variable is safe if the caller uses it immediately

**What is actually true:** there is no safe window, not even an instant one. The frame is popped the moment `return` executes, before control has even reached the caller; "immediately" does not happen before the pop, it happens after. Section 3 already showed the next call is a strong candidate to claim exactly that freed space for its own frame — and evaluating almost anything with the returned address, including passing it to another function to print or use it, is itself a call, which is precisely the kind of event likely to overwrite it first.

## Exercises

1. What three kinds of things does a stack frame typically hold?

2. In section 1, `inner`'s frame is pushed while `outer`'s is still on the stack. In what order are the two frames eventually popped, and why must it be that order?

3. In section 3, `first` and `second` are called one after the other, not nested. Why does this make their frames candidates for occupying the very same addresses, where section 1's nested calls could not?

4. What does "the stack has a fixed maximum size" actually rule out, in terms of how deep function calls can nest?

5. Explain, using the vocabulary of pushing and popping, why `outer` in section 1 resumes correctly after `inner` returns, with `a` still equal to `1`.

6. A student argues that returning the address of a local variable is fine as long as the caller reads it before calling any other function. What is wrong with "before calling any other function" as a safety condition?

7. What is the return address part of a stack frame actually used for, and which register from `The machine model` does it eventually get loaded into?

8. Why can a stack overflow not really happen from ordinary, non-recursive function calls written by hand?

## Answers

1. Its parameters, its local variables, and the return address — where execution should resume in the caller once this call finishes.

2. `inner`'s frame is popped first, `outer`'s second — the reverse of the order they were pushed. It must be this order because `inner` is nested inside `outer`'s still-active call; `outer` cannot finish before the call it made to `inner` does, so `outer`'s frame has to still exist, unpopped, for the entire time `inner`'s does.

3. Because `first` has already returned, its frame already popped, before `second` is ever called — at no point are both frames on the stack simultaneously, so the space `first` used is free again by the time `second` needs its own frame. Section 1's calls overlap in time, so `inner`'s frame has to occupy different space from `outer`'s still-active one.

4. It rules out calls nesting arbitrarily deep. Every call still in progress occupies part of a fixed-size region; nesting calls deeply enough eventually exhausts that space entirely, which is what a stack overflow is.

5. Calling `inner` pushed a new frame without disturbing `outer`'s already-pushed one; `inner` returning popped only `inner`'s frame, in last-pushed-first-popped order, leaving `outer`'s frame, and everything in it including `a`, exactly as it was.

6. "Before calling any other function" is not actually a safe window, because the frame is popped the instant `return` executes in the function that owned the local variable — before control has even reached the caller. By the time the caller is running at all, the frame is already gone; there was never a moment where it still existed and the caller was also running.

7. It records where in the caller's code execution should resume once the current call's `return` runs. It eventually gets loaded into `PC`, the program counter, which is exactly what determines which instruction the CPU fetches next.

8. Because each function written by hand calls a bounded, fixed number of other functions in its source, and none of them calls itself — the total nesting depth is limited by how many distinct functions exist in the program, which is nowhere near the stack's capacity. It takes a function calling itself, repeatedly, to make the depth grow without a fixed bound, which `Recursion` covers.
