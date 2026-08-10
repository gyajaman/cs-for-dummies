---
id: m-predicates-quantifiers
title: "Predicates and quantifiers"
track: math
---

# Predicates and quantifiers

`Propositional logic` worked with $p$, $q$, $r$ standing for whole, fixed statements — each one already true or false on its own. Most of the claims this website actually wants to make are not like that: "$x$ is even," "$n$ is prime," "every element of $S$ is positive." These depend on which $x$, which $n$, which $S$ you mean. This article gives you the vocabulary for that dependence, and for the two ways of turning it back into a definite, fixed truth value.

## 1. Predicates as parameterised propositions

A **predicate** is a statement containing one or more variables, which becomes a proposition — true or false, in `Propositional logic`'s sense — only once those variables are given specific values. Write $P(x)$ for "the predicate $P$ applied to $x$." $P(x) : \text{"}x \text{ is even"}$ is not itself true or false; $P(4)$ is true, $P(7)$ is false. A predicate is a function from values to truth values, in exactly `Sets and functions`' sense of function, with codomain $\{\text{true}, \text{false}\}$.

A predicate can take more than one variable. $Q(x, y) : \text{"} x < y \text{"}$ has $Q(2, 5)$ true and $Q(5, 2)$ false.

## 2. The universal quantifier

$\forall x \in S, P(x)$ — "for all $x$ in $S$, $P(x)$" — is true exactly when $P(x)$ is true for every single element of $S$, with no exceptions. If $S = \{2, 4, 6\}$ and $P(x) : \text{"} x \text{ is even"}$, then $\forall x \in S, P(x)$ is true: check $2$, check $4$, check $6$, all even. If $S = \{2, 4, 5\}$, the same statement is false — $5$ alone is enough to break it, regardless of how many elements do satisfy $P$.

A universally quantified statement over an infinite set, such as $\forall n \in \mathbb{N}, n + 1 > n$, cannot be checked by testing every element — there are infinitely many. It is still a single proposition with a single truth value; establishing that value for an infinite $S$ is what `Proof by induction` is for.

## 3. The existential quantifier

$\exists x \in S, P(x)$ — "there exists $x$ in $S$ such that $P(x)$" — is true exactly when at least one element of $S$ satisfies $P(x)$; it takes only one. With $S = \{1, 3, 4\}$ and $P(x) : \text{"} x \text{ is even"}$, $\exists x \in S, P(x)$ is true because of $4$ alone — $1$ and $3$ failing is irrelevant. With $S = \{1, 3, 5\}$, it is false: no element satisfies $P$, so there is nothing to witness the claim.

A single element making $\exists x \in S, P(x)$ true is called a **witness**. Exhibiting one witness is a complete proof of an existential statement; no amount of failed witnesses proves the universal statement, but a single failed witness disproves it, and a single successful witness proves the existential one. The two quantifiers are not symmetric in how much evidence they need.

### Wrong model: $\forall$ and $\exists$ are just stronger and weaker versions of the same idea

**What is actually true:** They ask different questions with different proof burdens. Proving $\forall x \in S, P(x)$ requires checking every element, or an argument that covers all of them at once, such as induction. Proving $\exists x \in S, P(x)$ requires exhibiting a single witness. Disproving $\forall x \in S, P(x)$ requires exhibiting one **counterexample**, exactly as light a burden as proving $\exists$. Disproving $\exists x \in S, P(x)$ requires checking every element fails, exactly as heavy a burden as proving $\forall$. The two quantifiers trade proof burden for disproof burden in opposite directions.

## 4. Bound and free variables

In $\forall x \in S, P(x)$, the variable $x$ is **bound** by the quantifier — it is a placeholder local to that statement, not a reference to some $x$ defined elsewhere. Renaming it changes nothing: $\forall x \in S, P(x)$ and $\forall y \in S, P(y)$ are the same proposition, exactly as `Sets and functions`' set-builder notation does not care what letter you use for the bound element. A variable appearing in a predicate but not captured by any quantifier, such as the $x$ in $P(x)$ on its own, is **free** — it is not yet a proposition at all, since it has no fixed value and nothing has quantified over it.

## 5. Nested quantifiers and order

Predicates of two variables can be quantified twice, once for each, and the two quantifiers are read from left to right, each one binding the variable inside everything to its right. Let $x, y$ range over $\mathbb{R}$ and let $Q(x, y) : \text{"} x < y \text{"}$.

$\forall x, \exists y, Q(x, y)$ reads "for every $x$, there exists a $y$ with $x < y$" — for every real number, some larger real number exists. This is true: given any $x$, $y = x + 1$ works.

$\exists y, \forall x, Q(x, y)$ reads "there exists a $y$ such that, for every $x$, $x < y$" — a single $y$ larger than every real number, all at once. This is false: no real number is larger than all others, since $y + 1 > y$ for any candidate $y$ you propose.

Swapping the two quantifiers produced two statements with opposite truth values from the identical predicate $Q$. The order is not a stylistic choice.

### Wrong model: Quantifier order can be swapped without changing meaning

