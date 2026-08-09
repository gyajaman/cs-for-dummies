---
id: m-induction
title: "Proof by induction"
track: math
---

# Proof by induction

`Predicates and quantifiers` noted that a universally quantified statement over an infinite set, such as $\forall n \in \mathbb{N}, P(n)$, cannot be established by checking every $n$ — there are infinitely many, and no amount of checking finishes the job. This article gives the one proof technique built specifically for that situation: a way to certify $P(n)$ for every natural number $n$ using a finite argument.

## 1. The idea: dominoes

Line up dominoes so that each one, if it falls, knocks over the next. Two facts together guarantee every domino falls: the first one falls, and each domino falling knocks over the next one. Neither fact alone is enough — knowing every domino would knock over the next says nothing if the first never falls, and knowing the first falls says nothing about the rest if the chain is broken somewhere. **Induction** is this argument made precise for a predicate $P(n)$ indexed by the natural numbers instead of a row of dominoes.

## 2. The structure: base case and inductive step

To prove $\forall n \in \mathbb{N}, P(n)$ (or, just as commonly, for all $n$ from some starting point $n_0$ onward) by **weak induction**, establish two things:

- **Base case:** $P(n_0)$ is true, directly — usually by a short computation.
- **Inductive step:** for an arbitrary $k \ge n_0$, assuming $P(k)$ is true, prove that $P(k+1)$ is true. The assumption "$P(k)$ is true" used inside this step is called the **inductive hypothesis**.

Together, these two facts prove $P(n)$ for every $n \ge n_0$: the base case gives $P(n_0)$; the inductive step, applied with $k = n_0$, turns that into $P(n_0 + 1)$; applied again with $k = n_0 + 1$, turns that into $P(n_0 + 2)$; and so on, reaching any particular $n$ after finitely many applications. The inductive step is proved once, for a general $k$ — it is not repeated by hand for each value of $n$, which is exactly what makes the argument finite despite covering infinitely many cases.

### Wrong model: The inductive step assumes what it is trying to prove

A common objection: "the inductive step assumes $P(k)$ to prove $P(k+1)$ — isn't that circular, assuming the very thing you're trying to show?"

**What is actually true:** The statement being proved is $\forall n, P(n)$, a single proposition about every $n$ at once. The inductive step does not assume this statement; it assumes $P(k)$ for one arbitrary, fixed $k$, and proves $P(k+1)$ from it — a conditional claim, "if $P(k)$ then $P(k+1)$," which is proved outright, with no circularity, since $P(k)$ and $P(k+1)$ are different propositions about different numbers. It is the base case together with a chain of these conditional claims, not any single one of them alone, that proves $\forall n, P(n)$. Assuming $P(k)$ to prove $P(k+1)$ is no more circular than assuming "it rained" to prove "the ground got wet" — a conditional claim about two different facts, not a claim proving itself.

## 3. Worked proof: a summation identity

Claim: for every $n \in \mathbb{N}$ with $n \ge 1$,

$$1 + 2 + \cdots + n = \frac{n(n+1)}{2}.$$

**Base case** ($n = 1$): the left side is $1$; the right side is $\frac{1 \times 2}{2} = 1$. Equal.

**Inductive step:** assume, for some arbitrary $k \ge 1$, that $1 + 2 + \cdots + k = \frac{k(k+1)}{2}$ (the inductive hypothesis). Show the identity holds for $k+1$:

$$1 + 2 + \cdots + k + (k+1) = \frac{k(k+1)}{2} + (k+1)$$

using the inductive hypothesis to replace $1 + \cdots + k$ by its assumed closed form. Factor the right side:

$$\frac{k(k+1)}{2} + (k+1) = \frac{k(k+1) + 2(k+1)}{2} = \frac{(k+1)(k+2)}{2} = \frac{(k+1)((k+1)+1)}{2}.$$

