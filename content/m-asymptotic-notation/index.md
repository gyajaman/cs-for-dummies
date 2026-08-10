---
id: m-asymptotic-notation
title: "Asymptotic notation: O, Omega, Theta"
track: math
---

# Asymptotic notation: O, Omega, Theta

`Growth of functions: polynomial, exponential, logarithmic` compared functions informally — "$g$ eventually overtakes $f$ and stays ahead" — with crossover points found by inspection and tables. That is enough to build intuition, but it is not a definition: nothing in it says precisely what "eventually" or "stays ahead" commits you to. This article gives that comparison a formal definition, built entirely out of `Predicates and quantifiers`'s $\exists$ and $\forall$, so that "$f$ grows no faster than $g$" becomes a statement with a proof, not an impression from a table.

## 1. Big-O: an upper bound

$$f(n) = O(g(n)) \iff \exists c > 0, \exists n_0 \ge 0, \forall n \ge n_0, \; f(n) \le c \cdot g(n)$$

Read the quantifiers in order, exactly as `Predicates and quantifiers` reads any nested quantifier: there exists some positive constant $c$, and some threshold $n_0$, such that for every $n$ at or past that threshold, $f(n)$ is at most $c \cdot g(n)$. $c$ and $n_0$ are witnesses, in section 3 of `Predicates and quantifiers`'s sense — exhibiting one valid pair proves the statement; no amount of failed pairs disproves it, since only one is needed. The inner $\forall n \ge n_0$ is what makes this a statement about *eventual*, unbounded behaviour rather than a comparison at one point: it does not matter whether $f(n) > c \cdot g(n)$ for finitely many small $n$ below $n_0$, only that the inequality holds forever from $n_0$ onward.

$f(n) = O(g(n))$ is read "$f$ is big-O of $g$," and means: $g$, scaled by some constant, is an **upper bound** on $f$'s growth from some point on.

## 2. Proving membership from the definition

Claim: $5n + 3 = O(n)$.

To prove this, exhibit a $c$ and an $n_0$ satisfying the definition. Try $c = 6$: is $5n + 3 \le 6n$ eventually true? Rearranging, $5n + 3 \le 6n \iff 3 \le n$. So $n_0 = 3$ works: for every $n \ge 3$, $5n + 3 \le 6n$. Check the boundary directly — at $n=3$: $5(3)+3 = 18$, and $6(3) = 18$; equal, so the inequality holds ($\le$, not strict). At $n = 4$: $23 \le 24$. The witnesses $c = 6$, $n_0 = 3$ satisfy every clause of section 1's definition, which is the entire proof. $c$ and $n_0$ are not unique — $c = 8, n_0 = 1$ also works ($5n+3 \le 8n \iff 3 \le 3n \iff n \ge 1$) — a membership proof only has to produce one valid pair, not the best one.

Claim: $n^2 = O(n^3)$.

$n^2 \le c n^3$ rearranges (for $n > 0$) to $1 \le cn$, true for $c = 1$ whenever $n \ge 1$. Witnesses $c = 1$, $n_0 = 1$: for every $n \ge 1$, $n^2 \le 1 \cdot n^3$. Proved.

## 3. Big-Omega: a lower bound

$$f(n) = \Omega(g(n)) \iff \exists c > 0, \exists n_0 \ge 0, \forall n \ge n_0, \; f(n) \ge c \cdot g(n)$$

Identical in structure to section 1, with the single inequality reversed: $g$, scaled, is a **lower bound** on $f$'s growth from some point on. $f(n) = \Omega(g(n))$ says $f$ grows *at least* as fast as $g$, eventually and up to a constant factor — the mirror image of big-O, exactly as `Predicates and quantifiers` showed $\forall$ and $\exists$ trade proof burden for disproof burden in opposite directions, though here both $O$ and $\Omega$ share the same $\exists c, \exists n_0, \forall n \ge n_0$ shape; what differs is only the direction of the final inequality.

Claim: $n^2 = \Omega(n)$. $n^2 \ge cn$ rearranges (for $n > 0$) to $n \ge c$, true for $c = 1$ whenever $n \ge 1$. Witnesses $c=1, n_0=1$ prove it.

## 4. Big-Theta: a tight bound

$$f(n) = \Theta(g(n)) \iff f(n) = O(g(n)) \text{ and } f(n) = \Omega(g(n))$$

$f(n) = \Theta(g(n))$ holds exactly when $g$ is both an upper and a lower bound on $f$'s growth, up to constants — $f$ and $g$ grow at the *same rate*, in this precise sense, not merely that neither outpaces the other forever. Section 2 proved $5n + 3 = O(n)$; $5n + 3 = \Omega(n)$ is immediate too ($5n + 3 \ge n$ for every $n \ge 0$, taking $c=1, n_0=0$), so $5n + 3 = \Theta(n)$.

