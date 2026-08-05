---
id: m-sets-functions
title: "Sets and functions"
track: math
---

# Sets and functions

Sets are the vocabulary the rest of this book uses to talk about collections of things precisely, and functions are the vocabulary for talking about correspondences between them precisely. Both are used constantly from here on, usually without comment, on the assumption that the words mean exactly what this article says and nothing looser.

## 1. Set notation and membership

A **set** is an unordered collection of distinct elements — nothing in a set is repeated, and no order is implied by how it is written. $S = \{1, 2, 3\}$ is a set with three elements. $x \in S$ means $x$ is an element of $S$; $x \notin S$ means it is not. $2 \in \{1, 2, 3\}$ is true; $5 \in \{1, 2, 3\}$ is false. The **empty set**, $\emptyset$, is the set with no elements at all — still a perfectly ordinary set, just one with nothing in it.

## 2. Subset

$A \subseteq B$ means every element of $A$ is also an element of $B$ — $A$ is a **subset** of $B$. $\{1, 2\} \subseteq \{1, 2, 3\}$: both $1$ and $2$ are in $\{1, 2, 3\}$. Every set is a subset of itself; $\emptyset$ is a subset of every set, vacuously, since it has no elements that could fail to be in the other set. $A \subset B$, with no bar under the symbol, tightens this to a **proper subset**: $A \subseteq B$ and $A \ne B$.

### Wrong model: $\in$ and $\subseteq$ mean the same thing

**What is actually true:** They relate different kinds of things. $\in$ relates an *element* to a set: is this single thing a member? $\subseteq$ relates two *sets*: is every member of one also a member of the other? $1 \in \{1, 2, 3\}$ is a true statement about a number and a set. $\{1\} \subseteq \{1, 2, 3\}$ is a true statement about two sets. $\{1\} \in \{1, 2, 3\}$ is false — the elements of $\{1, 2, 3\}$ are the numbers $1$, $2$, and $3$, not the set $\{1\}$ — and $1 \subseteq \{1, 2, 3\}$ does not even type-check, since $1$ is not a set at all. Keeping straight which symbol you mean is not a stylistic preference.

## 3. Union, intersection, difference

Given $A = \{1, 2, 3\}$ and $B = \{3, 4, 5\}$:

**Union**, $A \cup B$: every element in $A$, $B$, or both. $A \cup B = \{1, 2, 3, 4, 5\}$.

**Intersection**, $A \cap B$: every element in both $A$ and $B$. $A \cap B = \{3\}$.

**Difference**, $A \setminus B$: every element in $A$ but not in $B$. $A \setminus B = \{1, 2\}$. Difference is not symmetric: $B \setminus A = \{4, 5\}$, a different set entirely.

## 4. Cartesian product

$A \times B$, the **Cartesian product**, is the set of every ordered pair with a first element from $A$ and a second from $B$:

$$\{a, b\} \times \{1, 2, 3\} = \{(a, 1), (a, 2), (a, 3), (b, 1), (b, 2), (b, 3)\}$$

Order matters inside each pair — $(a, 1)$ and $(1, a)$ are different pairs, from different products — which is why this is a set of *pairs*, not a second application of union.

## 5. $\mathbb{N}$, $\mathbb{Z}$, $\mathbb{R}$

Three sets of numbers, nested inside one another, come up constantly enough to earn fixed symbols. $\mathbb{N}$, the **natural numbers**, are the non-negative whole numbers: $0, 1, 2, 3, \ldots$ — this book includes $0$, matching the convention `Arrays and contiguous memory` already relied on when the first valid index was $0$, not $1$. $\mathbb{Z}$, the **integers**, extend $\mathbb{N}$ with the negative whole numbers: $\ldots, -2, -1, 0, 1, 2, \ldots$. $\mathbb{R}$, the **real numbers**, extend $\mathbb{Z}$ further, filling in every value between the integers, not just fractions but every point on the number line. Each is a proper subset of the next: $\mathbb{N} \subset \mathbb{Z} \subset \mathbb{R}$.

## 6. Finite cardinality

$|S|$, the **cardinality** of $S$, is the number of elements it has, when that number is finite. $|\{1, 2, 3\}| = 3$. $|\emptyset| = 0$. Cardinality interacts predictably with the operations already introduced: $|A \times B| = |A| \times |B|$ — section 4's example had $|\{a, b\}| = 2$ and $|\{1, 2, 3\}| = 3$, producing a product of $2 \times 3 = 6$ pairs, exactly the number listed. Cardinality is not defined this simply for infinite sets, which this article does not attempt.

## 7. Functions: domain and codomain

A **function** $f : A \to B$ assigns to every element of $A$ exactly one element of $B$. $A$ is the **domain**; $B$ is the **codomain**. "Exactly one" is doing real work in that definition: an assignment that gave some element of $A$ two different outputs, or none at all, would not be a function.

## 8. Injective, surjective, bijective

Let $A = \{1, 2, 3\}$ throughout. A function is **injective** ("one-to-one") if distinct inputs always produce distinct outputs — no two elements of the domain share an output. $f : \{1, 2\} \to \{1, 2, 3\}$ given by $f(1) = 1$, $f(2) = 2$ is injective: its two outputs, $1$ and $2$, are distinct. It is not **surjective** ("onto") — surjective means every element of the codomain is hit by something — because $3$ is never produced; with only two inputs and three codomain elements to cover, at least one was always going to be missed.

