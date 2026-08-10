---
id: m-summations
title: "Summations and closed forms"
track: math
---

# Summations and closed forms

`Proof by induction` proved that $1 + 2 + \cdots + n = \frac{n(n+1)}{2}$ by checking a base case and an inductive step, without ever writing the left side as anything other than a string of dots standing in for "and so on." This article gives that left side a name, **sigma notation**, a compact way to write a sum of many terms, and treats the identity just proved as the first entry in a small catalogue of sums whose **closed form** — a formula with no summation and no dots, evaluable in a fixed number of operations regardless of how many terms are being added — is worth having memorised.

## 1. Sigma notation

$$\sum_{i=1}^{n} f(i) = f(1) + f(2) + \cdots + f(n)$$

$\Sigma$ (capital sigma) means "sum the following expression once for every value of the **index**, $i$, from the number below $\Sigma$ up to the number above it, inclusive." $i$ is **bound** by the summation exactly as a quantified variable is bound by $\forall$ or $\exists$ in `Predicates and quantifiers`'s sense — it is a placeholder local to the sum, and renaming it changes nothing: $\sum_{i=1}^{n} i^2$ and $\sum_{k=1}^{n} k^2$ are the identical sum, written with a different letter.

$$\sum_{i=1}^{5} i^2 = 1^2 + 2^2 + 3^2 + 4^2 + 5^2 = 1 + 4 + 9 + 16 + 25 = 55$$

A sum with no terms at all — the upper bound below the lower bound, such as $\sum_{i=1}^{0} i$ — is defined to be $0$, the **empty sum**, matching the fact that adding nothing should change nothing.

## 2. Index manipulation

Three operations on sigma notation are used constantly enough to be worth naming outright.

**Splitting a sum** breaks one range into two adjacent ones:

$$\sum_{i=1}^{n} f(i) = \sum_{i=1}^{k} f(i) + \sum_{i=k+1}^{n} f(i), \qquad 1 \le k \le n$$

**Pulling out a constant factor** moves a term with no dependence on $i$ outside the sum entirely, since it is added to itself the same number of times regardless of what $i$ does:

$$\sum_{i=1}^{n} c \cdot f(i) = c \sum_{i=1}^{n} f(i)$$

**Splitting a sum of sums** distributes $\Sigma$ over $+$, the same way multiplication distributes over addition:

$$\sum_{i=1}^{n} \left( f(i) + g(i) \right) = \sum_{i=1}^{n} f(i) + \sum_{i=1}^{n} g(i)$$

**Shifting the index** re-labels which integer $i$ starts at, adjusting the expression inside to compensate, and leaves the sum's value unchanged:

$$\sum_{i=1}^{n} i = \sum_{j=0}^{n-1} (j+1)$$

writing $j = i - 1$, so $i$ ranges over $1, \ldots, n$ exactly when $j$ ranges over $0, \ldots, n-1$, and every term $i$ becomes $j + 1$ to compensate. Check both sides at $n = 3$: the left is $1 + 2 + 3 = 6$; the right is $(0+1) + (1+1) + (2+1) = 1 + 2 + 3 = 6$.

## 3. The arithmetic series

$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$

is exactly `Proof by induction`'s worked example, restated in sigma notation; the proof already given there — base case $n=1$, inductive step assuming the identity at $k$ and deriving it at $k+1$ — proves this identity too, since $\sum_{i=1}^{n} i$ and $1 + 2 + \cdots + n$ are the same sum written two ways. This is the single most useful closed form in the subject: any sum whose terms grow by a fixed amount each step, an **arithmetic series**, reduces to a rescaled or shifted version of it.

$$\sum_{i=1}^{n} (2i - 1) = 2\sum_{i=1}^{n} i - \sum_{i=1}^{n} 1 = 2 \cdot \frac{n(n+1)}{2} - n = n(n+1) - n = n^2$$

using section 2's factor-pulling and sum-splitting to reduce an unfamiliar sum to the arithmetic series plus the empty-index sum $\sum_{i=1}^n 1 = n$ ($1$ added to itself $n$ times), both already known in closed form.

## 4. The geometric series

$$\sum_{i=0}^{n} r^i = 1 + r + r^2 + \cdots + r^n = \frac{r^{n+1} - 1}{r - 1}, \qquad r \ne 1$$

