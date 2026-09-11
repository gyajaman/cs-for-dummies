---
id: m-sort-lower-bound
title: "The comparison-sort lower bound"
track: math
---

# The comparison-sort lower bound

Every sorting algorithm this website has built — selection, insertion, bubble, merge, quick — decides where each element belongs using nothing but pairwise comparisons: is `a[i]` less than `a[j]`. All of them, on $n$ elements, cost at least roughly $n \log n$ comparisons in the worst case, and none has ever done better. This article proves that is not a coincidence of which algorithms happen to have been invented — it is a hard floor, provable from `Graphs and trees as mathematical objects`'s own tree vocabulary, that no comparison-based sorting algorithm can ever cross.

## 1. Decision trees for comparison sorts

Any comparison-based sorting algorithm, run on an input of a fixed size $n$, can be drawn as a binary tree: each internal node is one comparison the algorithm makes, `a[i] < a[j]`, with the two outcomes — true, false — leading to its left and right children respectively. Following one specific input down from the root, taking whichever branch each of its actual comparison outcomes dictates, traces one root-to-leaf path; the **decision tree** for the algorithm at size $n$ is the tree containing every path every possible input of size $n$ could trace. A leaf represents the algorithm having gathered enough information to commit to one final, fully determined output ordering.

## 2. At least $n!$ leaves

For $n$ distinct elements, there are $n!$ possible orderings they could initially be in — `Counting and expected value`'s own permutation count, `Counting and expected value`'s section 2, with $k=n$. A correct sorting algorithm has to produce the correctly sorted output for every one of them.

Consider the map sending each of the $n!$ initial orderings to the leaf its own sequence of comparison outcomes reaches. This map has to be **injective**, `Sets and functions`'s own term: if two different initial orderings reached the *same* leaf, the algorithm would apply the identical fixed sequence of decisions to both — reaching a single, fixed output ordering — but two different initial orderings cannot both be correctly sorted by the identical rearrangement, since they need different corrections to reach the (different, order-dependent) sorted result each one actually requires. An injective function from an $n!$-element set into the leaf set means the leaf set has at least $n!$ elements — the decision tree needs at least $n!$ leaves, not merely "some."

## 3. Height at least $\log_2(n!)$

Claim: a binary tree of height $h$ has at most $2^h$ leaves.

A tree of height $0$ is a single node with no children — one leaf, matching $2^0 = 1$. Increasing the height by one means every current leaf either stays a leaf, contributing $1$ to the leaf count, or gains up to two children of its own, contributing at most $2$ in its place — so the maximum possible number of leaves can at most double for every unit increase in height. Starting from at most $1$ leaf at height $0$ and doubling at every subsequent increase — `Graphs and trees as mathematical objects`'s own per-level doubling argument, applied here to a tree's total leaf count as its height grows, rather than to how many nodes sit at one fixed level — gives at most $2^h$ leaves at height $h$.

Combined with section 2: a decision tree with at least $n!$ leaves and at most $2^h$ leaves, where $h$ is its height, forces

$$n! \le 2^h \implies h \ge \log_2(n!)$$

Every correct comparison-based sorting algorithm's decision tree, for input size $n$, has height at least $\log_2(n!)$.

## 4. The Stirling bound giving $\Omega(n \log n)$

The height of the decision tree is exactly the *worst-case* number of comparisons the algorithm makes: the height is the length of the longest root-to-leaf path, and the longest path is, by definition, the input that forces the most comparisons before the algorithm can commit to an answer. Section 3 already lower-bounds this height by $\log_2(n!)$; what remains is to see what order of growth $\log_2(n!)$ itself has.

**Stirling's approximation** states $n! \approx \sqrt{2\pi n}\,(n/e)^n$ for large $n$ — stated here, not derived, a fact from outside this website's own toolkit. The full approximation is not needed to establish the order of growth; a cruder, entirely elementary bound already suffices. $n!$ is the product of every integer from $1$ to $n$; restricting to just the top half of those factors, from $\lceil n/2 \rceil$ to $n$, every one of them is at least $n/2$, and there are at least $n/2$ of them:

$$n! \ge \left(\frac{n}{2}\right)^{n/2}$$

Taking $\log_2$ of both sides:

$$\log_2(n!) \ge \frac{n}{2}\log_2\left(\frac{n}{2}\right)$$

which is `Growth of functions: polynomial, exponential, logarithmic`'s own $n \log n$ shape, up to the constant factor $\frac{1}{2}$ and the shift from $n$ to $n/2$ inside the logarithm — neither changes the order of growth, exactly `Asymptotic notation: O, Omega, Theta`'s constant-absorption argument. $\log_2(n!)$ is $\Omega(n \log n)$, and by section 3, so is the decision tree's height, and so is the worst-case number of comparisons any correct comparison-based sort must make, on some input of every size $n$.

### Wrong model: A cleverer comparison-based algorithm could someday beat $n \log n$