A function can fail to be injective while still being surjective. $g : \{a, b, c, d\} \to A$ given by $g(a) = 1, g(b) = 1, g(c) = 2, g(d) = 3$ hits every element of $A$ — surjective — but $a$ and $b$ both map to $1$, so it is not injective.

A function that is both injective and surjective is **bijective**: $h : A \to \{x, y, z\}$ given by $h(1) = x, h(2) = y, h(3) = z$ pairs every element of each set with exactly one element of the other, in both directions — nothing missed, nothing shared.

A function can also be neither: $k : A \to A$ given by $k(1) = 1, k(2) = 1, k(3) = 1$ is not injective, since $1$ and $2$ share an output, and not surjective, since $2$ and $3$ are never produced.

### Wrong model: Every function is either injective or surjective

**What is actually true:** The two properties are independent, and section 8's four examples already cover every combination: $f$ injective but not surjective, $g$ surjective but not injective, $h$ both, $k$ neither. Knowing a function fails one of these properties says nothing at all about whether it has the other.

## 9. Composition

Given $f : A \to B$ and $g : B \to C$, their **composition** $g \circ f : A \to C$ is defined by $(g \circ f)(x) = g(f(x))$ — apply $f$ first, then apply $g$ to the result. This requires $f$'s codomain and $g$'s domain to line up: $g \circ f$ only makes sense if every possible output of $f$ is a valid input to $g$. Using section 8's $h : A \to \{x, y, z\}$, composing it with some $j : \{x, y, z\} \to \{\text{true}, \text{false}\}$ is well-defined; composing $h$ with a function whose domain is unrelated to $\{x, y, z\}$ is not.

## Exercises

1. List the elements of $\{1, 2, 3\} \cup \{3, 4, 5\}$, $\{1, 2, 3\} \cap \{3, 4, 5\}$, and $\{1, 2, 3\} \setminus \{3, 4, 5\}$.

2. Is $2 \in \{1, 2, 3\}$ true? Is $\{2\} \subseteq \{1, 2, 3\}$ true? Is $\{2\} \in \{1, 2, 3\}$ true? Justify each separately.

3. Compute $|\{a, b\} \times \{1, 2, 3\}|$ two ways: by listing the Cartesian product directly, and by multiplying the two cardinalities.

4. Explain, using cardinality, why no injective function can exist from a $5$-element set to a $3$-element set.

5. Give a function from $\{1, 2\}$ to $\{1, 2, 3\}$ that is injective but not surjective, and explain why it cannot possibly be surjective.

6. Let $f(x) = x + 1$, with domain $\{1, 2, 3\}$ and codomain $\{2, 3, 4, 5\}$. Is $f$ injective? Is it surjective? Justify both answers.

7. Given $f : A \to B$ and $g : B \to C$, what has to be true about $f$'s codomain and $g$'s domain for $g \circ f$ to be defined?

8. A student claims every function that fails to be injective must be surjective. Give a counterexample.

## Answers

1. Union: $\{1, 2, 3, 4, 5\}$. Intersection: $\{3\}$, the only shared element. Difference: $\{1, 2\}$, the elements of the first set not also in the second.

2. $2 \in \{1, 2, 3\}$ is true — $2$ is one of the three elements. $\{2\} \subseteq \{1, 2, 3\}$ is true — the one element of $\{2\}$, namely $2$, is in $\{1, 2, 3\}$. $\{2\} \in \{1, 2, 3\}$ is false — the elements of $\{1, 2, 3\}$ are the numbers $1$, $2$, $3$, not the set $\{2\}$.

3. Listing: $\{(a,1), (a,2), (a,3), (b,1), (b,2), (b,3)\}$, six pairs. By multiplication: $|\{a,b\}| \times |\{1,2,3\}| = 2 \times 3 = 6$. Both agree.

4. With $5$ inputs and only $3$ possible outputs, at least two inputs must share an output — there are not enough distinct elements in a $3$-element codomain to give all $5$ inputs different ones. Sharing an output is exactly what injective rules out.

5. $f(1) = 1$, $f(2) = 2$: injective, since the two outputs are distinct. It cannot be surjective because the codomain $\{1, 2, 3\}$ has three elements and the domain only has two inputs to assign, so at least one codomain element, here $3$, is guaranteed to be missed.

6. Injective: yes — $f(1) = 2$, $f(2) = 3$, $f(3) = 4$ are three distinct outputs for three distinct inputs. Surjective: no — $5$ is in the codomain but no input produces it, since the largest output, $f(3) = 4$, never reaches it.

7. $f$'s codomain has to match $g$'s domain — or at least, every value $f$ could actually produce has to be a valid input to $g$ — so that whatever $f(x)$ evaluates to is always something $g$ can be applied to next.

8. $k(1) = 1, k(2) = 1, k(3) = 1$ from $\{1,2,3\}$ to $\{1,2,3\}$ is not injective, since $1$ and $2$ share the output $1$, and it is also not surjective, since $2$ and $3$ are never produced. A function can fail both properties at once.
