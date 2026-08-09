---
id: c-strings
title: "Strings as char arrays"
track: c
---

# Strings as char arrays

C has no string type. What every C program treats as a string is a `char` array holding the text's bytes followed by one extra byte, value `0`, marking where the text ends. Everything in this article follows from that single convention — there is no hidden machinery, no length field, no separate string object. `Integer representation, fixed width, and overflow` already told you `char` is an integer type and one byte wide; a string is nothing more than a run of those, addressed the way `Pointer arithmetic and array decay` addresses any array, with one convention layered on top to mark where it stops.

## 1. NUL termination

```c file=nulterm.c run
#include <stdio.h>

int main(void)
{
    char s[6] = {'h', 'e', 'l', 'l', 'o', '\0'};
    printf("%s\n", s);
    printf("s[5] as an integer is %d\n", s[5]);
    return 0;
}
```

```output
hello
s[5] as an integer is 0
```

`s` holds six bytes: five letters and a sixth byte whose value is `0`, written `'\0'` — the **NUL byte**, unrelated to the `NULL` pointer despite the similar name. `printf`'s `%s` conversion does not know `s` holds five letters; it does not know anything about `s` at all except that it is a `char *`, decayed from the array exactly as `Pointer arithmetic and array decay` described. It reads bytes starting at `s[0]` and keeps going, one at a time, until it finds a byte equal to `0`, then stops. `s[5]` prints as the integer `0`, not as a visible character, because `'\0'` is the byte value zero — `Integer representation, fixed width, and overflow` already established that `char` is a small integer, and this is that fact used for a purpose: the terminator is a value, checked with an ordinary `==`, not a special piece of syntax the language recognises.

A `char` array without a trailing `\0` is not a string as far as any string-handling code is concerned, no matter what text-like bytes it contains — `%s`, and every function in this article, would read past the end of it into whatever bytes happen to follow, which is undefined behaviour, exactly the out-of-bounds access `Pointer arithmetic and array decay` already covered.

## 2. String literals write the terminator for you

```c file=literal.c run
#include <stdio.h>

int main(void)
{
    char s[] = "hello";
    printf("sizeof(s) is %zu\n", sizeof(s));
    printf("s[5] as an integer is %d\n", s[5]);
    return 0;
}
```

```output
sizeof(s) is 6
s[5] as an integer is 0
```

`"hello"` is a **string literal**: five visible characters, but the compiler appends a `\0` automatically, so the literal itself is six bytes, and `char s[] = "hello";` sizes `s` to fit all six — `sizeof(s)` is `6`, not `5`. This is why section 1 wrote out `{'h','e','l','l','o','\0'}` by hand and section 2 gets the identical layout from five characters of source text: the literal form is the same data, spelled more conveniently, with the terminator supplied rather than typed.

### Wrong model: `sizeof` a string gives you its length

**What is actually true:** `sizeof(s)` counts every byte of storage, including the terminator — `6` for `"hello"`, not `5`. `Arrays and contiguous memory`'s `sizeof(array) / sizeof(element)` idiom still applies here, it simply counts one more element than the visible text, since the terminator is stored as an ordinary array element. The function that reports the number of *characters*, excluding the terminator, is `strlen`, covered in section 4 — a completely different operation from `sizeof`, computed at runtime by scanning rather than known at compile time from the declared array size.

## 3. Char arrays versus string literals used through a pointer

```c file=arrayvsliteral.c run
#include <stdio.h>

int main(void)
{
    char array[] = "hi";
    char *pointer = "hi";

    array[0] = 'H';
    printf("array is now %s\n", array);
    printf("pointer still points at %s\n", pointer);

    return 0;
}
```

```output
array is now Hi
pointer still points at hi
```

`char array[] = "hi";` declares an array and copies the literal's bytes into it, exactly as section 2 did — `array` is ordinary, mutable storage, a fresh copy that section 1's rules apply to directly. `char *pointer = "hi";` is a different construction: no array is declared at all, and `pointer` is simply set to the address of the literal itself, wherever the compiler placed it. Writing through `array` changes `array`'s own bytes, as the output shows. Writing through `pointer` would instead try to modify the literal `"hi"` directly, and a compiler is permitted to store string literals in memory the operating system marks read-only, on the reasoning that a literal's text is fixed at compile time and nothing should need to change it. Attempting the write is undefined behaviour — commonly a crash — for reasons `Pointers` already established for writing through an invalid or unauthorised address, not a distinct rule specific to strings.