**What is actually true:** Section 5's $\forall x, \exists y, Q(x, y)$ and $\exists y, \forall x, Q(x, y)$ are built from the same predicate and the same two quantifiers, differing only in which one is written first, and one is true while the other is false. Swapping $\forall$ and $\exists$ changes what is being claimed: "for every $x$ there is some $y$ that may depend on $x$" is a far weaker claim than "there is one $y$ that works for every $x$ simultaneously." $\forall \exists$ allows the witness to change with each outer value; $\exists \forall$ demands a single witness that survives all of them. Two quantifiers of the *same* kind can be swapped freely — $\forall x, \forall y, Q(x,y)$ means the same thing as $\forall y, \forall x, Q(x,y)$ — the danger is specific to mixing $\forall$ with $\exists$.

## 6. Negating quantified statements

Negating a quantified statement flips the quantifier and negates the predicate, in a pattern parallel to `Propositional logic`'s De Morgan's laws:

$$\lnot(\forall x \in S, P(x)) \equiv \exists x \in S, \lnot P(x) \qquad \lnot(\exists x \in S, P(x)) \equiv \forall x \in S, \lnot P(x)$$

Read the first in words: to deny that $P$ holds for every element of $S$ is to claim some element fails it — one counterexample is all that is needed, matching section 3's asymmetry exactly. Read the second: to deny that any element of $S$ satisfies $P$ is to claim every element fails it.

Check this against section 5's example: $\lnot(\forall x, \exists y, Q(x,y))$ negates to $\exists x, \forall y, \lnot Q(x,y)$ — pushing the negation through swaps every quantifier it passes and negates only the innermost predicate, never the variables or the sets they range over.

### Wrong model: Negating $\forall x, P(x)$ gives $\forall x, \lnot P(x)$

**What is actually true:** Negating a universal statement produces an *existential* one, not another universal one, exactly as section 6's identity states: $\lnot(\forall x \in S, P(x)) \equiv \exists x \in S, \lnot P(x)$. Take $S = \{2, 4, 5\}$ and $P(x) : \text{"} x \text{ is even"}$. $\forall x \in S, P(x)$ is false, since $5$ is odd. Its negation must therefore be true. $\exists x \in S, \lnot P(x)$ is indeed true — $5$ witnesses it. But $\forall x \in S, \lnot P(x)$, "every element of $S$ is odd," is false, since $2$ and $4$ are even. The wrong-model version does not even have the correct truth value, let alone the correct meaning.

## Exercises

1. Let $S = \{3, 6, 9\}$ and $P(x) : \text{"} x \text{ is a multiple of } 3\text{"}$. State the truth value of $\forall x \in S, P(x)$ and of $\exists x \in S, P(x)$, and justify each.

2. Is $x > 0$, on its own, a proposition? Is $\forall x \in \mathbb{N}, x > 0$? Explain the difference.

3. Give a counterexample showing that $\forall n \in \mathbb{N}, n^2 > n$ is false.

4. Let $x, y$ range over $\mathbb{N}$ and let $R(x, y) : \text{"} x + y = 10\text{"}$. Is $\forall x, \exists y, R(x, y)$ true over $\mathbb{N}$? Is $\exists y, \forall x, R(x, y)$? Justify both.

5. Write the negation of $\forall x \in S, (P(x) \land Q(x))$, pushing the negation as far inward as possible. (You will need De Morgan's law from `Propositional logic` as well as section 6's identities.)

6. A student says "to disprove $\exists x \in S, P(x)$, just find one $x$ where $P(x)$ is false." Explain what is wrong with this, using section 6.

7. Identify the bound and free variables in $\exists y \in \mathbb{N}, x < y$.

## Answers

1. $\forall x \in S, P(x)$ is true: $3$, $6$, and $9$ are all multiples of $3$. $\exists x \in S, P(x)$ is also true, and more cheaply — any single element, say $3$, is already a witness.

2. "$x > 0$" alone is not a proposition — $x$ is free, so it has no fixed truth value until a value is supplied. $\forall x \in \mathbb{N}, x > 0$ is a proposition: the quantifier binds $x$, and the whole statement is false, since $0 \in \mathbb{N}$ and $0 > 0$ is false.

3. $n = 0$: $0^2 = 0$, and $0 > 0$ is false. One counterexample is sufficient to make the universal statement false.

4. $\forall x, \exists y, R(x, y)$ is true: for any $x \in \mathbb{N}$ with $x \le 10$, $y = 10 - x$ works; for $x > 10$, no natural number $y$ makes $x + y = 10$, so the statement is actually false — $x = 11$ has no valid $y$ in $\mathbb{N}$, since $y$ would have to be negative. $\exists y, \forall x, R(x, y)$ is false regardless: it would require one fixed $y$ making $x + y = 10$ for every $x \in \mathbb{N}$ simultaneously, which is impossible since different $x$ values need different $y$ values.

5. $\lnot(\forall x \in S, (P(x) \land Q(x))) \equiv \exists x \in S, \lnot(P(x) \land Q(x))\equiv \exists x \in S, (\lnot P(x) \lor \lnot Q(x))$: the quantifier flips first, per section 6, then De Morgan flips the inner $\land$ to $\lor$ and negates each part.

6. That disproves $\forall x \in S, P(x)$, not $\exists x \in S, P(x)$. By section 6, $\lnot(\exists x \in S, P(x)) \equiv \forall x \in S, \lnot P(x)$ — disproving the existential statement requires showing $P(x)$ fails for *every* element of $S$, not just one.

7. $y$ is bound, by $\exists y \in \mathbb{N}$. $x$ is free — nothing in the statement quantifies over it, so its truth value depends on whatever value of $x$ is supplied from outside.