This is exactly the claimed formula with $n = k+1$. Since the base case holds and the inductive step carries $P(k)$ to $P(k+1)$ for arbitrary $k \ge 1$, the identity holds for every $n \ge 1$.

The inductive hypothesis is used exactly once, in the second line, to replace the sum $1 + \cdots + k$ with $\frac{k(k+1)}{2}$. Everything after that is ordinary algebra.

## 4. Worked proof: a divisibility claim

Claim: for every $n \in \mathbb{N}$, $3$ divides $n^3 - n$.

**Base case** ($n = 0$): $0^3 - 0 = 0$, and $3$ divides $0$ ($0 = 3 \times 0$).

**Inductive step:** assume $3$ divides $k^3 - k$ for some arbitrary $k \ge 0$, meaning $k^3 - k = 3m$ for some integer $m$. Show $3$ divides $(k+1)^3 - (k+1)$:

$$(k+1)^3 - (k+1) = k^3 + 3k^2 + 3k + 1 - k - 1 = (k^3 - k) + 3k^2 + 3k = 3m + 3k^2 + 3k = 3(m + k^2 + k).$$

$m + k^2 + k$ is an integer, so $(k+1)^3 - (k+1)$ is $3$ times an integer — divisible by $3$. The base case and inductive step together establish the claim for every $n \in \mathbb{N}$.

## 5. Worked proof: an inequality

Claim: for every $n \in \mathbb{N}$ with $n \ge 4$, $2^n > n^2$.

**Base case** ($n = 4$): $2^4 = 16$, $4^2 = 16$. These are equal, not strictly greater — the claim as stated is false at $n = 4$. Checking the base case caught this before any inductive step was attempted; the correct claim starts at $n = 5$: $2^5 = 32 > 25 = 5^2$. Take $n = 5$ as the base case instead.

**Inductive step:** assume $2^k > k^2$ for some arbitrary $k \ge 5$. Show $2^{k+1} > (k+1)^2$:

$$2^{k+1} = 2 \times 2^k > 2k^2$$

using the inductive hypothesis to bound $2^k$. It remains to show $2k^2 \ge (k+1)^2$ for $k \ge 5$, which finishes the chain. Expanding, $(k+1)^2 = k^2 + 2k + 1$, so $2k^2 \ge k^2 + 2k + 1$ rearranges to $k^2 - 2k - 1 \ge 0$, true for $k \ge 3$ (check: at $k=3$, $9 - 6 - 1 = 2 \ge 0$), and in particular for every $k \ge 5$. Chaining the two inequalities, $2^{k+1} > 2k^2 \ge (k+1)^2$, so $2^{k+1} > (k+1)^2$. The base case and inductive step together establish $2^n > n^2$ for every $n \ge 5$.

## 6. Failure mode: no base case

Consider the claim "every natural number equals the next one," with a proposed inductive step: "assume $k = k+1$ for some $k$; then adding $1$ to both sides gives $k + 1 = k + 2$, which is the claim for $k+1$." The inductive step is valid — it genuinely shows $P(k) \implies P(k+1)$ — but there is no base case, because $P(0)$, "$0 = 1$," is false and unprovable. Without a true starting point, the chain of implications has nothing to start from: $P(k) \implies P(k+1)$ for every $k$ says nothing at all about whether any particular $P(n)$ is true, exactly as knowing every domino would topple the next says nothing if the first domino never falls.

### Wrong model: A valid inductive step alone proves the claim

**What is actually true:** Section 6's example has a completely valid inductive step and proves a false statement, because the base case was never checked and does not hold. The inductive step only establishes a conditional: $P(k)$ true implies $P(k+1)$ true. If $P(k)$ is never true to begin with — as with $P(0)$ above — the conditional is vacuous for every value that matters, and no $P(n)$ is ever actually reached. The base case is not a formality to satisfy before the "real" argument; it is where the chain of implications gets its first true link.

## 7. Failure mode: hypothesis applied at the wrong index

