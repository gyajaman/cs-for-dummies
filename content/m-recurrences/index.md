---
id: m-recurrences
title: "Recurrence relations"
track: math
---

# Recurrence relations

`Summations and closed forms` reduced a sum with $n$ terms to a formula with none. This article reduces a different kind of description to a closed form: a function $T(n)$ defined not by a formula in $n$ directly, but by a formula in terms of $T$ at *smaller* arguments — a **recurrence**. Every technique here turns a recurrence into the same kind of closed form `Summations and closed forms` produced, using `Proof by induction` to check the answer once it is found.

## 1. $T(n)$ in terms of smaller arguments

A recurrence defines $T(n)$ using two parts: one or more **base cases**, fixed values of $T$ at small, specific arguments, stated directly with no reference to $T$ itself; and a **recursive case**, a rule for $T(n)$ written in terms of $T$ at strictly smaller arguments. For instance,

$$T(0) = 0, \qquad T(n) = T(n-1) + n \text{ for } n \ge 1$$

defines $T$ completely: $T(1) = T(0) + 1 = 1$, $T(2) = T(1) + 2 = 3$, $T(3) = T(2) + 3 = 6$, each value computable from the ones already found, all the way down to the base case that needs nothing further. This is not a closed form — computing $T(100)$ this way takes $100$ steps — and turning it into one is what the rest of this article is for.

## 2. Solving by unrolling

**Unrolling** substitutes the recursive case into itself repeatedly, watching for a pattern, until the base case appears.

$$T(n) = T(n-1) + n = \big(T(n-2) + (n-1)\big) + n = T(n-2) + (n-1) + n = \cdots$$

Continuing this substitution $n$ times reaches the base case:

$$T(n) = T(0) + 1 + 2 + \cdots + n = 0 + 1 + 2 + \cdots + n = \frac{n(n+1)}{2}$$

using `Summations and closed forms`'s arithmetic series directly on the accumulated sum. Unrolling turns a recurrence into exactly the sum-per-iteration picture `Counting operations: analysing iterative algorithms` builds for loops, because a recurrence like this one *is* what a single loop's operation count looks like before it has been reduced.

## 3. Guess and verify by induction

Unrolling produces a candidate closed form; `Proof by induction` confirms it actually satisfies the recurrence, independent of how it was found. Claim: $T(n) = \frac{n(n+1)}{2}$ for the recurrence in section 1.

**Base case** ($n=0$): the recurrence states $T(0) = 0$; the claimed formula gives $\frac{0 \times 1}{2} = 0$. Equal.

**Inductive step:** assume $T(k) = \frac{k(k+1)}{2}$ for arbitrary $k \ge 0$. The recurrence states $T(k+1) = T(k) + (k+1)$. Substituting the inductive hypothesis,

$$T(k+1) = \frac{k(k+1)}{2} + (k+1) = \frac{k(k+1) + 2(k+1)}{2} = \frac{(k+1)(k+2)}{2},$$

exactly the claimed formula at $n = k+1$. Base case and inductive step together prove $T(n) = \frac{n(n+1)}{2}$ for every $n \ge 0$ — this proof stands on its own, checkable without ever having unrolled anything, even though unrolling is what suggested the formula to check in the first place.

## 4. Recursion trees

A **recursion tree** draws a recurrence's unrolling as a tree: the root is $T(n)$'s own extra work, each child is one recursive call the recursive case makes, and the tree's leaves are base cases. Section 1's recurrence produces a tree with exactly one child per node — a single chain, not a branching tree at all — with the root contributing $n$, its child contributing $n-1$, and so on down to a leaf contributing the base case:

```
T(n)   contributes n
 |
T(n-1) contributes n-1
 |
T(n-2) contributes n-2
 |
...
 |
T(0)   contributes 0 (base case)
```

Summing every node's contribution down this single chain reproduces section 2's unrolled sum directly, $n + (n-1) + \cdots + 0$, with nothing new added by drawing it as a tree — the value of the picture shows up once a recurrence branches into more than one call per level, section 6's subject.

## 5. The shape $T(n) = T(n-1) + f(n)$

