---
id: c-memory-errors
title: "Memory errors: leaks, dangling pointers, use-after-free"
track: c
---

# Memory errors: leaks, dangling pointers, use-after-free

`The heap: malloc, free, and object lifetime` gave you the two operations that manage allocated memory and stated the ownership discipline that keeps them paired correctly: exactly one `free` for every `malloc`, called once the memory is truly no longer needed. This article is about what happens when that discipline is broken. Every error here compiles cleanly, and several of them run to completion and print a plausible-looking answer anyway — which is precisely what makes this category of bug worth a dedicated article rather than a paragraph.

## 1. Leaks

```c file=leak.c run
#include <stdio.h>
#include <stdlib.h>

void make_and_forget(void)
{
    int *p = malloc(sizeof(int));
    if (p == NULL)
        return;
    *p = 42;
    printf("allocated and used: %d\n", *p);
}

int main(void)
{
    for (int i = 0; i < 3; i++)
        make_and_forget();
    printf("done\n");
    return 0;
}
```

```output
allocated and used: 42
allocated and used: 42
allocated and used: 42
done
```

`make_and_forget` allocates four bytes, uses them correctly, and returns without ever calling `free`. Nothing about this crashes, and nothing about the output looks wrong — the program does exactly what it appears to do, three times, and exits cleanly. What has actually happened is that three separate blocks of heap memory were requested and never returned; `p`, the only variable that held their addresses, went out of scope the moment each call returned, exactly as any local does, and with it went the only record of where those blocks were. The memory itself is not reclaimed until the whole program exits — this is a **leak**: memory whose owner lost the address needed to free it, while the memory itself remains allocated regardless.

A leak inside a function called three times, as above, is three lost blocks. The identical bug inside a function called in a loop that runs for the lifetime of a long-running program — a server, an editor — leaks without bound, growing the amount of memory the process holds until the system refuses further allocations, at which point `malloc` starts returning `NULL` in code that may be nowhere near the loop that caused the problem. Section 8 returns to exactly this gap between cause and symptom.

### Wrong model: A program that runs correctly and exits cleanly has no memory errors

**What is actually true:** Section 1's program prints the correct output on every run and exits with status `0` — every visible signal of correctness that this book has taught you to check for is present. It still leaks three allocations. A leak's only symptom is memory not being returned to the system; it produces no wrong values, no crash, and no nonzero exit code, which is exactly why leaks are not caught by reading a program's output and are the primary reason a tool like section 9's `valgrind` exists — to report on memory the program itself never mentions losing.

## 2. Double free

```c nocompile
int *p = malloc(sizeof(int));
*p = 1;
free(p);
free(p);
```

Not run: this compiles without a single warning, and freeing `p` a second time is undefined behaviour, not a defined error the language catches. In practice, on the systems this book targets, the memory allocator keeps its own bookkeeping data alongside every block it hands out, and freeing the same block twice corrupts that bookkeeping — commonly detected by the allocator itself, which aborts the entire program with a message such as `free(): double free detected in tcache 2` rather than continuing. That abort can happen immediately, or after intervening allocations have already been corrupted and the program crashes somewhere else entirely, again illustrating that the point of failure is not reliably the point of the actual mistake.

The first `free(p);` is entirely correct on its own — the bug exists only because of the second call, using a `p` that no longer names memory the program owns. `The heap: malloc, free, and object lifetime` already established that `free` cannot reach back into its caller and change what `p` holds, since it receives only a copy of `p`'s value, in `Functions, parameters, and pass-by-value`'s sense; nothing about calling `free` once marks `p` as spent, which is exactly why a second, mistaken call compiles and runs exactly as if the first `free` had never happened, until the allocator's own internal checks catch the inconsistency.

## 3. Use-after-free

```c nocompile
int *p = malloc(sizeof(int));
*p = 99;
free(p);
printf("%d\n", *p);
```

Not run, for the same reason as section 2: this compiles cleanly, and dereferencing `p` after `free(p)` is undefined behaviour. `free` does not erase the bytes it releases — it only marks that block as available for a future allocation to reuse — so `*p` immediately after `free(p)` frequently still reads `99`, the value that was there a moment ago, simply because nothing has overwritten it yet. The bug is real regardless of what prints; it is only the visible symptom that is absent. Run the same four lines with something else allocated in between the `free` and the read, and the picture changes:

```c nocompile
int *p = malloc(sizeof(int));
*p = 99;
free(p);

int *q = malloc(sizeof(int));
*q = 7;

printf("%d\n", *p);
```

Also not run, and for the same reason — but worth reasoning through by hand: a general-purpose allocator commonly hands the just-freed block straight back out to the very next `malloc` of a matching size, since it is the memory most readily available. If that happens here, `q` and the freed `p` refer to the identical bytes, and `*p` after `*q = 7;` reads `7`, not `99` and not `99`'s absence — a value that looks entirely reasonable, computed by code that has nothing to do with `p` at all. This is a **use-after-free**: reading or writing through a pointer to memory that has already been freed, and it is one of the clearest illustrations in the language of a symptom appearing far from its cause, since the line that actually misbehaves, `printf("%d\n", *p);`, is correct in isolation — the mistake is `free(p);`, several lines earlier, having already ended `p`'s claim on that memory.

## 4. Dangling pointers

A **dangling pointer** is any pointer holding the address of memory that is no longer valid to use through it — `p` in sections 2 and 3, immediately after `free(p);`, in both cases. `p` itself is an ordinary variable and its bit pattern does not change; what changed is that the address it holds no longer names memory the program owns, exactly as `The heap: malloc, free, and object lifetime` stated when it introduced the term. A dangling pointer is not, by itself, a bug — holding one is harmless, since nothing has gone wrong until it is dereferenced, as in section 3, or freed again, as in section 2. The bug is always in a later operation that treats a dangling pointer as if it still pointed at something valid.

```c file=setnull.c run
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int *p = malloc(sizeof(int));
    if (p == NULL)
        return 1;

    *p = 5;
    free(p);
    p = NULL;

    if (p != NULL)
        printf("would have used *p: %d\n", *p);
    else
        printf("p is NULL, skipped the dangling read\n");

    return 0;
}
```

```output
p is NULL, skipped the dangling read
```

Setting `p = NULL;` immediately after `free(p);` — `The heap: malloc, free, and object lifetime`'s own recommendation, since `free` will not do it automatically — turns a silent dangling pointer into one that a later `if (p != NULL)` check can actually detect. It does not fix the underlying discipline error of trying to use freed memory; it converts what would have been undefined behaviour into a defined, checkable condition, catching the mistake at the `if` rather than leaving it to manifest unpredictably wherever the stale pointer next gets dereferenced.

## 5. Buffer overruns on heap memory

```c nocompile
int *a = malloc(5 * sizeof(int));
for (int i = 0; i <= 5; i++)
    a[i] = i;
```

Not run: `a` holds room for indices `0` through `4`; the loop condition `i <= 5` writes one element past that, into `a[5]`, which is memory `malloc` never allocated to this block at all — the exact out-of-bounds write `Arrays and contiguous memory` and `Pointer arithmetic and array decay` already covered for a fixed-size array, reached here through a heap allocation instead of a stack one. The mechanism is identical either way: an address one element beyond the allocation's own bytes, written to as though it belonged to the array. What differs on the heap is what typically sits at that address: the allocator's own bookkeeping for a neighbouring block, or the first few bytes of another live allocation entirely, so the visible damage — if there is any at all — often does not appear until that neighbouring block is used or freed, nowhere near the loop that actually overran its bounds.

## 6. Reading uninitialised memory

```c file=uninitread.c run
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int *a = malloc(3 * sizeof(int));
    if (a == NULL)
        return 1;

    printf("a[0] read before any write happened\n");
    (void)a[0];

    a[0] = 1;
    a[1] = 2;
    a[2] = 3;
    printf("a[0]=%d a[1]=%d a[2]=%d after writing\n", a[0], a[1], a[2]);

    free(a);
    return 0;
}
```

```output
a[0] read before any write happened
a[0]=1 a[1]=2 a[2]=3 after writing
```