A student proves $\forall n \ge 1, P(n)$ with base case $P(1)$, then writes the inductive step as: "assume $P(k)$ for $k \ge 2$; show $P(k+1)$." This gap — the inductive step covers $k \ge 2$, but the base case only established $P(1)$ — means the chain never actually starts: $P(1) \implies P(2)$ is never proved, since the inductive step as written only begins applying at $k = 2$, assuming $P(2)$ rather than deriving it. The correct inductive step must assume $P(k)$ for the same range the base case sits just below — here, arbitrary $k \ge 1$ — so that the first application, $k = 1$, is the one that actually uses the base case's conclusion.

A related version of the same error: using $P(k)$ to prove $P(k+2)$ instead of $P(k+1)$, while only checking a single base case. This skips every other value of $n$ unless a second base case (covering the other parity) and a matching inductive step are both supplied — one base case and a step of size $2$ only reaches $n_0, n_0+2, n_0+4, \ldots$, never the odd-offset values in between.

## 8. Strong induction

**Strong induction** proves $\forall n \ge n_0, P(n)$ with the same base case requirement, but a stronger inductive hypothesis: assume $P(n_0), P(n_0 + 1), \ldots, P(k)$ — every earlier case, not just $P(k)$ alone — and prove $P(k+1)$ from that whole set. This is useful exactly when $P(k+1)$'s proof naturally needs some earlier case other than the immediately preceding one.

Claim: every integer $n \ge 2$ can be written as a product of primes (allowing a "product" of one prime, for $n$ itself prime).

**Base case** ($n = 2$): $2$ is prime, hence trivially a product of one prime.

**Inductive step (strong form):** assume every integer from $2$ to $k$ can be written as a product of primes, for some arbitrary $k \ge 2$. Consider $k + 1$. Either $k+1$ is prime, in which case it is a product of one prime and the claim holds directly, or $k+1$ is composite, meaning $k + 1 = a \times b$ for some integers $2 \le a, b \le k$. Both $a$ and $b$ are within the range covered by the hypothesis — this is exactly why the ordinary, single-preceding-case hypothesis would not suffice, since $a$ and $b$ are not generally $k$ itself — so by the inductive hypothesis, each of $a$ and $b$ is a product of primes. Concatenating those two products gives a product of primes equal to $k+1$. Either way, $k+1$ is a product of primes, completing the step.

Strong induction is not a different, more powerful axiom than weak induction — every strong-induction proof can be rewritten as a weak-induction proof of the compound predicate $Q(n) : \text{"}P(n_0) \land P(n_0+1) \land \cdots \land P(n)\text{"}$ — but writing the proof directly in the strong form is usually far more natural when the step genuinely needs an arbitrary earlier case rather than just the immediately preceding one.

## Exercises

1. Prove by induction that $1 + 3 + 5 + \cdots + (2n - 1) = n^2$ for every $n \ge 1$.

2. Prove by induction that $6$ divides $n^3 - n$ for every $n \in \mathbb{N}$. (You may reuse the algebraic expansion technique from section 4.)

3. Find the smallest $n_0$ for which $2^n \ge n^3$ holds for all $n \ge n_0$, verify it numerically, then write the base case and inductive step.

4. A proof claims to establish $\forall n \ge 1, P(n)$ using base case $P(1)$ and inductive step "assume $P(k)$ for $k \ge 5$, prove $P(k+1)$." Explain, using section 7, exactly which values of $n$ this proof fails to establish.

5. Explain why the inductive step in section 6 ("assume $k = k+1$; add $1$ to both sides") is logically valid as a conditional statement, despite proving something false overall.

6. Use strong induction to prove that every integer $n \ge 1$ can be written as $n = 2^a \times b$ where $a \ge 0$ and $b$ is odd. (Base case $n = 1$: $a = 0$, $b = 1$.)

