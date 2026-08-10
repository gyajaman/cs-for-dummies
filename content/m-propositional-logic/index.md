---
id: m-propositional-logic
title: "Propositional logic"
track: math
---

# Propositional logic

Every proof, every conditional statement, every claim on this website that something follows from something else, follows the rules laid out here. They are worth learning explicitly rather than absorbing by feel, because at least one of them, section 3's, disagrees with how the corresponding English word is used casually — and the disagreement is deliberate, not a simplification.

## 1. Propositions

A **proposition** is a statement with a definite truth value: true, or false, never both, never neither. "$7$ is prime" is a proposition — true. "Paris is the capital of Germany" is a proposition — false. "Close the door" is not a proposition; it has no truth value at all, it is an instruction. "Is $7$ prime?" is not a proposition either — a question, not a claim. Propositional logic uses letters, $p$, $q$, $r$, to stand for arbitrary propositions, exactly the way algebra uses $x$ to stand for an arbitrary number.

## 2. and, or, not

Three ways to build a new proposition out of existing ones. **Conjunction**, $p \land q$, "$p$ and $q$": true exactly when both are true.

| $p$ | $q$ | $p \land q$ |
|---|---|---|
| T | T | T |
| T | F | F |
| F | T | F |
| F | F | F |

**Disjunction**, $p \lor q$, "$p$ or $q$": true when at least one is true — this is the *inclusive* or, true even when both are.

| $p$ | $q$ | $p \lor q$ |
|---|---|---|
| T | T | T |
| T | F | T |
| F | T | T |
| F | F | F |

**Negation**, $\lnot p$, "not $p$": flips the truth value.

| $p$ | $\lnot p$ |
|---|---|
| T | F |
| F | T |

## 3. Implication

$p \to q$, "if $p$ then $q$," is the connective worth the most care:

| $p$ | $q$ | $p \to q$ |
|---|---|---|
| T | T | T |
| T | F | F |
| F | T | T |
| F | F | T |

Only one row is false: $p$ true, $q$ false. Every other row, including both rows where $p$ is false, is true. Section on why this is the right table, not an arbitrary convention, follows immediately, because it is the single most common source of confusion in this article.

### Wrong model: $p \to q$ is false whenever $p$ is false

**What is actually true:** $p \to q$ is true whenever $p$ is false, regardless of $q$ — the third and fourth rows of the table above. Read $p \to q$ as a promise: "if $p$ happens, $q$ will happen too." The promise is *broken* only when $p$ happens and $q$ does not — the one false row. If $p$ never happens, the promise was never put to the test, and a promise that was never tested has not been broken; calling it true, "**vacuously**" true, is the position that makes the rest of logic and every proof by contradiction on this website behave consistently. "If $7$ is even, then $7$ is prime" is a true statement, despite $7$ not being even and the claim sounding strange — the hypothesis simply never applies, so there is nothing for the implication to get wrong.

## 4. Biconditional

$p \leftrightarrow q$, "$p$ if and only if $q$": true exactly when $p$ and $q$ share the same truth value, both true or both false.

| $p$ | $q$ | $p \leftrightarrow q$ |
|---|---|---|
| T | T | T |
| T | F | F |
| F | T | F |
| F | F | T |

## 5. Tautology and contradiction

A **tautology** is a compound proposition that is true on every row of its truth table, regardless of the truth values of its parts. $p \lor \lnot p$ — "$p$ or not $p$" — is one:

| $p$ | $\lnot p$ | $p \lor \lnot p$ |
|---|---|---|
| T | F | T |
| F | T | T |

A **contradiction** is the opposite: false on every row. $p \land \lnot p$ is one:

| $p$ | $\lnot p$ | $p \land \lnot p$ |
|---|---|---|
| T | F | F |
| F | T | F |

Neither of these facts depends on what $p$ actually claims — they hold for every proposition whatsoever, purely from the shape of the connectives involved.

## 6. Logical equivalence

Two propositions are **logically equivalent**, written $\equiv$, when their truth tables match on every row — when they are true and false in exactly the same cases, for every possible assignment to their shared variables. $p \to q$ and $\lnot p \lor q$ are equivalent:

| $p$ | $q$ | $p \to q$ | $\lnot p \lor q$ |
|---|---|---|---|
| T | T | T | T |
| T | F | F | F |
| F | T | T | T |
| F | F | T | T |

Every row matches. This is not a coincidence to memorise separately from section 3's table — it is the same fact written differently: "$p$ is false, or $q$ is true" is exactly the condition under which the promise in section 3 has not been broken.

## 7. De Morgan's laws

Negating a conjunction or disjunction distributes the negation and flips the connective:

$$\lnot(p \land q) \equiv \lnot p \lor \lnot q \qquad \lnot(p \lor q) \equiv \lnot p \land \lnot q$$

Checking the first by truth table:

| $p$ | $q$ | $p \land q$ | $\lnot(p \land q)$ | $\lnot p \lor \lnot q$ |
|---|---|---|---|---|
| T | T | T | F | F |
| T | F | F | T | T |
| F | T | F | T | T |
| F | F | F | T | T |

The last two columns match on every row. In words: "$p$ and $q$" fails to hold exactly when at least one of them fails to hold — negating "and" turns it into "or," and negates each part.

## 8. Contrapositive versus converse

Given $p \to q$, two related statements are built from it, and only one of them means the same thing. The **contrapositive**, $\lnot q \to \lnot p$, is logically equivalent to the original:

| $p$ | $q$ | $p \to q$ | $\lnot q \to \lnot p$ |
|---|---|---|---|
| T | T | T | T |
| T | F | F | F |
| F | T | T | T |
| F | F | T | T |

The **converse**, $q \to p$, generally is not:

| $p$ | $q$ | $p \to q$ | $q \to p$ |
|---|---|---|---|
| T | T | T | T |
| T | F | F | T |
| F | T | T | F |
| F | F | T | T |

The second row already breaks the match: $p \to q$ is false there, $q \to p$ is true. "If a shape is a square, then it has four sides" is true; its converse, "if a shape has four sides, then it is a square," is false — a rectangle has four sides and is not a square. Swapping which side implies which is not a harmless rewording.

### Wrong model: The converse of a true implication is also true

**What is actually true:** Section 8's own truth table shows the converse disagreeing with the original on an entire row, and the square example makes it concrete: truth of $p \to q$ says nothing whatsoever about $q \to p$. What *is* always equivalent to $p \to q$ is its contrapositive, $\lnot q \to \lnot p$ — a fact worth keeping distinct from the converse specifically because the two are so easy to mix up, and only one of them is safe to substitute for the original.

## Exercises

1. Which of these are propositions? Justify each: "It is raining," "Close the door," "$9$ is prime," "Is $9$ prime?"

2. Construct the full truth table for $p \lor \lnot q$.

3. Using the "promise" reading from section 3, explain why $p \to q$ is true whenever $p$ is false, regardless of $q$.

4. Write both the converse and the contrapositive of "If a number is divisible by $4$, then it is even."

5. Verify, by truth table, that $p \to q$ and $\lnot p \lor q$ are logically equivalent, without looking back at section 6.

6. Use De Morgan's law to rewrite $\lnot(p \lor q)$ without a negation applied to the whole expression.

7. Is $p \leftrightarrow \lnot p$ a tautology, a contradiction, or neither? Justify using a truth table.

8. Give a concrete, real-world example, different from the square/rectangle one, of a true implication whose converse is false.

## Answers

1. "It is raining" is a proposition — it is definitely true or false at any given moment. "Close the door" is not — it is an instruction with no truth value. "$9$ is prime" is a proposition — false, since $9 = 3 \times 3$. "Is $9$ prime?" is not — a question has no truth value.

2. 

| $p$ | $q$ | $\lnot q$ | $p \lor \lnot q$ |
|---|---|---|---|
| T | T | F | T |
| T | F | T | T |
| F | T | F | F |
| F | F | T | T |

3. $p \to q$ is read as a promise that $q$ holds whenever $p$ does. If $p$ is false, the condition that would trigger the promise never occurred, so the promise cannot have been broken — there was nothing for it to fail to deliver on. Logic calls an unbroken, untested promise true, which is exactly why both rows with $p$ false are true.

4. Converse: "If a number is even, then it is divisible by $4$" — false in general, since $6$ is even but not divisible by $4$. Contrapositive: "If a number is not even, then it is not divisible by $4$" — true, and logically equivalent to the original.

5. 

| $p$ | $q$ | $p \to q$ | $\lnot p \lor q$ |
|---|---|---|---|
| T | T | T | T |
| T | F | F | F |
| F | T | T | T |
| F | F | T | T |

Every row matches, confirming the equivalence.

6. $\lnot(p \lor q) \equiv \lnot p \land \lnot q$.

7. A contradiction. $p \leftrightarrow \lnot p$ asks whether $p$ and $\lnot p$ share a truth value; by definition of negation they never do, so this is false on both rows: $p = T$ gives $T \leftrightarrow F = F$; $p = F$ gives $F \leftrightarrow T = F$.

8. "If an animal is a cat, then it has fur" is true. Its converse, "if an animal has fur, then it is a cat," is false — a dog has fur and is not a cat. Any "all members of a specific category share a general property" statement produces the same pattern, since other things can share the general property without belonging to the specific category.
