---
id: c-integer-representation
title: "Integer representation, fixed width, and overflow"
track: c
---

# Integer representation, fixed width, and overflow

`The machine model` showed that a byte is a pattern of bits with no meaning of its own, and that interpreting the same bytes different ways gives different, equally valid answers. This article makes that concrete for the type you have used the most: `int`, and its relatives. Every fact here is a direct consequence of a fixed number of bits having to represent an unbounded idea, numbers, using nothing but those bits.

## 1. Fixed-width types and stdint.h

`int` is 4 bytes on every machine this book targets, but that is a convention, not a guarantee the language itself makes — the C standard only promises `int` is *at least* 16 bits wide. `<stdint.h>` provides types that make the width itself the guarantee:

```c file=widths.c run
#include <stdio.h>
#include <stdint.h>

int main(void)
{
    printf("int8_t is %zu byte\n", sizeof(int8_t));
    printf("int16_t is %zu bytes\n", sizeof(int16_t));
    printf("int32_t is %zu bytes\n", sizeof(int32_t));
    printf("int64_t is %zu bytes\n", sizeof(int64_t));
    return 0;
}
```

```output
int8_t is 1 byte
int16_t is 2 bytes
int32_t is 4 bytes
int64_t is 8 bytes
```

`int8_t` is exactly 8 bits, everywhere, on any implementation that provides it at all — the number in the name is the guarantee, not a hint. Each also has an unsigned counterpart, `uint8_t` through `uint64_t`, covered starting in section 3. Reach for these instead of `int` and `long` whenever the exact width matters to your program, which is more often than it first appears.

## 2. Two's complement

A `uint8_t` has 8 bits and no sign: all $2^8$ patterns are non-negative, running from `0` to `255`. A `signed` 8-bit type has to spend some of those same patterns representing negative numbers, so its range shifts instead of shrinking symmetrically: `-128` to `127`, still $256$ patterns in total. The scheme C uses to decide which pattern means which negative number is **two's complement**: to negate a value, invert every bit, then add one.

```c file=twoscomplement.c run
#include <stdio.h>
#include <stdint.h>

int main(void)
{
    int8_t n = -1;
    unsigned char *bytes = (unsigned char *)&n;
    printf("-1 as an int8_t is stored as %02x\n", bytes[0]);
    return 0;
}
```

```output
-1 as an int8_t is stored as ff
```

`1` is `00000001`. Inverting every bit gives `11111110`; adding one gives `11111111`, which is `ff` — all bits set. This matches the general rule you already have a use for: `The machine model` needed the same address-of-bytes idiom to look at raw storage; `unsigned char *bytes = (unsigned char *)&n;` is exactly that pattern again, and it still means what it meant there. Its syntax belongs properly to `Pointers`.

Every bit being set is not a coincidence specific to `-1` — it is what "invert, then add one" does to the pattern for `1` in general, and it is why `-1` looks like the largest possible unsigned value when the same bits are read as unsigned instead.

## 3. Unsigned wraparound

```c file=wraparound.c run
#include <stdio.h>
#include <stdint.h>

int main(void)
{
    uint8_t a = 255;
    uint8_t b = a + 1;
    printf("255 + 1 as uint8_t is %u\n", b);
    return 0;
}
```

```output
255 + 1 as uint8_t is 0
```

`255` is every bit set, the largest value a `uint8_t` can hold. Adding `1` does not overflow into a ninth bit that does not exist — there is nowhere for it to go — the result is computed modulo $2^8 = 256$, and $256 \bmod 256 = 0$. This is not an accident the hardware happens to produce: the C standard **defines** unsigned arithmetic to wrap this way, for every unsigned type, at every width. Code is allowed to depend on it.

## 4. Signed overflow is undefined, not wraparound

```c nocompile
int n = INT_MAX;
int overflowed = n + 1;
```

This is not excluded here because it fails to compile. It compiles. It is excluded because there is no output honestly worth checking: unlike unsigned overflow, **signed overflow is undefined behaviour** — the C standard places no requirement on what happens at all. A compiler is permitted to assume signed overflow never occurs and optimise your code as though it can't, which in practice can produce results with no relationship to two's complement wraparound whatsoever, not merely "the wrong number."

### Wrong model: signed overflow wraps around, the same way unsigned overflow does

**What is actually true:** unsigned wraparound is a guarantee written into the language; signed overflow is the *absence* of any guarantee. They are not two cases of the same rule with different ranges. A particular compiler, on a particular day, might happen to produce a wrapped-looking value for `INT_MAX + 1` — this program probably will, right now, on the machine you are reading this on — but nothing requires it to keep doing so, and an optimiser is free to notice the overflow is undefined and delete code that depended on it, silently. `uint8_t`'s `255 + 1` becoming `0` is a promise. `int`'s `INT_MAX + 1` is not.

## 5. char as a small integer, and ASCII

`char` is an integer type, one byte wide, and `The machine model` already told you what a byte holding a letter really is: a number, interpreted as text by convention.

