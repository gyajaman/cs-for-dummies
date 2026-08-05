---
id: c-machine-model
title: "The machine model"
track: c
---

# The machine model

Every other topic on this site eventually reduces to a claim about what the machine does. If your picture of the machine is wrong, those claims will feel arbitrary, and you will end up memorising rules instead of deriving them. This article gives you the picture. There is no C to write yet, but there is one program to run at the end, and you should run it.

The machine you will reason about has two parts: a large array of numbered slots called **memory**, and a device called the **CPU** that reads slots, writes slots, and does arithmetic. That is the whole model. Everything else is detail layered on top.

## 1. Bits

A wire in a computer is either at a high voltage or a low voltage. There is no third option, and the two options are far enough apart that noise cannot turn one into the other. Call them $1$ and $0$. One such wire carries one **bit**.

One bit distinguishes two things. Two bits distinguish four: $00, 01, 10, 11$. In general $n$ bits distinguish $2^n$ things, because each additional bit doubles the number of distinct patterns.

$$\text{number of patterns in } n \text{ bits} = 2^n$$

This is the single most-used formula in the subject, so it is worth having the small powers of two memorised as reflexes:

$$2^8 = 256, \quad 2^{10} = 1024, \quad 2^{16} = 65536, \quad 2^{20} \approx 10^6, \quad 2^{32} \approx 4.3 \times 10^9$$

Notice that $2^{10} = 1024 \approx 10^3$. This is why $2^{20} \approx 10^6$ and $2^{30} \approx 10^9$: raising both sides to a power gives you the decimal magnitudes almost for free.

## 2. Bytes and addresses

Bits are grouped into blocks of eight, called **bytes**. A byte therefore holds one of $2^8 = 256$ patterns. There is no deep reason the number is eight rather than seven or nine — it is a historical convention that hardened — but it is universal on every machine you will use, so treat it as fixed.

Memory is a very long line of bytes, each one numbered. The number is the byte's **address**. Addresses start at $0$ and count up by one per byte.

```
address:   0     1     2     3     4     5     6     7     8   ...
         +-----+-----+-----+-----+-----+-----+-----+-----+-----+
memory:  | 4a  | 00  | e8  | 03  | 00  | 00  | ff  | 20  | 6b  | ...
         +-----+-----+-----+-----+-----+-----+-----+-----+-----+
```

Each cell above holds eight bits, written here in **hexadecimal**: two hex digits, each digit standing for four bits. Hexadecimal is used constantly for byte values because the correspondence is exact — one byte is always exactly two hex digits — whereas in decimal a byte is one, two, or three digits and the boundaries are invisible. The digits run $0$–$9$ then $a$–$f$, so $a = 10$, $f = 15$, and

$$\texttt{e8}_{16} = 14 \times 16 + 8 = 232.$$

Two operations are available on memory, and only two:

- **Read**: give an address, get back the byte stored there.
- **Write**: give an address and a byte, replace what was there.

Reading does not consume anything; you can read the same address a million times and get the same byte, provided nothing wrote to it in between. Writing destroys what was there, with no record of the previous value.

The size of the address is itself a design decision with visible consequences. If an address is 32 bits wide, then there are $2^{32}$ distinct addresses, so at most $2^{32}$ bytes $\approx 4.3$ GB of memory can be named at all. This is not a limitation of the memory chips; it is a limitation of the numbering. Machines you use today have 64-bit addresses, giving $2^{64} \approx 1.8 \times 10^{19}$ nameable bytes, which is enormously more memory than exists.

### Wrong model: Memory stores your data in labelled containers

A common starting picture is that memory holds *things* — a number here, a word there, each in its own container, each container knowing what kind of thing it holds.

**What is actually true:** Memory holds bytes. A byte is a pattern of eight bits and nothing else. It does not know whether it is part of a number, part of a letter, part of an image, or part of the program's own instructions. There is no label, no type tag, no marker for where one item ends and the next begins. If you look at address 4000 and find the byte `48`, that byte is `48`. What it *means* is determined entirely by the code that reads it.