`malloc` does not initialise the memory it returns — `The heap: malloc, free, and object lifetime` stated this outright — so `a[0]`, `a[1]`, and `a[2]` hold whatever bytes were already sitting at that address before this `malloc` call claimed it, which could be zero, could be leftover data from an earlier, unrelated allocation in this same program, or, in a program compiled without full optimisation, could genuinely differ from one run to the next. The program above deliberately never prints that indeterminate value — `(void)a[0];` reads it and discards it, since there is no fixed value to check the output against — and initialises every element explicitly before the only prints that report actual numbers. A program that instead prints `a[0]` before writing to it is not wrong the way a syntax error is wrong; it is undefined in the same sense every other error in this article is, and the fact that it might happen to print `0` on one particular run is not evidence that the code is correct.

## 7. Buffer overruns and uninitialised reads together: why the fix looks unrelated

The general shape connecting sections 2 through 6 is this: every one of these operations is legal C syntax operating on a pointer or an index that is, at the moment it runs, no longer (or not yet) backed by memory the program is entitled to treat that way. The instruction that actually misbehaves — a read, a write, a second `free` — is never itself malformed; the mistake is a fact about the program's history up to that point, not about the line where it surfaces. `The machine model` warned in its very first article that the CPU has no notion of intent and executes whatever instructions it is given; every error catalogued here is a case of the program handing it an instruction that is syntactically fine and semantically wrong, given what actually happened to that memory earlier.

## 8. Why the symptom surfaces far from the cause

Put together, sections 1 through 6 share one structural feature: the operation that is *wrong* — a missing `free`, an extra `free`, a read one line too late, a write one index too far — and the operation where anything *visibly* goes wrong are frequently different lines, different functions, sometimes different files, and, in the case of a leak, potentially a difference of hours between the mistake and the process finally failing to allocate. A use-after-free that happens to read stale-but-plausible data prints a wrong number with no indication that anything is amiss at the print statement itself; the actual defect is the `free` call that came before it, and the only way to find it is to already suspect the memory's lifetime, not the arithmetic on the line that printed.

This is exactly why every error in this article was demonstrated with `nocompile` rather than `run`: none of them has one fixed, honest answer to check output against. The output of a program containing any of these bugs is whatever the platform's allocator, compiler, and prior memory layout happen to produce that run — which is the entire problem, restated as a fact about testing them.

## 9. Tools built for exactly this problem

Reading source code is not a reliable way to find any of the bugs in this article, precisely because the broken line and the visibly wrong line are usually apart. Two tools exist specifically to close that gap by watching memory operations as the program actually runs, rather than by inspecting the source.

`-fsanitize=address`, added to the compile command already introduced in `Debugging: printf, gdb, sanitisers`, instruments every memory access the compiled program makes and aborts immediately, with a detailed report, the instant one of them touches memory it should not. Compiling section 3's use-after-free with it produces a report along these lines:

```output
==12345==ERROR: AddressSanitizer: heap-use-after-free on address 0x...
READ of size 4 at 0x... thread T0
    #0 in main demo.c:5
freed by thread T0 here:
    #0 in free
    #1 in main demo.c:4
previously allocated by thread T0 here:
    #0 in malloc
    #1 in main demo.c:2
```

The report names the exact operation (`heap-use-after-free`), the exact line where the invalid read happened, and — critically — the exact line where the memory was freed and the exact line where it was originally allocated, reconstructing the history that made line 5 wrong, rather than leaving you to infer it from a plausible-looking printed number.

`valgrind`, run as `valgrind ./a.out` with no recompilation needed, does the equivalent for a program built normally, at a cost of running considerably slower, and reports leaks specifically at program exit — a summary of every block still allocated when `main` returned, together with the call stack that allocated it:

```output
==12346== HEAP SUMMARY:
==12346==     in use at exit: 12 bytes in 3 blocks
==12346==   total heap usage: 3 allocs, 0 frees, 12 bytes allocated
==12346==
==12346== 12 bytes in 3 blocks are definitely lost in loss record 1 of 1
==12346==    at 0x...: malloc
==12346==    by 0x...: make_and_forget (leak.c:6)
==12346==    by 0x...: main (leak.c:14)
```