### Wrong model: $O$, $\Omega$, and $\Theta$ are three different ways of saying roughly the same thing

**What is actually true:** They make three distinct claims, and mixing them up changes what is actually being asserted. $f(n) = O(g(n))$ claims only an upper bound — $f$ grows no faster than $g$, but might grow much slower. $f(n) = \Omega(g(n))$ claims only a lower bound — $f$ grows no slower than $g$, but might grow much faster. $f(n) = \Theta(g(n))$ claims both simultaneously — $f$ and $g$ track each other, up to constants, with neither allowed to pull away. $n = O(n^2)$ is a true, useful statement; $n = \Theta(n^2)$ is false, since $n$ does not grow at the same rate as $n^2$ — section 5 makes precise why $O$ alone permits exactly this kind of looseness.

## 5. O as an upper bound, not a tight one

Claim: $n = O(n^2)$. $n \le c n^2$ rearranges (for $n > 0$) to $\frac{1}{c} \le n$, true for $c = 1$ whenever $n \ge 1$. Witnesses $c=1, n_0=1$ satisfy section 1's definition exactly — the claim is entirely correct.

Nothing in big-O's definition asks for $g$ to be the *smallest* function that bounds $f$ — only *some* upper bound, however loose. $n = O(n^2)$, $n = O(n^3)$, and $n = O(2^n)$ are all simultaneously true, by the identical reasoning: once one valid $(c, n_0)$ pair is found for a given $g$, a larger, faster-growing $g$ only makes the inequality easier to satisfy, not harder. $\Theta$, by contrast, does pin the growth rate down to one class, precisely because it demands a lower bound as well — this is the exact content of section 4's wrong-model box, now with the mechanism behind it: $O$'s one-sided inequality has nowhere near enough grip on $f$ to rule out a looser-than-necessary $g$.

## 6. Why constants and lower-order terms vanish

Claim: $3n^2 + 100n + 500 = O(n^2)$.

$3n^2 + 100n + 500 \le c n^2$. Bound each piece separately: for $n \ge 1$, $100n \le 100n^2$, and for $n \ge 1$, $500 \le 500 n^2$. So for $n \ge 1$,

$$3n^2 + 100n + 500 \le 3n^2 + 100n^2 + 500n^2 = 603 n^2.$$

Witnesses $c = 603$, $n_0 = 1$ prove the claim. Nothing about the specific numbers $3$, $100$, $500$ mattered to the *shape* of this argument — any fixed coefficients $a, b, c'$ in $an^2 + bn + c'$ can be absorbed the same way, into a single constant $c = a + |b| + |c'|$ (for $n \ge 1$), because a defined-notation big-O statement only has to produce *some* valid constant, and section 1's definition places no bound on how large $c$ is allowed to be. This is the formal version of `Growth of functions: polynomial, exponential, logarithmic`'s section on coefficients only shifting the crossover point, not changing which function eventually wins: big-O explicitly quantifies over $c$, so every constant multiple gets absorbed into the witness, and every lower-order term (here $100n + 500$, both dominated by $n^2$ for large enough $n$) gets absorbed the identical way.

### Wrong model: A coefficient of $1{,}000{,}000$ makes a function "worse" in big-O terms than one with coefficient $1$

**What is actually true:** $1{,}000{,}000 \, n = O(n)$ and $n = O(n)$ are both true, by the identical witness structure — take $c = 1{,}000{,}000$ for the first, $c=1$ for the second, and both hold for every $n \ge 0$. Big-O is a statement about which *family* of functions bounds the growth, not about the actual running time at any particular $n$; a real difference of a million-fold in practice is invisible to a notation whose defining $\exists c$ is permitted to be exactly that large. This is not a flaw to work around — it is what makes big-O useful for comparing algorithms' shape of growth independent of implementation-specific constants, at the cost of saying nothing at all about which of two $O(n)$ programs is actually faster.

## 7. The worst-case / best-case confusion

$O$, $\Omega$, and $\Theta$ bound a *function* — they say nothing, by themselves, about which function is under discussion. "This algorithm is $O(n^2)$" is not yet a complete claim until it is clear whether the function being bounded is the algorithm's running time on its worst input of size $n$, its running time on its best input of size $n$, or its running time on some particular input; conflating these is the single most common misuse of the notation.

