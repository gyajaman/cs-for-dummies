---
id: m-growth-of-functions
title: "Growth of functions: polynomial, exponential, logarithmic"
track: math
---

# Growth of functions: polynomial, exponential, logarithmic

`Sets and functions` defined a function as an assignment from inputs to outputs and stopped there — it never asked how large the output gets as the input does. This article asks exactly that, for functions $f : \mathbb{N} \to \mathbb{R}$, and builds the small catalogue of growth behaviours — linear, polynomial, exponential, logarithmic — that every later comparison of two functions' growth will be measured against.

## 1. Comparing $f(n)$ and $g(n)$ as $n$ grows

Take $f(n) = 5n$ and $g(n) = n^2$. For small $n$, $f$ is larger: $f(3) = 15$, $g(3) = 9$. Past a certain point that reverses:

| $n$ | 1 | 2 | 3 | 4 | 5 | 6 | 10 | 20 |
|---|---|---|---|---|---|---|---|---|
| $f(n) = 5n$ | 5 | 10 | 15 | 20 | 25 | 30 | 50 | 100 |
| $g(n) = n^2$ | 1 | 4 | 9 | 16 | 25 | 36 | 100 | 400 |

At $n = 5$ they are equal; for every $n > 5$, $g(n) > f(n)$, and the gap widens without bound as $n$ grows further. This is what "$g$ grows faster than $f$" means in this article: not that $g(n)$ is bigger for every $n$ you happen to try, but that past some crossover point it is bigger for every $n$ from there on, by an ever-increasing margin. A single early comparison, such as $f(3) > g(3)$, says nothing about which function grows faster; only the long-run behaviour does.

## 2. Linear, quadratic, polynomial

$f(n) = an + b$ is **linear**: each increase of $n$ by $1$ increases $f(n)$ by the same fixed amount, $a$, no matter how large $n$ already is.

$f(n) = an^2 + bn + c$ is **quadratic**. Unlike the linear case, the amount $f$ increases by per step of $n$ is itself not fixed — it grows as $n$ does, which is exactly why a quadratic eventually overtakes any linear function, as section 1 showed concretely.

More generally, $f(n) = a_k n^k + a_{k-1}n^{k-1} + \cdots + a_1 n + a_0$, with $k$ a fixed non-negative integer and $a_k \ne 0$, is a **polynomial of degree $k$**. Linear is degree $1$; quadratic is degree $2$. Among two polynomials, the one of higher degree eventually overtakes the other and stays ahead, regardless of the coefficients — a degree-$2$ polynomial with tiny coefficients still eventually overtakes a degree-$1$ polynomial with enormous ones, it simply takes longer to reach its crossover point.

### Wrong model: A function with larger coefficients always produces larger values

**What is actually true:** Coefficients only shift where the crossover point falls, not which function eventually wins. Compare $f(n) = 1000n$ against $g(n) = n^2$: $f$ is larger all the way out to $n = 1000$, where they meet, and $g$ overtakes it from $n = 1001$ onward and never gives the lead back. The degree of the polynomial, not the size of its coefficients, decides who wins in the long run; the coefficients only decide how long "the long run" takes to arrive.

## 3. Exponential growth

$f(n) = c^n$, for a fixed base $c > 1$, is **exponential**. Its defining feature is that each increase of $n$ by $1$ *multiplies* $f(n)$ by $c$, rather than adding a fixed amount, and that compounding effect outgrows every polynomial:

| $n$ | 1 | 2 | 3 | 4 | 5 | 10 | 20 |
|---|---|---|---|---|---|---|---|
| $n^3$ | 1 | 8 | 27 | 64 | 125 | 1000 | 8000 |
| $2^n$ | 2 | 4 | 8 | 16 | 32 | 1024 | 1048576 |

At $n = 4$, $n^3 = 64$ still exceeds $2^n = 16$. By $n = 10$ they have crossed, and by $n = 20$, $2^n$ exceeds $n^3$ by a factor of more than $100$. No polynomial, however high its degree, ever overtakes an exponential again once it has fallen behind; the gap only widens, faster with every step.

## 4. The logarithm as inverse of exponentiation

Section 3 built $2^n$ by repeated doubling. The **logarithm base $c$**, $\log_c x$, asks the reverse question: to what power must $c$ be raised to get $x$? It is defined exactly by

$$\log_c x = y \iff c^y = x$$

$\log_2 8 = 3$ because $2^3 = 8$. $\log_2 1024 = 10$ because $2^{10} = 1024$. Since exponentiation grows a function explosively, its inverse does the opposite: the logarithm grows more slowly than any polynomial, the mirror image of section 3's exponential dominating every polynomial.

## 5. $\log_2 n$ as the number of halvings

$\log_2 n$ has a reading with no reference to exponents at all: it is the number of times $n$ can be divided by $2$ before reaching $1$ (rounding aside). Starting from $n = 1024$: $1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1$ — ten halvings, and $\log_2 1024 = 10$. This is not a coincidence; it is the same fact read in reverse. $c^y = x$ says "multiplying $1$ by $c$, $y$ times, reaches $x$"; halving $n$ repeatedly to reach $1$ is exactly undoing that process for $c = 2$, one halving per factor of $2$ removed. This reading is what makes $\log_2 n$ recur constantly in later articles: any process that repeatedly cuts a quantity of size $n$ in half does so about $\log_2 n$ times before it is exhausted.