This is not a pedantic distinction. It is the reason C behaves the way it does, and you will meet it again in `Variables, types, and memory addresses`, in `Integer representation, fixed width, and overflow`, and every time a program crashes.

## 3. The same bytes, several meanings

Take the two bytes `48 69`.

Interpreted as text in the ASCII encoding, `48` is the letter `H` and `69` is the letter `i`, so the pair spells `Hi`.

Interpreted as a single 16-bit unsigned number with the first byte more significant, it is

$$\texttt{48}_{16} \times 256 + \texttt{69}_{16} = 72 \times 256 + 105 = 18537.$$

Interpreted as two separate 8-bit numbers, it is $72$ and $105$.

Interpreted as machine instructions for an x86 processor, it is the beginning of an instruction that decrements a register.

All four readings are correct. The bytes do not prefer one. The interpretation lives in the program, not in the memory.

## 4. The CPU

The CPU is a small circuit that repeats one loop forever:

```
        +---------------------------------+
        |                                 |
        v                                 |
    +--------+     +--------+     +---------+
    | FETCH  | --> | DECODE | --> | EXECUTE |
    +--------+     +--------+     +---------+
   read the        work out       do it, and
   bytes at        which          update PC
   address PC      operation
                   they name
```

`PC` is the **program counter**: a register holding the address of the next instruction to run. Fetch reads the bytes at that address. Decode works out what operation those bytes name and what operands it takes. Execute performs it — an addition, a memory read, a memory write, a jump — and then `PC` is updated, usually to the address just after the instruction that was fetched, so the next iteration picks up the next instruction along.

A **register** is a storage slot inside the CPU itself. There are very few of them — 16 on x86-64, 31 on ARM64 — and each holds 8 bytes. They have names, not addresses: on x86-64 they are called `rax`, `rbx`, `rcx`, and so on. They exist because reading from memory is slow relative to the CPU's own speed, so arithmetic is done on values held in registers, and memory is touched only to load values in and store results back out.

An instruction is typically of a form like one of these:

- load the 4 bytes at address 4000 into register `rax`
- add register `rbx` to register `rax`, leaving the result in `rax`
- store the 4 bytes of `rax` to address 4008
- if `rax` is zero, set `PC` to 2300

That last one is the whole of control flow. Loops and `if` statements, which you will meet shortly, compile down to conditional changes to `PC` and nothing more exotic than that.

### Worked trace

Suppose memory holds the number $7$ in the four bytes at address 4000, and the number $5$ at address 4004, and the instructions starting at address 100 are:

```
100:  load  rax <- [4000]
108:  load  rbx <- [4004]
116:  add   rax <- rax + rbx
120:  store [4008] <- rax
```

With `PC` = 100, the loop runs four times. After the first, `rax` holds 7 and `PC` is 108. After the second, `rbx` holds 5 and `PC` is 116. After the third, `rax` holds 12. After the fourth, the four bytes at address 4008 hold 12, and `PC` is 128, where whatever comes next will be fetched.

Nothing in that sequence knows it computed a sum of two quantities that a human cared about. The CPU has no notion of your intent. It has a program counter and a rule for what to do next.

## 5. Instructions are bytes in the same memory

The instructions in that trace live at addresses 100 to 127. Those are ordinary memory addresses in the ordinary memory, holding ordinary bytes. There is no separate compartment for code. The only thing that makes the bytes at address 100 "instructions" is that `PC` pointed at them and the fetch–decode–execute loop ran over them.

This is the **stored-program** idea, and it is what makes a general-purpose computer possible. Because programs are just bytes, a program can be loaded from a file, moved around, and — crucially — a program can be the *output* of another program. That is what a compiler is: a program whose output bytes are another program's instructions. `Building and running a C program` covers this.