An algorithm whose running time is $O(n)$ in the best case and $O(n^2)$ in the worst case is not contradicting itself — best-case running time and worst-case running time are two different functions of $n$, each independently subject to section 1's definition, and both statements can be simultaneously true. Saying only "the algorithm is $O(n^2)$," with no qualifier, is standardly read as a claim about the worst case, by convention rather than by anything in the notation itself — the notation bounds whatever function you hand it, and the burden is on the statement to say which function that is.

### Wrong model: An algorithm described as $O(n^2)$ always takes proportional to $n^2$ time on every input

**What is actually true:** $O(n^2)$, applied to an algorithm's running time, is almost always shorthand for "the *worst-case* running time, as a function of input size $n$, is $O(n^2)$" — a bound that specific inputs are free to run well under. An algorithm can be $O(n^2)$ in the worst case and $O(n)$, or even $O(1)$, on inputs that happen to be easy — both are legitimate, separate claims about two different functions of $n$, and neither one is violated by the other being true, exactly as section 7 describes for best case versus worst case generally.

## Exercises

1. Prove $7n + 2 = O(n)$ by exhibiting specific witnesses $c$ and $n_0$, showing the inequality holds at your chosen $n_0$ and at one value past it.

2. Prove $n^3 = \Omega(n^2)$ using section 3's definition.

3. Is $n^2 = O(n)$ true or false? Justify your answer by trying, and failing, to satisfy section 1's definition — specifically, explain why no constant $c$ can work no matter how large.

4. Using section 6's technique, prove $2n^2 + 5n + 1 = O(n^2)$, stating your witnesses explicitly.

5. Explain, using section 4 and section 5, why "$f(n) = O(g(n))$" alone is not enough to conclude $f$ and $g$ grow at the same rate, but "$f(n) = \Theta(g(n))$" is.

6. A claim reads "sorting this list is $O(n \log n)$." Using section 7, state precisely what function of $n$ this claim is actually bounding, under the standard convention, and explain why the claim does not rule out a particular list being sorted much faster.

7. A student writes "$100n = O(n)$ but $n = O(100n)$ is false, since $100n$ is bigger." Evaluate this claim using section 1's definition directly.

## Answers

1. Try $c = 8$: $7n + 2 \le 8n \iff 2 \le n$, so $n_0 = 2$. At $n=2$: $7(2)+2=16$, $8(2)=16$, equal, holds. At $n=3$: $23 \le 24$, holds. Witnesses $c=8, n_0=2$ satisfy the definition.

2. $n^3 \ge c n^2$ rearranges (for $n>0$) to $n \ge c$, true for $c=1$ whenever $n \ge 1$. Witnesses $c=1, n_0=1$: for every $n \ge 1$, $n^3 \ge n^2$.

3. False. $n^2 \le cn$ rearranges (for $n>0$) to $n \le c$ — this would require $n$ to stay below the fixed constant $c$ forever, but $n$ grows without bound past any fixed $c$, so the inequality fails for all $n > c$ regardless of which $c$ is chosen. No witness pair can satisfy $\forall n \ge n_0$ for any threshold, since $n$ eventually exceeds any fixed $c$.

4. $2n^2 + 5n + 1 \le 2n^2 + 5n^2 + n^2 = 8n^2$ for $n \ge 1$ (using $5n \le 5n^2$ and $1 \le n^2$, both true for $n \ge 1$). Witnesses $c = 8$, $n_0 = 1$.

5. $f(n) = O(g(n))$ alone only bounds $f$ from above — section 5 showed $n = O(n^2)$ is true even though $n$ grows strictly slower than $n^2$, so a true $O$ statement permits $f$ to grow much slower than $g$. $\Theta$ additionally requires $f(n) = \Omega(g(n))$, a lower bound in the same direction, so $f$ is pinned between two constant multiples of $g$ from both sides — neither allowed to pull away from the other — which is exactly what "growing at the same rate" means here.

6. It bounds the *worst-case* running time as a function of the list's length $n$, by the standard convention section 7 describes — not the running time on this specific list, and not the best case. The claim does not rule out this particular list being sorted in, say, $O(n)$ time if it happens to already be nearly sorted; a worst-case bound constrains the maximum over all inputs of size $n$, leaving individual inputs free to do much better.

7. The student's reasoning is wrong, though the first half is true. $100n = O(n)$: take $c=100, n_0=0$, and $100n \le 100n$ holds for every $n$. But $n = O(100n)$ is also true, not false: take $c = 1/100$, and $n \le \frac{1}{100}(100n) = n$ holds for every $n \ge 0$ — section 1's definition allows $c$ to be any positive constant, including one smaller than $1$, specifically to absorb exactly this kind of scaling. "Bigger" at any fixed $n$ is not what big-O measures; both statements being true simultaneously is consistent with section 6's point that constant factors are absorbed into the witness $c$.