is a **geometric series**: each term is the previous one multiplied by a fixed ratio $r$, rather than incremented by a fixed amount. Proof by induction on $n$, for fixed $r \ne 1$:

**Base case** ($n = 0$): left side is $r^0 = 1$; right side is $\frac{r^1 - 1}{r - 1} = \frac{r-1}{r-1} = 1$. Equal.

**Inductive step:** assume $\sum_{i=0}^{k} r^i = \frac{r^{k+1}-1}{r-1}$ for arbitrary $k \ge 0$. Then

$$\sum_{i=0}^{k+1} r^i = \sum_{i=0}^{k} r^i + r^{k+1} = \frac{r^{k+1}-1}{r-1} + r^{k+1} = \frac{r^{k+1} - 1 + r^{k+1}(r-1)}{r-1} = \frac{r^{k+2} - 1}{r-1},$$

using the inductive hypothesis on the sum's first $k+1$ terms and combining over a common denominator — exactly the claimed formula at $n = k+1$. Base case and inductive step together prove it for every $n \ge 0$.

For $0 < r < 1$, this is the closed form behind every "repeatedly take a fixed fraction" computation; for $r = 2$, $\sum_{i=0}^{n} 2^i = 2^{n+1} - 1$ — adding every power of two from $2^0$ up to $2^n$ falls exactly one short of the next power of two above them all, a fact worth recognising on sight, since it recurs constantly once binary representations are in view.

### Wrong model: A geometric series' closed form works for any ratio $r$

**What is actually true:** The derivation in section 4 divides by $r - 1$, which is undefined at $r = 1$. Directly, $\sum_{i=0}^{n} 1^i = 1 + 1 + \cdots + 1$, $n+1$ ones, equals $n + 1$ — the formula has to be stated as a separate case for $r = 1$, not extracted from the $r \ne 1$ closed form by substitution, which would divide by zero.

## 5. Sums arising from nested loops

A loop that runs $n$ times, doing a fixed amount of work per iteration, corresponds to $\sum_{i=1}^{n} c$ for some constant $c$ — the arithmetic series' degenerate case, equal to $cn$. A loop *nested* inside another, where the inner loop's bound depends on the outer loop's current index, corresponds to a sum whose upper bound is itself a variable:

$$\sum_{i=1}^{n} \sum_{j=1}^{i} 1 = \sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$

The inner sum, $\sum_{j=1}^{i} 1$, counts $i$ terms — one for every $j$ from $1$ to $i$ — collapsing to $i$ itself; the outer sum then adds that count up over every value of $i$ from $1$ to $n$, landing back on section 3's arithmetic series exactly. This pattern — an outer loop from $1$ to $n$, an inner loop whose own bound is the outer loop's current position — recurs constantly once code is being counted rather than numbers, `Counting operations: analysing iterative algorithms`'s subject; the identical sum answers "how many total iterations does this pair of nested loops run" as it does "what is $1 + 2 + \cdots + n$," because they are the same question asked two ways.

$$\sum_{i=1}^{n} \sum_{j=1}^{n} 1 = \sum_{i=1}^{n} n = n \cdot n = n^2$$

is the other common shape: an inner loop whose bound does *not* depend on the outer index, running the full $n$ iterations every single time, giving $n^2$ total rather than the triangular $\frac{n(n+1)}{2}$ — the two nested-loop sums above look superficially similar and land on structurally different closed forms, precisely because one inner bound depends on $i$ and the other does not.

## 6. Every closed form here was proved, not read off

Section 3's identity was proved in `Proof by induction`. Section 4's was proved in section 4 itself, by induction on $n$ for a fixed, arbitrary $r$. Section 5's followed from section 3's by direct substitution, not a fresh induction, because a sum equal termwise to an already-proved sum needs no new proof of its own. No closed form in this article is asserted by pattern-matching against a table; each either has an explicit inductive proof attached or is derived algebraically from one that does, using section 2's manipulation rules, which themselves follow directly from what $\Sigma$ means as a finite, term-by-term sum — nothing here depends on a closed form "looking right."

## Exercises

1. Rewrite $\sum_{i=3}^{7} (2i + 1)$ as an explicit list of terms, and evaluate it directly.