It also means that a program which writes to the wrong address can overwrite its own instructions, and the CPU will fetch and execute whatever is now there. Modern operating systems mark instruction regions read-only to prevent exactly this, but the marking is a protection added on top, not a property of the memory.

### Wrong model: The CPU understands C

**What is actually true:** The CPU understands one instruction set — a fixed, finite list of operations encoded as byte patterns, wired into the silicon. It has never encountered C, has no notion of a variable name, a function, a type, or a loop. Every one of those is a construct that exists in your source file and is gone by the time the program runs. A compiler's job is to translate them into loads, stores, arithmetic, and jumps. When you later ask "how fast is this loop", the honest form of the question is "how many instructions does this become, and how many of them touch memory".

## 6. Two honest simplifications

**The addresses you see are not physical.** The operating system gives each running program the illusion of its own private memory starting near zero, and translates those *virtual* addresses to physical locations in the RAM chips behind your back. Two programs can both hold address 4000 and be referring to different physical bytes. Nothing in this article breaks because of this; you can reason entirely in virtual addresses, and that is what the rest of the site will do.

**The fetch–decode–execute loop is not sequential in practice.** Real CPUs work on many instructions at once, start executing instructions before earlier ones have finished, guess which way a branch will go, and reorder work. The observable result is as if the instructions ran one at a time in order, which is why the simple model remains correct for reasoning about *what* a program computes. It is not sufficient for predicting *how fast*, which is a much later topic.

## 7. Run this

You cannot read this program yet. Run it anyway. Every line of output is a claim from the sections above, checked against a real machine.

Save it as `demo.c`. If you do not yet have a compiler installed, follow the installation guide first, then come back.

```c file=demo.c run
#include <stdio.h>

int main(void)
{
    int n = 1000;
    char c = 'H';

    unsigned char *bytes = (unsigned char *)&n;

    printf("n occupies %zu bytes, starting at address %p\n", sizeof n, (void *)&n);
    printf("c occupies %zu byte,  starting at address %p\n", sizeof c, (void *)&c);

    printf("the bytes of n are:");
    for (size_t i = 0; i < sizeof n; i++)
        printf(" %02x", bytes[i]);
    printf("\n");

    printf("the byte of c is: %02x\n", (unsigned char)c);

    bytes[0] = 0xe9;
    printf("after changing one byte, n is now %d\n", n);

    return 0;
}
```

Compile and run it:

```
gcc -Wall -Wextra -std=c17 -o demo demo.c
./demo
```

On one machine this printed:

```output
n occupies 4 bytes, starting at address {{ANY}}
c occupies 1 byte,  starting at address {{ANY}}
the bytes of n are: e8 03 00 00
the byte of c is: 48
after changing one byte, n is now 1001
```

Your addresses will differ, and they will differ again the next time you run it — the operating system deliberately places programs at randomised addresses. The rest of the output should match.

Read the output against the model:

**`n occupies 4 bytes.`** The number 1000 does not live in one slot. It is spread over four consecutive addresses, and the machine treats those four as a unit only because the instructions that touch them are four-byte load and store instructions.

**`the bytes of n are: e8 03 00 00`.** Check this: $1000 = 3 \times 256 + 232$, and $232 = \texttt{e8}_{16}$, $3 = \texttt{03}_{16}$. So the four bytes are `e8`, `03`, `00`, `00` — with the *least* significant byte at the lowest address. That ordering is called **little-endian**, and it is what x86 and ARM chips do. It looks backwards when written out, and there is no profound reason for it; it is a convention, and the opposite convention exists too. What matters here is that you have just looked at the individual bytes of a number, which is only a meaningful thing to do because the number was bytes all along.

**`the byte of c is: 48`.** The letter `H` is stored as the number 72, which is $\texttt{48}_{16}$. There is no letter in the machine. There is a byte, and a convention (ASCII) that says byte 72 is drawn as `H`. This is section 3 in the flesh: the same byte `48` appeared there as part of the number 18537.

