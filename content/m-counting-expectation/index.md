---
id: m-counting-expectation
title: "Counting and expected value"
track: math
---

# Counting and expected value

`Sets and functions` gave you sets, cardinality, and functions with a fixed domain and codomain. This article uses all three for a narrower purpose than a full treatment of probability would: enough counting to say precisely how many ways something can happen, and enough of **expectation** to give "average case" — a phrase used loosely everywhere from a coin flip to an algorithm's running time — an actual, checkable definition.

## 1. The sum rule and the product rule

The **product rule**: if a first choice can be made in $m$ ways, and, independently of which was made, a second choice can be made in $n$ ways, the two choices together can be made in $m \times n$ ways. Choosing a shirt from $3$ options and trousers from $4$ options gives $3 \times 4 = 12$ complete outfits — every shirt paired with every trousers, each pairing distinct.

The **sum rule**: if a choice falls into one of two *mutually exclusive* categories, the first offering $m$ options and the second $n$, the total number of options is $m + n$. Choosing one piece of fruit from a bowl holding $3$ apples or $2$ oranges (not both) gives $3 + 2 = 5$ possible choices.

### Wrong model: The sum rule and the product rule are interchangeable

**What is actually true:** They answer different questions. The product rule counts a *sequence* of independent choices made together — an outfit needs a shirt *and* trousers, both selected, so the counts multiply. The sum rule counts a *single* choice between mutually exclusive alternatives — one piece of fruit, an apple *or* an orange, not a combination of the two, so the counts add. Using the product rule on the fruit example would claim $3 \times 2 = 6$ possible choices, which is wrong: no option "apple-and-orange" exists in a one-piece choice, so there are only $3 + 2 = 5$ genuinely distinct outcomes.

## 2. Permutations

A **permutation** of $k$ items chosen from $n$ distinct items is an ordered arrangement — order matters, and no item repeats. Counting them is a direct application of the product rule: the first position can be filled $n$ ways; once filled, the second position has only $n-1$ remaining items to choose from; the third, $n-2$; continuing until $k$ positions are filled:

$$P(n,k) = n \times (n-1) \times (n-2) \times \cdots \times (n-k+1) = \frac{n!}{(n-k)!}$$

where $n! = n \times (n-1) \times \cdots \times 1$, and $0! = 1$ by convention, matching an empty product — choosing zero items has exactly one way to do it: do nothing. Arranging $3$ books, chosen from a shelf of $5$, in a specific left-to-right order: $P(5,3) = 5 \times 4 \times 3 = 60$.

## 3. Combinations

A **combination** of $k$ items chosen from $n$ is a *selection* — which $k$ items, with no order attached. Every combination of $k$ items corresponds to exactly $k!$ different permutations of those same $k$ items — one for each way of ordering the identical selection — so the number of combinations is the number of permutations divided by $k!$:

$$C(n,k) = \frac{P(n,k)}{k!} = \frac{n!}{k!\,(n-k)!}$$

Choosing $3$ books, from the same shelf of $5$, to take on a trip, with no regard for which one goes in the bag first: $C(5,3) = \frac{5!}{3!\,2!} = \frac{120}{6 \times 2} = 10$ — fewer than $P(5,3) = 60$, exactly because each of the $10$ selections was counted $3! = 6$ separate times among the $60$ orderings, and dividing removes that overcounting.

## 4. Uniform probability on a finite sample space

A **sample space** $\Omega$ is the set of every possible outcome of some experiment — `Sets and functions`'s own notion of a set, applied to outcomes. An **event** is a subset of $\Omega$: some outcomes count as the event happening, the rest do not. Under **uniform probability**, every individual outcome in $\Omega$ is equally likely, and the probability of an event $E \subseteq \Omega$ is the fraction of the sample space it occupies:

$$\Pr(E) = \frac{|E|}{|\Omega|}$$

directly `Sets and functions`'s cardinality notation, $|S|$, applied twice. Rolling one fair six-sided die: $\Omega = \{1,2,3,4,5,6\}$, $|\Omega| = 6$. The event "the roll is even," $E = \{2,4,6\}$, has $|E| = 3$, so $\Pr(E) = 3/6 = 1/2$.

## 5. Expected value