**What is actually true:** Sections 1 through 4 proved a fact about *every* decision tree for *every* comparison-based algorithm, not about any specific algorithm's actual behaviour — the argument never inspected what any particular sort's comparisons look like, only that a correct one's decision tree needs at least $n!$ leaves, and that any binary tree with that many leaves needs height at least $\log_2(n!) = \Omega(n \log n)$. No comparison-based algorithm, however cleverly its comparisons are chosen, can produce a decision tree with fewer leaves than the number of distinct outputs it has to be able to produce, and no binary tree with that many leaves can be shorter than section 3's bound allows. $\Omega(n \log n)$ is not the best bound anyone has found yet; it is a limit built into what a comparison alone can distinguish, and no future algorithm restricted to pairwise comparisons can cross it, regardless of how it is designed.

### Wrong model: This bound applies to every sorting algorithm

**What is actually true:** The entire argument rests on section 1's decision-tree model, which only describes algorithms that sort using nothing but pairwise comparisons between elements. An algorithm that uses other information about its keys — that they are integers within a known, bounded range, say, and can be counted or bucketed by value directly rather than only compared — is not represented by a comparison decision tree at all, and section 2's injective-map argument, built entirely on counting comparison outcomes, says nothing about it. Such algorithms genuinely can, and do, sort faster than $\Omega(n \log n)$ in the cases their extra assumptions hold; the bound proved here is specifically a bound on comparisons, not on sorting itself.

## Exercises

1. Using section 1, explain what a *path* from the root to a specific leaf in a decision tree represents, in terms of an actual run of the algorithm.

2. Using section 2, explain in one sentence why the map from initial orderings to leaves has to be injective, referencing what would go wrong if it were not.

3. Compute $n!$ and $\log_2(n!)$ (to the nearest integer) for $n=4$, and verify directly that a binary tree with at least $24$ leaves needs height at least $5$ using section 3's $2^h$ bound.

4. Using section 3's doubling argument, explain why a binary tree of height $3$ cannot have more than $8$ leaves, tracing the doubling from height $0$ up to height $3$ explicitly.

5. Using section 4, explain why restricting the product $n!$ to only its top half of factors, each at least $n/2$, gives a valid *lower* bound on $n!$ rather than an exact value.

6. Using the first wrong-model box, explain why proving a lower bound for *every possible* decision tree is a fundamentally stronger claim than showing that a handful of known algorithms, such as mergesort, happen to need $\Omega(n \log n)$ comparisons.

7. Using the second wrong-model box, explain why counting sort (which sorts integers by tallying occurrences of each value directly, making no comparisons between elements at all) is not a counterexample to this article's bound.

## Answers

1. A root-to-leaf path represents one complete execution of the algorithm on some specific input: each internal node visited along the way is one comparison the algorithm actually performed on that input, and the branch taken at each one records that comparison's actual true-or-false outcome for that specific input, ending at the leaf representing the final output the algorithm committed to.

2. If two different initial orderings reached the same leaf, the algorithm would apply the identical fixed sequence of decisions — and therefore produce the identical output ordering — to both, but two different starting orderings generally require different corrections to reach their own correctly sorted results, so at least one of the two would be sorted incorrectly.

3. $4! = 24$. $\log_2(24) \approx 4.585$, rounding up to $5$. Checking section 3's bound directly: $2^4 = 16 < 24$, so height $4$ is not enough; $2^5 = 32 \ge 24$, so height $5$ suffices — confirming a tree with at least $24$ leaves needs height at least $5$, matching the rounded-up logarithm.

4. Height $0$: at most $1$ leaf. Height $1$: at most $2$ leaves (doubling once). Height $2$: at most $4$ leaves (doubling again). Height $3$: at most $8$ leaves (doubling a third time). Each step doubles the previous bound, starting from $1$ at height $0$, giving $2^3 = 8$ at height $3$.

5. The top half of the factors, each being at least $n/2$, understates every one of those individual factors (most are actually larger than $n/2$, since only the very smallest one in that half is close to $n/2$) and entirely ignores the bottom half of the factors, each at least $1$, contributing an additional multiplicative factor greater than $1$ to the true product. Both simplifications only ever *remove* value from the true product, never add to it, so the result is guaranteed to be a lower bound, not an exact value.

6. Showing a handful of specific algorithms need $\Omega(n \log n)$ comparisons only rules out those particular algorithms being faster — it leaves open the possibility that some entirely different, not-yet-invented comparison-based algorithm could do better. Sections 1 through 4 instead bound *every possible* decision tree any comparison-based algorithm could ever produce, ruling out the existence of a faster one at all, not merely failing to find one among the algorithms already known.

7. The second wrong-model box states the bound applies specifically to algorithms representable as a comparison decision tree — one where every decision branches on the outcome of comparing two elements. Counting sort makes no comparisons between elements at all; it uses the elements' actual integer values directly to tally and place them, information a pure comparison decision tree never has access to, so it is not describable by section 1's model in the first place, and the bound simply does not apply to it, exactly as the wrong-model box states.