Sections 1 through 4 are all one instance of a general shape: $T(n) = T(n-1) + f(n)$, a single recursive call per level, contributing whatever $f(n)$ is at that level. Unrolling this shape in general gives

$$T(n) = T(0) + f(1) + f(2) + \cdots + f(n) = T(0) + \sum_{i=1}^{n} f(i)$$

a direct sum of $f$ over every level, reducible to closed form exactly as `Summations and closed forms` reduces any sum — $f(n) = n$ gave the arithmetic series above; $f(n) = c$, a constant, would give $T(0) + cn$; $f(n) = 2^n$ would give a geometric series. The shape of $f$ entirely determines which of `Summations and closed forms`'s identities applies.

## 6. The shape $T(n) = a\,T(n/b) + f(n)$

The second common shape splits the problem into $a$ smaller calls, each of size $n/b$, plus $f(n)$ extra work at the current level:

$$T(1) = 1, \qquad T(n) = 2\,T(n/2) + n \text{ for } n \ge 2$$

Assume, to keep the arithmetic exact, that $n$ is a power of $2$. Unrolling by substituting $n = 2^k$ and writing $S(k) = T(2^k)$:

$$S(0) = T(1) = 1, \qquad S(k) = 2\,S(k-1) + 2^k$$

**Guess and verify, by induction on $k$:** claim $S(k) = 2^k(k+1)$.

**Base case** ($k=0$): $S(0) = 1$; the formula gives $2^0(0+1) = 1$. Equal.

**Inductive step:** assume $S(k-1) = 2^{k-1} k$ for arbitrary $k \ge 1$. Then

$$S(k) = 2\,S(k-1) + 2^k = 2 \cdot 2^{k-1}k + 2^k = 2^k k + 2^k = 2^k(k+1),$$

exactly the claimed formula. Translating back, $n = 2^k$ means $k = \log_2 n$, so

$$T(n) = S(k) = 2^k(k+1) = n(\log_2 n + 1).$$

Check against direct computation: $T(1) = 1$, $T(2) = 2(1+1)=4$, $T(4)=4(2+1)=12$, $T(8)=8(3+1)=32$ — each matches unrolling $T(n) = 2T(n/2)+n$ by hand from $T(1)=1$.

This recurrence's tree genuinely branches: the root contributes $n$; level $1$ has $2$ nodes, each handling a problem of size $n/2$ and each contributing $n/2$ of its own extra work, for a level total of $2 \times \frac{n}{2} = n$; level $2$ has $4$ nodes of size $n/4$, level total $4 \times \frac{n}{4} = n$ again.

```
level 0:        T(n)                       contributes n         (1 node)
level 1:    T(n/2)   T(n/2)                 contributes n total  (2 nodes)
level 2: T(n/4) T(n/4) T(n/4) T(n/4)        contributes n total  (4 nodes)
   ...
level log2(n):  1 per leaf, n/n = 1 each    contributes n total  (n nodes)
```

Every level contributes exactly $n$, and there are $\log_2 n + 1$ levels (level $0$ through level $\log_2 n$, where the problem size finally reaches $1$), so the total is $n(\log_2 n + 1)$ — the recursion tree reproduces the closed form section 6 just proved by induction, by a second, independent route: multiply the per-level total by the number of levels, rather than unrolling algebraically.

## 7. The master theorem

Solving $T(n) = a\,T(n/b) + f(n)$ from scratch by induction, as section 6 did, works but is repetitive across problems that share the same shape. The **master theorem** packages the answer for this entire family of recurrences into three cases, comparing $f(n)$ against $n^{\log_b a}$ — the total work the branching alone would produce if every level's extra work were exactly proportional to that level's total problem size, with $f(n)$ set aside entirely. Stated here, not proved, using `Predicates and quantifiers`'s $\exists$ and $\forall$ directly to say precisely what "dominates" and "balanced" mean, rather than a shorthand name for the same relationship:

For $T(n) = a\,T(n/b) + f(n)$ with $a \ge 1$, $b > 1$:

1. If $\exists \varepsilon > 0, \exists c>0, \exists n_0, \forall n \ge n_0, f(n) \le c\,n^{\log_b a - \varepsilon}$ (the branching term dominates), then $\exists c_1, c_2 > 0, \exists n_1, \forall n \ge n_1, c_1 n^{\log_b a} \le T(n) \le c_2 n^{\log_b a}$ — $T(n)$ is sandwiched between constant multiples of $n^{\log_b a}$ from some point on.
2. If $\exists c_1, c_2 > 0, \exists n_0, \forall n \ge n_0, c_1 n^{\log_b a} \le f(n) \le c_2 n^{\log_b a}$ (branching and extra work are balanced), then $T(n)$ is sandwiched, in the identical sense, between constant multiples of $n^{\log_b a} \log n$.
3. If $\exists \varepsilon>0, \exists c>0, \exists n_0, \forall n \ge n_0, f(n) \ge c\,n^{\log_b a + \varepsilon}$ (the extra work dominates), and additionally $\exists c' < 1, \exists n_1, \forall n \ge n_1, a\,f(n/b) \le c' f(n)$ (a regularity condition, ruling out $f$ oscillating too wildly), then $T(n)$ is sandwiched between constant multiples of $f(n)$ itself.

Applied to section 6's $T(n) = 2\,T(n/2) + n$: $a=2$, $b=2$, so $n^{\log_b a} = n^{\log_2 2} = n^1 = n$. $f(n) = n$ matches $n^{\log_b a}$ up to constants directly (take $c_1=c_2=1$) — case 2 — so $T(n)$ is sandwiched between constant multiples of $n \log n$, matching the exact closed form $n(\log_2 n + 1)$ derived by induction: dividing through by $n \log_2 n$, the ratio $\frac{n(\log_2 n + 1)}{n \log_2 n} = 1 + \frac{1}{\log_2 n}$ stays between $1$ and $2$ for every $n \ge 2$, confirming the sandwich directly.

Applied to $T(n) = T(n/2) + 1$: $a=1$, $b=2$, $n^{\log_b a} = n^{\log_2 1} = n^0 = 1$. $f(n) = 1$ matches $n^{\log_b a}=1$ up to constants directly — case 2 again — so $T(n)$ is sandwiched between constant multiples of $\log n$.

Applied to $T(n) = 2\,T(n/2) + n^2$: $a=2$, $b=2$, $n^{\log_b a} = n$. $f(n) = n^2 \ge n^{1+1}$ for every $n \ge 0$, satisfying case 3's growth condition with $\varepsilon=1, c=1$. Checking the regularity condition: $a\,f(n/b) = 2\left(\frac{n}{2}\right)^2 = \frac{n^2}{2} = 0.5\, f(n)$, satisfied with $c' = 0.5 < 1$ — case 3 applies, so $T(n)$ is sandwiched between constant multiples of $n^2$ itself: the extra work at the root alone already outweighs everything the recursion contributes beneath it.

### Wrong model: The master theorem applies to every recurrence of the form $T(n) = a\,T(n/b) + f(n)$

**What is actually true:** Section 7 states the master theorem's three cases, and every case has a condition attached — an explicit $\exists\varepsilon,\exists c,\forall n \ge n_0$ relationship between $f(n)$ and $n^{\log_b a}$. A recurrence whose $f(n)$ satisfies none of the three — for instance, oscillating between growing faster and slower than $n^{\log_b a}$ at different $n$, or landing in the gap between case 1 and case 2 without satisfying either's precise bound — is simply not resolved by the theorem at all, and needs section 3's guess-and-verify method, or section 6's direct recursion-tree analysis, applied by hand instead.

## Exercises

1. Unroll $T(n) = T(n-1) + 2n$, $T(0) = 0$, down to $T(0)$, and reduce the resulting sum to closed form using `Summations and closed forms`.

2. Prove your closed form from exercise 1 correct by induction, following section 3's two-part structure exactly.

3. Draw the recursion tree, in section 4's style, for $T(n) = T(n-1) + 1$, $T(0) = 0$, and use it to find $T(n)$'s closed form.

