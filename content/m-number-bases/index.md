---
id: m-number-bases
title: "Number bases: binary, decimal, hexadecimal"
track: math
---

# Number bases: binary, decimal, hexadecimal

You already know how to read the number $4527$. This article makes explicit the rule you have been using without naming it, so that reading $2f_{16}$ or $10110_2$ later is exactly the same skill, applied with a different number of digits available.

## 1. Positional notation

$4527$ means:

$$4527 = 4 \times 10^3 + 5 \times 10^2 + 2 \times 10^1 + 7 \times 10^0$$

Each digit's contribution depends on its position, not just its face value: the $4$ is worth four thousand because it sits three places from the right, not because $4$ inherently means four thousand anything. This is **positional notation**, and decimal, base ten, is only one choice of how many distinct digits are available at each position. In general, a number written in base $b$ using digits $d_k d_{k-1} \cdots d_1 d_0$, each digit satisfying $0 \le d_i < b$, means

$$n = \sum_{i=0}^{k} d_i \, b^i.$$

Decimal uses $b = 10$ and ten digits, $0$ through $9$, because that is how many distinct symbols the notation provides at each position. Nothing about positional notation requires $b$ to be $10$.

## 2. Binary

**Binary** is base $2$: only two digits exist at each position, $0$ and $1$.

$$10110_2 = 1 \times 2^4 + 0 \times 2^3 + 1 \times 2^2 + 1 \times 2^1 + 0 \times 2^0 = 16 + 0 + 4 + 2 + 0 = 22$$

The subscript $2$ names the base; without it, $10110$ is ambiguous between several possible values depending on what base was intended. Binary matters for one reason ahead of every other: a wire, or a switch, has two easily distinguished states, not ten — base $2$ is what the physical hardware actually is, a fact `The machine model` builds an entire picture around.

## 3. Hexadecimal

**Hexadecimal** is base $16$: sixteen digits are needed at each position, so the ten decimal digits are extended with six more, borrowed from the alphabet: $a = 10$, $b = 11$, $c = 12$, $d = 13$, $e = 14$, $f = 15$.

$$2f_{16} = 2 \times 16^1 + f \times 16^0 = 2 \times 16 + 15 \times 1 = 32 + 15 = 47$$

Hexadecimal is not how the hardware works — nothing physical has sixteen states — it is a notation chosen for a reason made precise in section 5.

## 4. Conversion, both directions

Converting *to* decimal from another base is exactly the sum from section 1, worked out numerically, as both examples above already did.

Converting *from* decimal to another base runs the same idea in reverse, by repeated division. To convert $43$ to binary, divide by $2$ repeatedly, keeping each remainder, until nothing is left:

$$
\begin{aligned}
43 \div 2 &= 21 \text{ remainder } 1\\
21 \div 2 &= 10 \text{ remainder } 1\\
10 \div 2 &= 5 \text{ remainder } 0\\
5 \div 2 &= 2 \text{ remainder } 1\\
2 \div 2 &= 1 \text{ remainder } 0\\
1 \div 2 &= 0 \text{ remainder } 1
\end{aligned}
$$

Reading the remainders from the last line to the first gives $101011_2$. Check it against section 1's formula: $1 \times 32 + 0 \times 16 + 1 \times 8 + 0 \times 4 + 1 \times 2 + 1 \times 1 = 32 + 8 + 2 + 1 = 43$. The same procedure, dividing by $16$ instead of $2$ and writing each remainder as a hex digit, converts decimal to hexadecimal.

### Wrong model: Converting a number to another base changes the number

**What is actually true:** $101011_2$, $43$, and $2b_{16}$ are three different *spellings* of the exact same quantity — the same way "eleven," "XI," and "$11$" all name one value using unrelated notations. Conversion changes which digits are written down and what base they are read in; it does not touch the quantity itself. Nothing is computed on or transformed in the everyday arithmetic sense — the value was always $43$, before, during, and after choosing how to write it.

## 5. Why one byte is exactly two hex digits

Bits are conventionally grouped into blocks of eight, called **bytes** — `The machine model` builds its entire picture of memory on this grouping. A byte can hold $2^8 = 256$ distinct patterns, from $00000000_2$ to $11111111_2$.

Each hexadecimal digit distinguishes exactly $16$ possibilities — and $16 = 2^4$, exactly as many possibilities as four bits distinguish. One hex digit and four bits carry identical information, always, with nothing left over on either side. A byte, eight bits, is therefore exactly two groups of four bits — exactly two hex digits, no more, no less:

$$11111111_2 = ff_{16} = 15 \times 16 + 15 = 255$$

This is the entire reason hexadecimal is used constantly for byte values and decimal is not: in decimal, a byte's value needs one, two, or three digits depending on the value, an invisible, value-dependent boundary. In hexadecimal, it is always exactly two, every time, for every byte, which is why memory is written in hex throughout this book rather than in decimal.

### Wrong model: A digit string means the same thing regardless of which base it is read in

**What is actually true:** The string "$11$" is not a fixed quantity waiting to be discovered — it means whatever section 1's formula says it means, once you know $b$. Read as binary, $11_2 = 1 \times 2 + 1 = 3$. Read as decimal, $11_{10} = 11$. Read as hexadecimal, $11_{16} = 1 \times 16 + 1 = 17$. Three different values, one identical string of digits; the base is not decoration on the number, it is part of what makes the digits mean anything at all.

## 6. Powers of two and the $2^{10} \approx 10^3$ approximation

Powers of two come up constantly once bits are involved, and the small ones are worth having memorised as reflexes: $2^8 = 256$, $2^{10} = 1024$, $2^{16} = 65536$.

Notice $2^{10} = 1024$, remarkably close to $10^3 = 1000$ — about $2.4\%$ higher. This approximation compounds usefully: $2^{20} = (2^{10})^2 \approx (10^3)^2 = 10^6$, and $2^{30} \approx 10^9$. It lets you convert a power of two into a decimal order of magnitude almost for free, in your head, which is exactly why "a kilobyte is about a thousand bytes, a megabyte about a million" is close enough to be useful despite $1024 \ne 1000$.

## Exercises

1. Expand $4527$ using positional notation, writing out each digit's contribution separately, as in section 1.

2. Convert $10110_2$ to decimal by hand. (You may check your working against section 2, but compute it yourself first.)

3. Convert $43$ to binary using repeated division by $2$, showing every remainder, and check your final answer against section 4's.

4. Convert $2f_{16}$ to decimal.

5. Explain, using powers of two and sixteen, why one hexadecimal digit corresponds to exactly four bits, and why one byte therefore corresponds to exactly two hex digits.

6. Using $2^{10} \approx 10^3$, estimate $2^{16}$ to the nearest convenient power of ten without computing it exactly first. How close is your estimate to the true value, $65536$?

7. Explain why "$11$" does not have one fixed meaning, using the positional-notation formula from section 1 to justify your answer.

8. A byte's unsigned range is $0$ through $255$. Confirm this matches exactly the range of a two-digit hexadecimal number, from $00_{16}$ to $ff_{16}$.

## Answers

1. $4527 = 4 \times 10^3 + 5 \times 10^2 + 2 \times 10^1 + 7 \times 10^0 = 4000 + 500 + 20 + 7$.

2. $10110_2 = 1 \times 16 + 0 \times 8 + 1 \times 4 + 1 \times 2 + 0 \times 1 = 16 + 4 + 2 = 22$.

3. $43 \div 2 = 21$ r $1$; $21 \div 2 = 10$ r $1$; $10 \div 2 = 5$ r $0$; $5 \div 2 = 2$ r $1$; $2 \div 2 = 1$ r $0$; $1 \div 2 = 0$ r $1$. Reading remainders last-to-first: $101011_2$, matching section 4.

4. $2f_{16} = 2 \times 16 + 15 \times 1 = 32 + 15 = 47$.

5. Sixteen possibilities is $2^4$, the same number of possibilities four bits distinguish, so a single hex digit and four bits always carry identical information. A byte is eight bits, exactly two groups of four, so it is exactly two hex digits — never more, never fewer, regardless of the byte's actual value.

6. $2^{16} = 2^{10} \times 2^6 \approx 10^3 \times 64 = 64000$. The true value, $65536$, is about $2.4\%$ higher than the estimate — the same gap between $2^{10}$ and $10^3$ that produced the approximation in the first place.

7. By section 1's formula, $n = \sum d_i b^i$ — the value depends on $b$, which is not part of the digit string itself. "$11$" read with $b = 2$ gives $1 \times 2 + 1 = 3$; with $b = 10$, gives $11$; with $b = 16$, gives $1 \times 16 + 1 = 17$. The same three symbols produce three different values because $b$ differs each time.

8. $00_{16} = 0$ and $ff_{16} = 15 \times 16 + 15 = 255$. A two-digit hexadecimal number ranges over $16 \times 16 = 256$ distinct combinations, $0$ through $255$ — exactly a byte's unsigned range, with no gaps and no leftover values on either side.