```c nocompile
char *pointer = "hi";
pointer[0] = 'H';
```

This is not run: whether it crashes, corrupts something else, or happens to "work" depends on where the platform placed the literal, and none of those outcomes is a specification worth checking output against — only that it is undefined behaviour worth avoiding entirely. `char array[]` is the form to reach for whenever the text needs to be modified after it is created; `char *pointer` pointing at a literal is for text that is only ever going to be read.

### Wrong model: `char *p = "text";` and `char p[] = "text";` are two ways to write the same thing

**What is actually true:** They allocate completely different storage. `char p[] = "text";` copies the literal's bytes into a new, local, mutable array — modifying `p` afterward is ordinary, defined behaviour. `char *p = "text";` creates one pointer variable pointing directly at the literal's own bytes, which may be shared across every place in the program that writes the identical literal text, and which the platform may protect from writes altogether. Section 3's `array[0] = 'H';` succeeds because `array` owns its bytes; the commented-out `pointer[0] = 'H';` above is undefined behaviour because `pointer` does not.

## 4. `strlen` as a linear scan

```c file=strlendemo.c run
#include <stdio.h>
#include <string.h>

size_t my_strlen(const char *s)
{
    size_t count = 0;
    while (s[count] != '\0')
        count++;
    return count;
}

int main(void)
{
    char s[] = "hello";
    printf("my_strlen: %zu\n", my_strlen(s));
    printf("library strlen: %zu\n", strlen(s));
    return 0;
}
```

```output
my_strlen: 5
library strlen: 5
```

`my_strlen` does exactly what section 1's `%s` did to print `s`: start at index `0`, and walk forward one byte at a time — `s[count]`, indexing exactly as `Pointer arithmetic and array decay` established, since `s` decayed to a pointer the moment it was passed as a parameter — until a `\0` is found. The number of steps taken before finding it is the string's length, by definition; `strlen`, the library version, computes the identical thing the identical way. Neither version has any way to know the length in advance. A string's length is not stored anywhere alongside it; it is recomputed by scanning, every single time something asks for it. A `strlen` call inside a loop condition, evaluated once per iteration on a string that does not change, redoes that entire scan every time — a cost worth noticing once you are counting the steps a program takes, `Counting operations: analysing iterative algorithms`'s subject.

## 5. `strcpy` and its buffer requirement

```c file=strcpydemo.c run
#include <stdio.h>
#include <string.h>

char *my_strcpy(char *dst, const char *src)
{
    size_t i = 0;
    while (src[i] != '\0') {
        dst[i] = src[i];
        i++;
    }
    dst[i] = '\0';
    return dst;
}

int main(void)
{
    char buf1[20];
    char buf2[20];

    my_strcpy(buf1, "copied by hand");
    strcpy(buf2, "copied by library");

    printf("buf1: %s\n", buf1);
    printf("buf2: %s\n", buf2);
    return 0;
}
```

```output
buf1: copied by hand
buf2: copied by library
```

`my_strcpy` copies bytes from `src` to `dst` one at a time, stopping at `src`'s terminator, then writes one final `\0` into `dst` itself — the loop's condition checks `src[i]`, so the loop body never copies the terminator as part of the loop, and the line after it adds `dst`'s own terminator explicitly. `strcpy` does the same thing.

Neither function has any way to know how large `dst`'s buffer actually is — `dst` decayed to a plain pointer, and `Pointer arithmetic and array decay` already established that a pointer alone carries no length information. `dst` above is declared 20 bytes and both source strings comfortably fit including their terminators, but if `dst` were sized too small for `src`, `strcpy` would write past the end of it regardless, silently — the same out-of-bounds write `Arrays and contiguous memory` and `Pointer arithmetic and array decay` already covered as undefined behaviour, now reached through a string function's own contract rather than a hand-written loop. Ensuring `dst` is at least as large as `src`, including its terminator, is entirely the caller's responsibility; nothing about `strcpy`'s signature or return type enforces it.