Run against section 1's `leak.c`, this reports exactly the fact that program's own output gave no hint of: three blocks, twelve bytes, still allocated when the program exited, allocated at line 6 inside `make_and_forget`. Both tools exist because the wrong-model in section 1 is otherwise true in practice: reading a program's output tells you nothing about memory it silently failed to give back.

## Exercises

1. A leaked allocation and a correctly-freed one can produce byte-for-byte identical program output. What, specifically, differs between the two cases, if not the output?

2. Explain, using section 2, why the *first* `free(p);` in a double-free sequence is not itself a bug.

3. In section 3's second example, under what specific circumstance does `*p` end up reading `7` instead of `99`? What has to be true about the allocator's behaviour for that to happen?

4. Section 4 states that holding a dangling pointer is not, by itself, a bug. What operation turns a dangling pointer into an actual error?

5. Rewrite section 5's overrunning loop with a corrected bound, and state exactly which index was being written out of bounds before the fix.

6. Why does section 6's demonstration program deliberately avoid printing `a[0]` before writing to it, instead discarding the read with `(void)a[0];`?

7. Using section 8, explain why none of sections 2, 3, or 5's code blocks are marked `run` in this article, when most code blocks throughout the rest of the book are.

8. A colleague says "the program crashed on line 40, so the bug is on line 40." Using section 8 and `Debugging: printf, gdb, sanitisers`, explain what is wrong with that reasoning in the specific context of memory errors.

## Answers

1. The output is identical; what differs is whether the memory the program requested was returned to the system before the process exited. A leak leaves that memory allocated and unreachable for the remainder of the program's run — invisible in the output, but visible to a tool like `valgrind`, which reports on allocations directly rather than on anything the program printed.

2. The first `free(p);` releases memory that `p` legitimately owned at that point, exactly as `The heap: malloc, free, and object lifetime` describes a correct call — there is nothing wrong with it in isolation. The bug exists only because of the *second* call, which operates on a `p` that, after the first `free`, no longer names memory the program owns; the mistake is specific to the repetition, not to freeing `p` at all.

3. `*p` reads `7` if the allocator hands the block just freed by `free(p);` back out as the result of the very next `malloc` call — the one that creates `q` — so that `p` and `q` end up holding the identical address. This requires the allocator to reuse freed memory quickly, which general-purpose allocators commonly do for blocks of matching size, but nothing in the C standard guarantees it will happen, or happen the same way twice.

4. Dereferencing it (reading or writing through it, as in section 3) or freeing it again (as in section 2). Section 4 makes clear that the pointer variable itself holding a stale address is harmless right up until some later operation treats that address as if it were still valid.

5. `for (int i = 0; i < 5; i++) a[i] = i;` — changing `<=` to `<`. Before the fix, `i` reached `5` on the loop's last iteration, and `a[5]` writes one element past the five allocated (`a[0]` through `a[4]`), which is out of bounds.

6. Because `a[0]` before any write is indeterminate — whatever bytes happened to be at that address before `malloc` returned it — and there is no single correct value to write into an `output` block and check the program's stdout against. `(void)a[0];` demonstrates that reading it is legal C without committing to any particular printed result.

7. Every one of those examples is undefined behaviour whose actual result — whether it crashes, what value prints, whether it corrupts something else entirely — depends on the specific allocator, compiler, and memory layout of whatever machine runs it, and is not guaranteed to be the same from one run to the next. Marking them `run` would require an `output` block asserting one fixed, correct result, which section 8 explains does not exist for code like this.

8. Section 8 established that the operation that visibly fails and the operation that was actually wrong are frequently different lines — a crash on line 40 may be the allocator finally noticing corruption caused by a buffer overrun on line 12, or a use-after-free reading memory that was reused several calls earlier. `Debugging: printf, gdb, sanitisers` already warned against fixing the first suspicious-looking line without confirming a hypothesis first; for memory errors specifically, the line that crashes is close to the least reliable indicator of where the actual mistake is, which is exactly why tools like AddressSanitizer report the allocation and free history alongside the crash site rather than the crash site alone.