```c file=charint.c run
#include <stdio.h>

int main(void)
{
    char c = 'A';
    printf("'A' is the integer %d\n", c);

    int n = 66;
    printf("66 printed as a character is %c\n", n);

    return 0;
}
```

```output
'A' is the integer 65
66 printed as a character is B
```

`'A'` is not special syntax for a non-numeric thing; it is another way to write the integer `65`, the code ASCII assigns to that letter. `%c` and `%d` do not change what is stored — both calls above could be printing the exact same bit pattern — they change how `printf` chooses to display it, exactly as `%d` and `%p` did for the same address back in `Variables, types, and memory addresses`.

### Wrong model: `char` is always a signed type

**What is actually true:** whether plain `char` is signed or unsigned is left to the implementation by the C standard — `signed char` and `unsigned char` are always what they say, but unqualified `char` might match either, depending on the platform.

```c file=charrange.c run
#include <stdio.h>
#include <limits.h>

int main(void)
{
    printf("CHAR_MIN is %d\n", CHAR_MIN);
    printf("CHAR_MAX is %d\n", CHAR_MAX);
    return 0;
}
```

```output
CHAR_MIN is -128
CHAR_MAX is 127
```

On every machine this book targets, `char` is signed, so `CHAR_MIN` is negative — the numbers above should match what you see. That is a property of these particular platforms, not of the C language: portable code that needs a guaranteed signedness asks for `signed char` or `unsigned char` explicitly, rather than assuming plain `char` behaves one way everywhere.

## 6. Implicit conversion and truncation

```c file=truncate.c run
#include <stdio.h>
#include <stdint.h>

int main(void)
{
    int wide = 300;
    uint8_t narrow = wide;
    printf("300 truncated to uint8_t is %u\n", narrow);
    return 0;
}
```

```output
300 truncated to uint8_t is 44
```

Assigning an `int` to a `uint8_t` is not rejected — C converts it **implicitly**, silently, with no cast written anywhere. The conversion is defined the same way overflow is for unsigned types: modulo $2^8$. $300 \bmod 256 = 44$, so `44` is what `narrow` gets, with no warning that three hundred and forty-four other values would have collided at the exact same result. This is exactly why fixed-width types from section 1 are worth reaching for deliberately: a `uint8_t` you declared on purpose documents that only 256 values were ever going to fit, where a plain `int` that later gets narrowed does the same truncation with none of the intent written down anywhere.

## Exercises

1. What does `stdint.h` give you that plain `int` does not?

2. Compute, by hand, what `uint8_t` value results from `250 + 10`. Show the modular arithmetic that gets you there.

3. Explain why "signed and unsigned overflow behave the same way, just with different ranges" is wrong, in terms of what the C standard actually guarantees for each.

4. On a machine where plain `char` is signed, what does `printf("%d\n", (char)200);` print? (`200` as an 8-bit two's complement bit pattern is the same bit pattern as some negative number — find it.)

5. Given `int x = 66;`, what does `printf("%c\n", x);` print, and why does this work even though `x` is an `int`, not a `char`?

6. `int wide = 1000;` is assigned to `uint8_t narrow = wide;`. Compute `narrow`'s value using `1000 % 256`.

7. Why can a program not portably rely on the exact numeric value `CHAR_MIN` expands to?

8. Two's complement represents `-1` as all-ones bits, regardless of width. What is `-1` as a `uint8_t` bit pattern, in hex? What is it as a `uint16_t` bit pattern?

## Answers

1. Exact, guaranteed widths on every conforming platform — `int8_t` is always 8 bits, `uint32_t` always 32, and so on — rather than "at least this many bits," with the precise size left to the implementation, as plain `int` and `long` are.

2. `250 + 10 = 260`. `260 mod 256 = 4`, so the `uint8_t` result is `4`.

3. Unsigned overflow is defined behaviour: the standard guarantees the result wraps modulo $2^n$ for an $n$-bit unsigned type, and code may rely on that. Signed overflow is undefined behaviour: the standard makes no guarantee at all, and a compiler is free to assume it never happens, which can produce results with no relationship to wraparound.

4. `200` in 8-bit binary is `11001000`. Interpreted as two's complement, that pattern is `-56` ($200 - 256$). The program prints `-56`.

5. It prints `B`. `66` is ASCII for `B`. `%c` tells `printf` to read the value as a single byte and display it as a character; passing a wider `int` still works because the value `66` fits comfortably within a byte's range, and `printf` only reads the byte `%c` asks for.

6. `1000 mod 256`: $1000 - 3 \times 256 = 1000 - 768 = 232$. `narrow` is `232`.

7. Because whether plain `char` is signed or unsigned is left to the implementation by the C standard; `CHAR_MIN` is `0` on a platform where `char` is unsigned, and a negative number, such as `-128`, where it is signed. Neither is guaranteed by the language itself.

8. As a `uint8_t`: `ff`, all 8 bits set. As a `uint16_t`: `ffff`, all 16 bits set. Two's complement `-1` is always every available bit set to `1`, whatever the width.