**`after changing one byte, n is now 1001`.** The program wrote `e9` over the lowest byte. It did not touch anything named `n`, and it did not perform arithmetic on 1000. It replaced one byte in memory, and $1001 = 3 \times 256 + 233$ where $233 = \texttt{e9}_{16}$. The value of `n` changed because the value of `n` *is* those bytes. There is nothing else to it.

**The addresses of `n` and `c`.** In the run above, `c` sits at a *lower* address than `n`, even though it appears second in the source. Do not conclude that the compiler reverses things; conclude that the source order of two independent variables tells you nothing about their addresses. The compiler places them wherever it likes.

### Wrong model: A variable is a labelled box the machine knows about

**What is actually true:** `n` is a name that exists in your source file. After compilation it is gone. What remains is an address, hard-coded into the load and store instructions the compiler emitted. Nothing at that address records that it was once called `n`, and nothing records that it holds a four-byte integer rather than four one-byte characters. `Variables, types, and memory addresses` builds this out properly.

## Exercises

1. How many distinct values can be stored in three bytes?

2. A machine uses 40-bit addresses. What is the largest amount of memory it can address, expressed in gibibytes ($1 \text{ GiB} = 2^{30}$ bytes)?

3. Give three different meanings for the two bytes `41 42`, stating the interpretation you are using in each case. (You may need a table of ASCII codes for one of them; `A` is 65.)

4. A counter occupies 32 bits and is incremented once per millisecond, starting from 0. Approximately how long until it runs out of distinct values? Give your answer in days.

5. Predict the exact output line `the bytes of n are:` would produce if `n` were set to `1` instead of `1000`. Then change the program and check.

6. Predict the output if `n` were set to `256`. Check.

7. In the trace in section 4, the four instructions occupy addresses 100, 108, 116, and 120. How many bytes long is each of the first three instructions? What does the fact that they are not all the same length tell you about how the fetch step must work?

8. A program contains a loop that adds up 1000 numbers stored in memory. Using only the operations listed in section 4, describe roughly what the CPU does per iteration. Your answer should mention `PC` at least once.

9. Suppose a byte at some address holds `00`. Someone claims this means "the memory there is empty". What is wrong with that claim?

## Answers

1. $2^{24} = 16{,}777{,}216$.

2. $2^{40}$ bytes $= 2^{40}/2^{30} = 2^{10} = 1024$ GiB, i.e. 1 TiB.

3. As ASCII text, `AB`. As two 8-bit unsigned numbers, 65 and 66. As one 16-bit unsigned number with `41` most significant, $65 \times 256 + 66 = 16706$; with `42` most significant (little-endian), $66 \times 256 + 65 = 16961$. Any three distinct, correctly-stated readings count.

4. $2^{32} \approx 4.295 \times 10^9$ milliseconds. Dividing by $1000 \times 60 \times 60 \times 24 = 8.64 \times 10^7$ gives $\approx 49.7$ days.

5. `01 00 00 00`. The least significant byte comes first.

6. `00 01 00 00`, since $256 = 1 \times 256 + 0$.

7. The first is 8 bytes ($108-100$), the second 8 bytes, the third 4 bytes ($120-116$). Since instructions vary in length, the fetch step cannot read a fixed number of bytes and be done; the decode step must determine the instruction's length, and only then can `PC` be advanced correctly. This is true of x86. Some architectures, including ARM64, use fixed-length instructions precisely to avoid this.

8. Per iteration, roughly: load the next value from memory into a register; add that register into a running-total register; increment the register holding the current address; compare a counter against 1000; conditionally set `PC` back to the address of the first instruction of the loop body. When the comparison finally fails, `PC` is not reset and execution continues past the loop.

9. `00` is a byte value like any other — the number zero, or the ASCII NUL character, or one byte of a larger number, depending on interpretation. Memory has no "empty" state; every address always holds one of 256 patterns. An address you have never written to holds whatever was left there by whatever used it previously.