## 6. Log identities

Three identities, each following directly from the defining property of exponents that a logarithm inverts:

$$\log_c(xy) = \log_c x + \log_c y \qquad \log_c(x^k) = k \log_c x \qquad \log_c x = \frac{\log_b x}{\log_b c}$$

The first turns a product inside the logarithm into a sum outside it — check it against $\log_2(4 \times 8) = \log_2 32 = 5$, and indeed $\log_2 4 + \log_2 8 = 2 + 3 = 5$. The second turns an exponent inside into a multiplier outside — $\log_2(2^3)^2 = \log_2 64 = 6 = 2 \times 3$. The third, the **change-of-base formula**, lets you compute a logarithm in any base from logarithms in any other base, and is the subject of section 7.

## 7. Why the base only changes a constant factor

By the change-of-base formula, $\log_c x = \log_2 x / \log_2 c$ for any base $c$. For a *fixed* base $c$, $\log_2 c$ is a fixed number — not something that grows with $x$ — so $\log_c x$ and $\log_2 x$ differ everywhere by exactly the same multiplicative constant, $1 / \log_2 c$. $\log_{10} x = \log_2 x / \log_2 10 \approx \log_2 x / 3.32$: computing in base $10$ instead of base $2$ shrinks every value by the same factor of about $3.32$, uniformly, for every $x$. It never changes which of two functions grows faster, only rescales the logarithmic one by a constant that does not depend on $n$ — which is why base is routinely left unwritten once growth rate, rather than an exact value, is what is being compared.

### Wrong model: $\log_2 n$ and $\log_{10} n$ are meaningfully different growth rates

**What is actually true:** Section 7's identity, $\log_c x = \log_2 x / \log_2 c$, makes the relationship between any two log bases a fixed multiplicative constant, not a difference in shape. $\log_2 1024 = 10$ and $\log_{10} 1024 \approx 3.01$ are different *numbers*, but the ratio between them, $10 / 3.01 \approx 3.32 = \log_2 10$, holds at every input, not just at $1024$. A quantity that grows "logarithmically" grows the same shape of curve regardless of which base is used to write it down; changing the base rescales the axis, it does not change the curve.

## Exercises

1. For $f(n) = 100n$ and $g(n) = n^2$, find the exact $n$ at which they are equal, and state which is larger for $n$ just below and just above it.

2. Using the table style of section 3, compute $n^2$ and $2^n$ for $n = 1, \ldots, 8$ and identify the crossover point.

3. Compute $\log_2 256$ and $\log_2 1$ directly from the definition in section 4.

4. Using section 5's halving reading, find $\log_2 64$ by repeated halving, and check it against $2^y = 64$.

5. Use the product identity from section 6 to compute $\log_2 1024$ as $\log_2(32 \times 32)$, without dividing $1024$ by $2$ ten times.

6. A process repeatedly discards half of a list of $n = 2000$ items until one remains. About how many discarding steps does this take? Which section's reading justifies your answer?

7. Explain, using section 7, why an algorithm described as taking "about $\log_2 n$ steps" and one described as taking "about $\log_{10} n$ steps" are not actually describing different growth behaviour.

8. A student claims $f(n) = 1{,}000{,}000 n$ grows faster than $g(n) = n^2$ because $f(n) > g(n)$ for every $n$ they tried, up to $n = 100{,}000$. Explain what is wrong with the claim, and state the crossover point.

## Answers

1. $100n = n^2 \implies n = 100$ (for $n \ne 0$). Just below, at $n = 99$: $f(99) = 9900 > g(99) = 9801$. Just above, at $n = 101$: $f(101) = 10100 < g(101) = 10201$.

2. $n^2$: $1, 4, 9, 16, 25, 36, 49, 64$. $2^n$: $2, 4, 8, 16, 32, 64, 128, 256$. They tie at $n = 2$ ($4 = 4$) and again at $n = 4$ ($16 = 16$); from $n = 5$ onward $2^n$ stays ahead and the gap widens.

3. $\log_2 256 = 8$, since $2^8 = 256$. $\log_2 1 = 0$, since $2^0 = 1$.

4. $64, 32, 16, 8, 4, 2, 1$ — six halvings, so $\log_2 64 = 6$. Check: $2^6 = 64$.

5. $\log_2(32 \times 32) = \log_2 32 + \log_2 32 = 5 + 5 = 10$, matching $\log_2 1024 = 10$ from section 5.

6. About $\log_2 2000 \approx 11$ steps, since $2^{10} = 1024$ and $2^{11} = 2048$, so $11$ halvings are needed to bring $2000$ down to $1$. Section 5's reading — $\log_2 n$ as the number of halvings to reach $1$ — justifies this directly.

7. By section 7, $\log_{10} n = \log_2 n / \log_2 10 \approx \log_2 n / 3.32$ — the two differ everywhere by the same fixed multiplicative constant, not by a difference in how the count grows as $n$ increases. Both describe the same underlying "logarithmic" shape; only the specific number reported at each $n$ changes with the base.

8. Section 1's lesson applies directly: a comparison checked only over a finite range of $n$, however large, does not establish which function grows faster in the long run — it only establishes the ordering up to the point actually checked. Setting $1{,}000{,}000\,n = n^2$ gives the crossover at $n = 1{,}000{,}000$; for every $n$ beyond that, $g(n) = n^2$ is larger, and the gap grows without bound.