A **random variable** $X$ is a function $X : \Omega \to \mathbb{R}$ — `Sets and functions`'s own function definition, domain $\Omega$, codomain $\mathbb{R}$, assigning a real number to every possible outcome. Its **expected value**, $E[X]$, is the probability-weighted average of that number across the whole sample space:

$$E[X] = \sum_{s \in \Omega} X(s) \cdot \Pr(s)$$

Under uniform probability specifically, $\Pr(s) = 1/|\Omega|$ for every outcome, so this simplifies to a plain average: $E[X] = \frac{1}{|\Omega|}\sum_{s \in \Omega} X(s)$. For one fair die roll, taking $X$ to be the value shown: $E[X] = \frac{1+2+3+4+5+6}{6} = \frac{21}{6} = 3.5$ — a value the die can never actually show on any single roll, which is expected of an *average*, not a prediction of any one outcome.

## 6. Linearity of expectation

$$E[X + Y] = E[X] + E[Y]$$

for any two random variables $X, Y$ on the same sample space, with no requirement that they be independent. The proof follows directly from section 5's definition, by nothing more than distributing a sum:

$$E[X+Y] = \sum_{s \in \Omega} \big(X(s)+Y(s)\big)\Pr(s) = \sum_{s \in \Omega} X(s)\Pr(s) + \sum_{s \in \Omega} Y(s)\Pr(s) = E[X] + E[Y]$$

Both sums on the right are exactly section 5's definitions of $E[X]$ and $E[Y]$ individually — nothing about splitting $(X(s)+Y(s))\Pr(s)$ into two separate terms ever used, or needed, any fact about how $X$ and $Y$ relate to each other.

Two fair dice, $X$ the first, $Y$ the second, independent of one another: $E[X] = E[Y] = 3.5$ by section 5, so $E[X+Y] = 7$ by linearity, with no need to examine the sum's own distribution across the $36$ equally likely pairs $(i,j)$ to find it. Checking directly confirms it: $\sum_{i=1}^{6}\sum_{j=1}^{6}(i+j) = 252$, and $252 / 36 = 7$, matching.

## 7. Linearity without independence

```
permutation   fixed points
   1 2 3            3
   1 3 2            1
   2 1 3            1
   2 3 1            0
   3 1 2            0
   3 2 1            1
                  -----
           total:   6
```