4. For $T(n) = 4\,T(n/2) + n$, compute $n^{\log_b a}$, classify $f(n) = n$ against it, and state which master theorem case applies and the resulting sandwich bound on $T(n)$.

5. For $T(n) = T(n/2) + n$, compute $n^{\log_b a}$, classify $f(n)=n$, and state the resulting sandwich bound on $T(n)$. (This is case 3 — check the regularity condition explicitly: is $1 \cdot f(n/2) \le c\,f(n)$ for some $c<1$?)

6. Using section 6's recursion tree for $T(n) = 2T(n/2)+n$, explain in one sentence why the total number of levels is $\log_2 n + 1$ rather than $n$.

7. A recurrence has $f(n) = n^{\log_b a} / \log n$ — strictly less than $n^{\log_b a}$, but not by a full polynomial factor $n^{\varepsilon}$ for any fixed $\varepsilon > 0$. Using the wrong-model box, explain why the master theorem's three cases, as stated in section 7, do not resolve this recurrence.

## Answers

1. $T(n) = T(n-1) + 2n = T(n-2) + 2(n-1) + 2n = \cdots = T(0) + 2(1 + 2 + \cdots + n) = 2 \cdot \frac{n(n+1)}{2} = n(n+1)$.

2. Base case ($n=0$): the recurrence gives $T(0)=0$; the formula gives $0(0+1)=0$. Equal. Inductive step: assume $T(k) = k(k+1)$ for arbitrary $k \ge 0$. Then $T(k+1) = T(k) + 2(k+1) = k(k+1) + 2(k+1) = (k+1)(k+2)$, exactly the formula at $n=k+1$. Base case and inductive step together prove $T(n) = n(n+1)$ for every $n \ge 0$.

3. A single chain, root to leaf: $T(n)$ contributes $1$, $T(n-1)$ contributes $1$, ..., down to $T(0)$ contributing $0$ (the base case, no extra work). Summing $n$ contributions of $1$ each (from $T(n)$ down through $T(1)$) plus the base case's $0$ gives $T(n) = n$.

4. $n^{\log_b a} = n^{\log_2 4} = n^2$. $f(n) = n \le n^{2 - 1}$ for every $n \ge 1$, satisfying case 1's condition with $\varepsilon=1, c=1, n_0=1$ — case 1 applies, so $T(n)$ is sandwiched between constant multiples of $n^2$.

5. $n^{\log_b a} = n^{\log_2 1} = n^0 = 1$. $f(n) = n \ge n^{0+1}$ for every $n \ge 0$, satisfying case 3's growth condition with $\varepsilon=1, c=1$. Regularity: $a\,f(n/b) = 1 \cdot (n/2) = n/2 = 0.5\,f(n)$, satisfied with $c'=0.5<1$. Case 3 applies: $T(n)$ is sandwiched between constant multiples of $f(n) = n$ itself — the single extra-work term at the root already dominates every level beneath it, since there is only one child per call and its share of the work shrinks geometrically.

6. Each level halves the problem size (from $n$ down toward $1$), so the number of levels is the number of times $n$ can be halved before reaching $1$ — exactly $\log_2 n$ halvings, plus the starting level $0$ itself, giving $\log_2 n + 1$ levels total, not a number that grows in direct proportion to $n$.

7. Case 1 requires some fixed $\varepsilon > 0$ with $f(n) \le c\,n^{\log_b a - \varepsilon}$ eventually — a genuine polynomial gap below $n^{\log_b a}$, which $n^{\log_b a}/\log n$ does not have, since dividing by $\log n$ shrinks slower than dividing by any $n^{\varepsilon}$. Case 2 requires $f(n)$ sandwiched between constant multiples of $n^{\log_b a}$ exactly, which this $f(n)$ also fails, since it is strictly smaller by a factor of $\log n$, not just by a constant. Case 3 requires some fixed $\varepsilon>0$ with $f(n) \ge c\,n^{\log_b a + \varepsilon}$ eventually, a polynomial factor *above* $n^{\log_b a}$, which this $f(n)$ fails even more clearly, being below rather than above. None of the three conditions holds, so the master theorem, as stated, gives no answer for this recurrence at all.