## 6. `strcmp`

```c file=strcmpdemo.c run
#include <stdio.h>
#include <string.h>

int my_strcmp(const char *a, const char *b)
{
    size_t i = 0;
    while (a[i] != '\0' && a[i] == b[i])
        i++;
    return (unsigned char)a[i] - (unsigned char)b[i];
}

int main(void)
{
    printf("my_strcmp(\"abc\", \"abc\") = %d\n", my_strcmp("abc", "abc"));
    printf("my_strcmp(\"abc\", \"abd\") = %d\n", my_strcmp("abc", "abd"));
    printf("library strcmp(\"abc\", \"abd\") = %d\n", strcmp("abc", "abd"));
    printf("my_strcmp(\"abd\", \"abc\") = %d\n", my_strcmp("abd", "abc"));
    return 0;
}
```

```output
my_strcmp("abc", "abc") = 0
my_strcmp("abc", "abd") = -1
library strcmp("abc", "abd") = -1
my_strcmp("abd", "abc") = 1
```

`my_strcmp` walks both strings together, one index at a time, stopping the instant the bytes at that index differ or the first string's terminator is reached. Reaching a mismatch or a terminator ends the scan the same way for both cases, because a `\0` in `a` that does not match a non-`\0` byte in `b` is itself a mismatch — the loop condition `a[i] != '\0' && a[i] == b[i]` is false either way, so the same final line handles both. The return value is the numeric difference between the two mismatching bytes, cast to `unsigned char` first so that the comparison is on plain byte values, `0`–`255`, rather than being affected by whether `char` is signed on a given platform, `Integer representation, fixed width, and overflow`'s own point about `char`'s signedness being implementation-defined. Two equal strings never find a mismatching byte before both terminators line up, so `i` stops with `a[i] == b[i] == '\0'`, a difference of `0`.

Only the sign of the result is part of the contract that both the library and the hand-written version honour — negative means `a` sorts before `b`, positive means after, zero means equal — the exact magnitude is not something calling code should depend on.

## 7. `strcat` and the terminator off-by-one

```c file=strcatdemo.c run
#include <stdio.h>
#include <string.h>

char *my_strcat(char *dst, const char *src)
{
    size_t dst_len = 0;
    while (dst[dst_len] != '\0')
        dst_len++;

    size_t i = 0;
    while (src[i] != '\0') {
        dst[dst_len + i] = src[i];
        i++;
    }
    dst[dst_len + i] = '\0';
    return dst;
}

int main(void)
{
    char buf[20] = "hello ";
    my_strcat(buf, "world");
    printf("%s\n", buf);
    return 0;
}
```

```output
hello world
```

`my_strcat` first finds `dst`'s own terminator using the same scan as section 4's `my_strlen`, then copies `src` starting at that position, exactly as section 5's `my_strcpy` copies from the beginning of an empty buffer — `strcat` is a `strlen` to find where to start, followed by a `strcpy` from there. The buffer `dst` points into has to be large enough for both strings' visible content combined, plus one byte for the single terminator that ends up at the very end — not two, since the first string's own terminator is overwritten by the appended text starting at `dst_len`, not preserved in the middle.

This is the source of a specific, common bug: sizing a buffer to hold exactly `strlen(a) + strlen(b)` bytes, which is one byte short of `strlen(a) + strlen(b) + 1` — the space for the final `\0` is easy to leave out precisely because it is invisible in the text itself.

```c nocompile
char dst[11];
strcpy(dst, "hello world");
```

Not run: `"hello world"` is eleven visible characters, so this looks correctly sized at a glance, but the literal is twelve bytes with its terminator, and `dst` is one byte too small to hold it — an out-of-bounds write on the very last byte copied. The fix is `char dst[12];`, or, better, sizing the buffer from `strlen` plus one rather than counting characters by eye.

### Wrong model: A buffer sized to fit the visible text is sized correctly