Take $\Omega$ to be all $3! = 6$ permutations of $\{1,2,3\}$ (section 2's own count, with $n=k=3$), each equally likely. A **fixed point** of a permutation is a position whose value equals its own position number — permutation $321$ has one, at position $2$ ($3,2,1$: the middle entry, $2$, sits in position $2$). Let $X_i$ be $1$ if position $i$ is a fixed point of the (random) permutation, and $0$ otherwise, for $i=1,2,3$; let $X = X_1+X_2+X_3$, the total number of fixed points.

$X_1, X_2, X_3$ are **not independent**: knowing position $1$ is fixed changes the probability that position $2$ is fixed, since one fewer value remains free to place there. Linearity applies anyway. By symmetry, each position is fixed in exactly $2$ of the $6$ permutations (fix one position, and the remaining two values permute $2! = 2$ ways around it), so $\Pr(X_i = 1) = 2/6 = 1/3$ and $E[X_i] = 1 \times \frac{1}{3} + 0 \times \frac{2}{3} = \frac{1}{3}$ for each $i$. By section 6, $E[X] = E[X_1]+E[X_2]+E[X_3] = 3 \times \frac{1}{3} = 1$.

Checking directly against the table above: the six permutations have $3, 1, 1, 0, 0, 1$ fixed points, totalling $6$; averaged over $6$ equally likely permutations, $6/6 = 1$ — matching the linearity computation exactly, obtained here by brute enumeration instead, confirming the shortcut rather than assuming it.

### Wrong model: Linearity of expectation requires the random variables to be independent

**What is actually true:** Section 6's proof never used independence — it only distributed a sum, a fact true of any two functions on the same sample space, related or not. Section 7's $X_1, X_2, X_3$ are explicitly dependent, and $E[X_1+X_2+X_3] = E[X_1]+E[X_2]+E[X_3]$ held anyway, confirmed by direct enumeration rather than taken on faith. Independence matters for other facts — $E[XY] = E[X]E[Y]$ genuinely does require it, and is not claimed here — but linearity of the *sum* holds unconditionally, which is exactly what makes it useful: it applies even when the dependence between variables would be difficult or impossible to untangle directly.

## 8. Why this article exists: making "average case" honest

`Counting operations: analysing iterative algorithms` used the phrase "average case" for an algorithm's cost, computed as a plain mean over some assumed distribution of inputs. That phrase is now precise, not informal: an algorithm's running time on a given input is a function of the input, and "average case" means exactly section 5's expected value of that function, over a sample space of inputs and a stated probability distribution on them — uniform, most commonly, over inputs of a given size, exactly section 4's construction. A claim of "average case $\Theta(n)$" with no distribution specified is exactly as incomplete as a claim of $\Pr(E)$ with no sample space specified; both are asking to be finished with "over what."

## Exercises

1. A café offers $4$ sandwiches and $3$ salads. Using section 1, compute how many ways there are to order one sandwich *and* one drink from $2$ drink options, and separately, how many ways to order one sandwich *or* one salad (not both).

2. Using section 2, compute $P(6,2)$ — the number of ways to award a gold and a silver medal to two different finishers among $6$ racers — and explain in one sentence why order matters here.

3. Using section 3, compute $C(6,2)$ — the number of ways to choose $2$ of the $6$ racers for a rematch, with no distinction of order — and verify $C(6,2) = P(6,2)/2!$ directly.

4. Two fair coins are flipped. Using section 4, list the sample space (assume the coins are distinguishable), and compute the probability of the event "at least one heads."

5. Using section 5, compute $E[X]$ for $X$ = the number of heads in exercise 4's two-coin experiment, listing $X(s)$ for every outcome $s$ in the sample space.

6. Using section 6's proof directly (not the dice example), explain in one sentence why $E[X+Y] = E[X]+E[Y]$ never actually needed to know whether $X$ and $Y$ were independent.

7. A different random variable is defined on section 7's same sample space of $6$ permutations: $Y_i = 1$ if position $i$ and position $i+1$ (for $i=1,2$) are *both* fixed points, $0$ otherwise. Is $E[Y_1] + E[Y_2]$ still a valid computation of $E[Y_1+Y_2]$ despite $Y_1$ and $Y_2$ being defined from overlapping positions? Justify using section 6.

## Answers

1. Sandwich and drink (product rule): $4 \times 2 = 8$ ways. Sandwich or salad (sum rule, mutually exclusive — one item, not both): $4 + 3 = 7$ ways.

2. $P(6,2) = 6 \times 5 = 30$. Order matters because gold and silver are different prizes — awarding gold to racer $A$ and silver to racer $B$ is a different outcome from gold to $B$ and silver to $A$.

3. $C(6,2) = \frac{6!}{2!\,4!} = \frac{720}{2 \times 24} = 15$. Directly: $P(6,2)/2! = 30/2 = 15$, matching.

4. $\Omega = \{HH, HT, TH, TT\}$, each equally likely, $|\Omega|=4$. "At least one heads" is $E = \{HH, HT, TH\}$, $|E|=3$, so $\Pr(E) = 3/4$.

5. $X(HH)=2$, $X(HT)=1$, $X(TH)=1$, $X(TT)=0$. $E[X] = \frac{2+1+1+0}{4} = \frac{4}{4} = 1$.

6. The proof only ever used $E[X+Y] = \sum_s (X(s)+Y(s))\Pr(s)$, then split $(X(s)+Y(s))\Pr(s)$ into $X(s)\Pr(s) + Y(s)\Pr(s)$ — ordinary distribution of multiplication over addition, a fact about arithmetic on real numbers that holds regardless of what $X$ and $Y$ represent or how they relate to one another; independence was never invoked at any step.

7. Yes. Section 6's proof holds for *any* two random variables defined on the same sample space, with no restriction on how they are constructed or whether they examine overlapping data — $Y_1$ and $Y_2$ are still both functions $\Omega \to \mathbb{R}$ on the identical six-permutation sample space, which is all linearity's proof requires; sharing position $2$ between their definitions makes them dependent (much like section 7's $X_i$ already were) but does not disqualify the identity.