7. A student proves $P(n)$ for all even $n \ge 2$ using base case $P(2)$ and inductive step "assume $P(k)$, prove $P(k+2)$," for arbitrary even $k \ge 2$. Is this a valid proof that $P(n)$ holds for every $n \ge 2$, including odd $n$? Explain.

## Answers

1. Base case ($n=1$): left side is $1$, right side is $1^2 = 1$. Equal. Inductive step: assume $1 + 3 + \cdots + (2k-1) = k^2$ for arbitrary $k \ge 1$. Then $1 + 3 + \cdots + (2k-1) + (2(k+1)-1) = k^2 + (2k+1) = (k+1)^2$, which is the claim at $n = k+1$. Base case and step together give the identity for every $n \ge 1$.

2. Base case ($n=0$): $0^3 - 0 = 0 = 6 \times 0$. Inductive step: assume $k^3 - k = 6m$ for arbitrary $k \ge 0$. Then $(k+1)^3 - (k+1) = (k^3 - k) + 3k^2 + 3k = 6m + 3k(k+1)$. Since $k(k+1)$ is a product of two consecutive integers, one of them is even, so $3k(k+1)$ is divisible by $6$; adding it to $6m$ (also divisible by $6$) gives a multiple of $6$. So $(k+1)^3 - (k+1)$ is divisible by $6$.

3. $n_0 = 10$: at $n=9$, $2^9 = 512 < 729 = 9^3$; at $n=10$, $2^{10} = 1024 > 1000 = 10^3$. Base case ($n=10$): $1024 \ge 1000$, true. Inductive step: assume $2^k \ge k^3$ for arbitrary $k \ge 10$; show $2^{k+1} \ge (k+1)^3$. $2^{k+1} = 2 \times 2^k \ge 2k^3$, and for $k \ge 10$, $2k^3 \ge (k+1)^3$ can be checked to hold (the ratio $(k+1)^3/k^3$ shrinks toward $1$ as $k$ grows, and is already under $2$ by $k=10$), completing the chain.

4. The proof establishes $P(1)$ (base case) and, separately, $P(k+1)$ for every $k \ge 5$, i.e. $P(6), P(7), P(8), \ldots$. It never proves $P(2)$, $P(3)$, $P(4)$, or $P(5)$: the chain from $P(1)$ can only advance using the inductive step, which requires $k \ge 5$, so there is no way to reach $P(2)$ through $P(5)$ from $P(1)$ using the step as given.

5. As a conditional, "if $k = k+1$ then $k+1 = k+2$" is true for every $k$ — it is just "add $1$ to both sides of an equation," which preserves any equation's truth value, true or false alike. The step never claims $k = k+1$ is actually true; it only claims that *if* it were true, the next case would follow. Since the antecedent ($P(0)$, the base case) is false and never established, the valid conditional never gets to fire, and no actual $P(n)$ is proved.

6. Base case ($n=1$): $1 = 2^0 \times 1$, with $a=0$, $b=1$ odd. Inductive step (strong form): assume every integer from $1$ to $k$ can be written as $2^a \times b$ with $b$ odd, for arbitrary $k \ge 1$; show it for $k+1$. If $k+1$ is odd, take $a=0$, $b=k+1$. If $k+1$ is even, then $k+1 = 2m$ for some integer $1 \le m \le k$, which is within the hypothesis's range, so by the inductive hypothesis $m = 2^{a'} \times b$ for some $a' \ge 0$ and odd $b$; then $k+1 = 2^{a'+1} \times b$, of the required form. Either way, $k+1$ has the required form.

7. No. The step only ever reaches $2, 4, 6, 8, \ldots$ — even numbers — since it starts at the even base case $2$ and always advances by $2$. It says nothing about odd $n$, such as $3$ or $5$, which are never touched by either the base case or any application of the step. This is exactly section 7's step-of-size-$2$ failure mode: a second base case and step covering the odd values would be needed to also cover odd $n$.