**What is actually true:** Every one of sections 5 through 7's functions writes one byte beyond the visible characters — the terminator — and every buffer they write into has to have room for it. `strlen` reports the count of visible characters specifically *excluding* the terminator, by definition, in section 4; a buffer allocated as `char buf[strlen(s)]` is exactly one byte too small to hold a copy of `s`, and `char buf[strlen(s) + 1]` is the smallest buffer that is not. This `+ 1` is not a defensive margin added out of caution — it is the exact, minimum size the terminator requires, and omitting it is not "usually fine": it is always one byte short.

## Exercises

1. Given `char s[] = "cs";`, what is `sizeof(s)`, and what is the value of `s[2]` as an integer?

2. Explain why `char *p = "hi"; p[0] = 'H';` is undefined behaviour, while `char a[] = "hi"; a[0] = 'H';` is not, referencing section 3.

3. Write, by hand, a function `int my_strlen_recurse_free(const char *s)` — no, use the loop form from section 4 as a model, and trace `my_strlen("cs")` step by step: what is `count` after each iteration, and what value ends the loop?

4. A programmer writes `char dst[5]; strcpy(dst, "hello");`. Using section 5 and section 7's `nocompile` example, explain what is wrong, in terms of the number of bytes `"hello"` actually occupies.

5. Trace `my_strcmp("ab", "abc")` by hand, one iteration at a time, and state the final return value's sign, referencing section 6.

6. Using section 7, explain precisely why a buffer for the result of concatenating two strings of length `m` and `n` needs at least `m + n + 1` bytes, not `m + n`.

7. A student claims `sizeof(s)` and `strlen(s)` always give the same answer for a `char` array holding a string. Give a specific declaration of `s` for which they differ, and state both values.

## Answers

1. `sizeof(s)` is `3` — two visible characters plus the terminator. `s[2]` is `0`, the `\0` the compiler appended after `"cs"`.

2. `a` is a mutable array holding its own copy of `"hi"`'s bytes, so writing to `a[0]` modifies storage the program owns. `p` points directly at the string literal `"hi"`, which the compiler may place in memory the platform marks read-only; writing through `p` attempts to modify that shared, potentially protected storage, which section 3 states is undefined behaviour, not a defined write.

3. `my_strlen("cs")`: `count` starts at `0`. Iteration 1: `s[0]` is `'c'`, not `'\0'`, so `count` becomes `1`. Iteration 2: `s[1]` is `'s'`, not `'\0'`, so `count` becomes `2`. Iteration 3: `s[2]` is `'\0'`, the loop condition is false, and the loop ends with `count = 2`, which is returned.

4. `"hello"` is five visible characters plus a terminator, six bytes total, matching section 2's point that a literal's storage size is always one more than its visible length. `dst` is only `5` bytes, one short of the six `strcpy` needs to write, so the final `\0` (and the last visible character's worth of room) is written past the end of `dst` — exactly the situation section 7's `nocompile` example demonstrates, an out-of-bounds write from a buffer sized by eye instead of by `strlen(...) + 1`.

5. `i` starts at `0`. Iteration check: `a[0]` is `'a'`, not `'\0'`, and `a[0] == b[0]` (`'a' == 'a'`), so `i` becomes `1`. Iteration check: `a[1]` is `'b'`, not `'\0'`, and `a[1] == b[1]` (`'b' == 'b'`), so `i` becomes `2`. Iteration check: `a[2]` is `'\0'`, so the loop condition is false regardless of `b[2]`, and the loop stops with `i = 2`. The return value is `(unsigned char)a[2] - (unsigned char)b[2]`, which is `0 - (unsigned char)'c'`, a negative number — `a` is shorter and therefore sorts before `b`.

6. `strcat`'s destination needs to hold: `m` bytes for the first string's visible characters, `n` bytes for the second string's visible characters appended after them, and one further byte for the single terminator that marks the end of the combined result — `m + n` bytes holds only the visible characters of both strings with no room left for that terminator, which section 7 showed is written at position `dst_len + i`, one past the last copied character.

7. `char s[10] = "hi";` — the array is declared with `10` bytes of storage, but only `"hi"` plus its terminator, `3` bytes, are meaningful text; the remaining `7` bytes are zero-initialised but not part of the string's length. `sizeof(s)` is `10`; `strlen(s)` is `2`, since `strlen` stops scanning at the first `\0`, which occurs at index `2`, regardless of how much storage follows it.