2. Using section 2's splitting and factor-pulling rules, reduce $\sum_{i=1}^{n} (3i + 2)$ to a closed form in terms of $n$, using section 3's arithmetic series.

3. Prove, by induction on $n$, that $\sum_{i=1}^{n} i^2 = \frac{n(n+1)(2n+1)}{6}$. (You may use section 4's proof as a template for the write-up.)

4. Evaluate $\sum_{i=0}^{6} 3^i$ using section 4's closed form, and check your answer by adding the seven terms directly.

5. A nested loop has an outer loop over $i$ from $1$ to $n$ and an inner loop over $j$ from $i$ to $n$ (not from $1$ to $i$, the reverse direction from section 5). Write the total iteration count as a nested sum, then find its closed form. (Hint: for fixed $i$, how many values does $j$ take?)

6. Explain, using section 4's wrong-model box, why $\sum_{i=0}^{n} 1^i = \frac{1^{n+1}-1}{1-1}$ is not a valid way to evaluate a sum of $n+1$ ones.

7. Using section 5, explain why $\sum_{i=1}^{n}\sum_{j=1}^{i} 1$ and $\sum_{i=1}^{n}\sum_{j=1}^{n} 1$ have different closed forms despite both being sums of nested $1$'s.

## Answers

1. $\sum_{i=3}^{7}(2i+1) = 7 + 9 + 11 + 13 + 15 = 55$.

2. $\sum_{i=1}^n (3i+2) = 3\sum_{i=1}^n i + \sum_{i=1}^n 2 = 3 \cdot \frac{n(n+1)}{2} + 2n = \frac{3n(n+1)}{2} + 2n = \frac{3n(n+1) + 4n}{2} = \frac{3n^2 + 7n}{2}$.

3. Base case ($n=1$): left side is $1^2 = 1$; right side is $\frac{1 \cdot 2 \cdot 3}{6} = 1$. Equal. Inductive step: assume $\sum_{i=1}^{k} i^2 = \frac{k(k+1)(2k+1)}{6}$ for arbitrary $k \ge 1$. Then $\sum_{i=1}^{k+1} i^2 = \frac{k(k+1)(2k+1)}{6} + (k+1)^2 = \frac{k(k+1)(2k+1) + 6(k+1)^2}{6} = \frac{(k+1)\left[k(2k+1) + 6(k+1)\right]}{6} = \frac{(k+1)(2k^2+7k+6)}{6} = \frac{(k+1)(k+2)(2k+3)}{6}$, which is the claimed formula at $n = k+1$, since $2(k+1)+1 = 2k+3$. Base case and inductive step give the identity for every $n \ge 1$.

4. $\sum_{i=0}^{6} 3^i = \frac{3^7 - 1}{3-1} = \frac{2187-1}{2} = 1093$. Direct sum: $1+3+9+27+81+243+729 = 1093$. Matches.

5. $\sum_{i=1}^{n}\sum_{j=i}^{n} 1$. For fixed $i$, $j$ ranges over $i, i+1, \ldots, n$, which is $n - i + 1$ values, so the total is $\sum_{i=1}^{n}(n-i+1)$. Reindexing with $k = n - i + 1$ (as $i$ runs $1$ to $n$, $k$ runs $n$ down to $1$) gives $\sum_{k=1}^{n} k = \frac{n(n+1)}{2}$ — the same triangular closed form as section 5's first example, since both count pairs $(i,j)$ with $i \le j$, just traversed in opposite directions.

6. Section 4's derivation divides by $r - 1$ to reach the closed form, which is undefined when $r = 1$; substituting $r=1$ into the already-divided formula computes $\frac{0}{0}$, not a valid number. The correct value, $n+1$, has to be established directly — by counting the $n+1$ ones being added — not by plugging $r=1$ into a formula whose derivation assumed $r \ne 1$.

7. In the first sum, the inner bound is $i$, so for a given outer value $i$ the inner sum contributes $i$, and these values themselves grow with $i$, giving the triangular total $\frac{n(n+1)}{2}$. In the second sum, the inner bound is the fixed constant $n$ regardless of $i$'s value, so every outer iteration contributes the same $n$, giving the flat total $n \cdot n = n^2$. The two sums differ because one inner loop's length depends on where the outer loop currently is and the other does not.
