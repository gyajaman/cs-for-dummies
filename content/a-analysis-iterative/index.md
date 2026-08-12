---
id: a-analysis-iterative
title: "Counting operations: analysing iterative algorithms"
track: algo
---

# Counting operations: analysing iterative algorithms

`Asymptotic notation: O, Omega, Theta` gave you a precise way to compare two functions' growth. `Summations and closed forms` gave you closed forms for the sums a loop tends to produce. This article puts the two together on actual C code: count exactly how many primitive operations a loop performs, express that count as a sum, reduce the sum to a closed form, and then classify the result with $\Theta$ — turning "how fast is this" from a feeling into a derivation.

## 1. Counting primitive operations

A **primitive operation** is one fixed unit of work whose cost does not depend on the size of the input — an addition, a comparison, an assignment, one array access. Counting them means picking, once, which operations you are going to tally, and then tallying every occurrence of exactly those operations as the code runs, not estimating or guessing from the code's shape.

```c file=countops.c run
#include <stdio.h>

int main(void)
{
    int n = 10;
    long ops = 0;
    int sum = 0;

    for (int i = 0; i < n; i++) {
        ops++;
        sum = sum + i;
    }

    printf("n=%d, sum=%d, ops=%ld\n", n, sum, ops);
    return 0;
}
```

```output
n=10, sum=45, ops=10
```

`ops` counts one operation, the addition `sum = sum + i`, once per iteration, incremented directly alongside the operation being counted rather than inferred afterward. For `n = 10`, the loop body runs `10` times, and `ops` confirms it directly: `10`. Nothing here is specific to `n = 10` — the loop runs its body once for every `i` from `0` to `n - 1`, which is `n` iterations for any `n`, so the addition executes exactly `n` times regardless of which `n` you pick.

## 2. Loop counts as summations

The count from section 1, expressed as a sum rather than read off a single run, is

$$\sum_{i=0}^{n-1} 1 = n$$

one operation counted once per value `i` takes, from `0` to `n-1` — the same shape `Summations and closed forms` used for "a loop that runs $n$ times, doing a fixed amount of work per iteration," reduced there to $cn$ with $c = 1$. This is the general method: write down a sum with one term per iteration, where the term is however many primitive operations that iteration performs, and reduce the sum to closed form using whatever identity applies.

## 3. Nested loops

```c file=triangular.c run
#include <stdio.h>

int main(void)
{
    for (int n = 5; n <= 20; n += 5) {
        long ops = 0;
        for (int i = 1; i <= n; i++)
            for (int j = 1; j <= i; j++)
                ops++;
        printf("n=%d, ops=%ld\n", n, ops);
    }
    return 0;
}
```

```output
n=5, ops=15
n=10, ops=55
n=15, ops=120
n=20, ops=210
```

The inner loop's own bound, `j <= i`, depends on the outer loop's current position, so the count is a sum of sums — exactly `Summations and closed forms`'s nested-loop example:

$$\sum_{i=1}^{n} \sum_{j=1}^{i} 1 = \sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$

Check against the measured output: at $n=10$, $\frac{10 \times 11}{2} = 55$, matching `ops` exactly; at $n=20$, $\frac{20 \times 21}{2} = 210$, matching again. The closed form was derived once, algebraically, and then confirmed against real runs — not read off a table of measurements.

## 4. Best, worst, and average case

```c file=linearsearch.c run
#include <stdio.h>

int linear_search(int *a, int n, int target, long *comparisons)
{
    for (int i = 0; i < n; i++) {
        (*comparisons)++;
        if (a[i] == target)
            return i;
    }
    return -1;
}

int main(void)
{
    int n = 8;
    int a[8] = {0, 1, 2, 3, 4, 5, 6, 7};

    long best = 0;
    linear_search(a, n, 0, &best);
    printf("best case (target at index 0): %ld comparisons\n", best);

    long worst = 0;
    linear_search(a, n, 999, &worst);
    printf("worst case (target absent): %ld comparisons\n", worst);

    long total = 0;
    for (int t = 0; t < n; t++) {
        long c = 0;
        linear_search(a, n, t, &c);
        total += c;
    }
    printf("average over all present positions: %.2f comparisons\n", (double)total / n);

    return 0;
}
```

```output
best case (target at index 0): 1 comparisons
worst case (target absent): 8 comparisons
average over all present positions: 4.50 comparisons
```

`linear_search` does not perform the same number of comparisons on every input of the same size $n$ — how many it does depends on *where*, or whether, `target` is found, not on $n$ alone. Three separate counts are worth naming: the **best case**, the fewest comparisons any input of size $n$ can force — here, $1$, when the target is at index `0`; the **worst case**, the most any input of size $n$ can force — here, $n$, when the target is absent (or last), and every element gets compared; and the **average case**, the mean count over some stated distribution of inputs — here, over every position the target could occupy with equal likelihood, $\frac{1 + 2 + \cdots + n}{n} = \frac{n(n+1)/2}{n} = \frac{n+1}{2}$, confirmed above: $\frac{8+1}{2} = 4.5$, matching the measured average exactly. All three are legitimate, simultaneously true facts about the same function; none of them is "the" running time on its own, and a claim about one says nothing automatically about either of the others.

## 5. Converting a count into $\Theta$

A closed-form count, once derived, is classified with `Asymptotic notation: O, Omega, Theta`'s machinery exactly as any other function of $n$ would be. Section 3's triangular count, $\frac{n(n+1)}{2} = \frac{1}{2}n^2 + \frac{1}{2}n$, is $\Theta(n^2)$: it is $O(n^2)$ since $\frac{1}{2}n^2 + \frac{1}{2}n \le n^2$ for every $n \ge 1$ (witnesses $c=1, n_0=1$), and it is $\Omega(n^2)$ since $\frac{1}{2}n^2 + \frac{1}{2}n \ge \frac{1}{2}n^2$ for every $n \ge 0$ (witnesses $c=\frac{1}{2}, n_0=0$) — both halves of $\Theta$'s definition satisfied by the same closed form, exactly the mechanical proof-from-definition `Asymptotic notation: O, Omega, Theta`'s section 2 walked through. Section 4's worst case, $n$, is $\Theta(n)$ directly; its average case, $\frac{n+1}{2}$, is also $\Theta(n)$ — a different exact function, and a different constant, but the identical order of growth, since constants are absorbed exactly as that article's section 6 described.

Stating a running time as $\Theta$ rather than leaving it as an exact closed form is a deliberate loss of information, kept only once the exact count has actually been derived — not a shortcut around deriving it. $\frac{n(n+1)}{2}$ and $n^2$ are different functions with different exact values at every $n$; calling both "$\Theta(n^2)$" is a true, useful statement about their shared growth rate, made only after the exact form was in hand to check it against.

## 6. Defining input size

Every count above was written as a function of $n$, and $n$ meant something concrete and specific in each case: the number of elements in the array being summed or searched. Input size is not automatically "the number", it is whatever quantity the algorithm's work actually scales with, and that has to be stated, not assumed. An algorithm over an array scales with the element count; an algorithm over a matrix might scale with the number of rows, the number of columns, or their product, depending on what it does; an algorithm over an integer value taken as input, rather than a collection, more often scales with the number of *digits* needed to write that value down than with the value itself — a distinction with real consequences once the input can be large, though a full treatment of that case is not this article's subject. What matters here is the discipline: before counting a single operation, say explicitly what $n$ refers to for the algorithm at hand, since every sum in sections 2 through 4 was built directly on top of that choice.

## 7. The error of assuming nested loops are always quadratic

```c file=constantinner.c run
#include <stdio.h>

int main(void)
{
    for (int n = 5; n <= 20; n += 5) {
        long ops = 0;
        for (int i = 1; i <= n; i++)
            for (int j = 1; j <= 3; j++)
                ops++;
        printf("n=%d, ops=%ld\n", n, ops);
    }
    return 0;
}
```

```output
n=5, ops=15
n=10, ops=30
n=15, ops=45
n=20, ops=60
```

Two loops, one nested inside the other, superficially resembles section 3's triangular example — but here the inner loop's bound, `j <= 3`, is a fixed constant, not a value that grows with `i` or `n`. The count is

$$\sum_{i=1}^{n} \sum_{j=1}^{3} 1 = \sum_{i=1}^{n} 3 = 3n$$

$\Theta(n)$, not $\Theta(n^2)$ — confirmed directly above: `ops` at $n=20$ is $60 = 3 \times 20$, growing in direct proportion to $n$, not to $n^2$ (which would be $400$). "Nested loops" describes a *shape* of code, not a growth rate; the actual count depends entirely on what each loop's bound is a function of, and has to be derived, per section 2, rather than read off the fact that one loop sits inside another.

### Wrong model: Two nested loops always mean $\Theta(n^2)$ work

**What is actually true:** Section 7's measured counts are the direct disproof — two nested loops, and a growth rate of $\Theta(n)$, not $\Theta(n^2)$, because the inner loop's bound never grows with $n$ at all. The number of nested loops in the source is not itself a quantity that appears in any closed form; what appears is each loop's actual bound, and those bounds have to be summed correctly, as sections 2 and 3 did, to find out what order of growth actually results. Two nested loops can just as easily produce $\Theta(n)$, as here, $\Theta(n^2)$, as in section 3, or something else again, depending entirely on what each bound is a function of.

### Wrong model: A loop that visibly does less work than a full $n \times n$ pass must be a lower order than $\Theta(n^2)$

**What is actually true:** Section 3's triangular loop runs roughly half as many total iterations as a full $n \times n$ double loop would — $\frac{n(n+1)}{2}$ against $n^2$ — and it is still $\Theta(n^2)$, exactly as section 5 derived. A constant factor of $\frac{1}{2}$ is absorbed into $\Theta$'s witnesses precisely as `Asymptotic notation: O, Omega, Theta`'s section 6 described; running "half as many" iterations changes the constant, not the order of growth. Distinguishing "grows more slowly by a constant factor" from "grows at a genuinely lower order" is exactly what deriving the closed form, rather than eyeballing the code, is for.

## Exercises

1. Write the sum corresponding to a single loop `for (int i = 0; i < n; i++) { ops++; ops++; }`, which counts two operations per iteration, and reduce it to closed form.

2. A nested loop has an outer loop from `i = 0` to `n - 1` and an inner loop from `j = 0` to `4` (five iterations, a fixed bound). Write the total operation count as a nested sum, reduce it, and classify it with $\Theta$.

3. Using section 4, explain why `linear_search`'s best case being $\Theta(1)$ does not contradict its worst case being $\Theta(n)$.

4. A student measures `triangular.c`'s `ops` at $n = 100$ and gets `5050`, then claims this proves the algorithm is exactly $\frac{n(n+1)}{2}$ for every $n$. What would it actually take to prove that, as opposed to what one measurement shows?

5. Explain, using section 6, why "the input has size $n$" is not itself a complete statement, and what has to accompany it before a count like section 3's means anything.

6. A loop is nested three deep: outer `i` from `0` to `n-1`, middle `j` from `0` to `n-1`, inner `k` from `0` to `1` (two iterations, fixed). What is its $\Theta$ classification? Justify using section 7's method rather than counting the number of nested loops.

7. Using section 5, explain why $\frac{n(n+1)}{2}$ and $n^2$ can both correctly be called $\Theta(n^2)$ even though they are never equal for $n > 0$.

## Answers

1. $\sum_{i=0}^{n-1} 2 = 2n$, using `Summations and closed forms`'s constant-per-iteration reduction with $c=2$.

2. $\sum_{i=0}^{n-1}\sum_{j=0}^{4} 1 = \sum_{i=0}^{n-1} 5 = 5n$, which is $\Theta(n)$ — the inner bound is fixed at five iterations regardless of $n$, so it contributes a constant factor, not a second factor of $n$.

3. Best case and worst case are two different functions of $n$ — the fewest and the most comparisons any input of size $n$ can force, respectively — and both can be simultaneously true statements about the same algorithm, exactly as section 4 states. $\Theta(1)$ describes the best case specifically (target found immediately); $\Theta(n)$ describes the worst case specifically (target absent or last); neither claim is about "the" running time in general, so there is no contradiction between them.

4. One measurement at $n=100$ only confirms the formula at that single point; $5050 = \frac{100 \times 101}{2}$ does match, but proving the formula holds for *every* $n$ requires the algebraic derivation section 3 gave — reducing the nested sum $\sum_{i=1}^{n}\sum_{j=1}^{i} 1$ to $\frac{n(n+1)}{2}$ directly — not a collection of measurements, however many, since no finite number of checked values proves a statement about every natural number, exactly the point `Proof by induction` makes about checking cases individually versus proving a universal claim.

5. "The input has size $n$" does not say what $n$ actually measures for the specific algorithm and input type in question — section 6 showed it could be an element count, a row count, a column count, or something else again depending on what the algorithm's work actually scales with. Section 3's sum, $\sum_{i=1}^n \sum_{j=1}^i 1$, is only meaningful once it is clear that $n$ refers to the outer loop's own bound; without that stated explicitly, "$n$" is an unbound placeholder, not a specific quantity being counted against.

6. $\sum_{i=0}^{n-1}\sum_{j=0}^{n-1}\sum_{k=0}^{1} 1 = \sum_{i=0}^{n-1}\sum_{j=0}^{n-1} 2 = \sum_{i=0}^{n-1} 2n = 2n^2$, which is $\Theta(n^2)$. This follows section 7's method directly: the innermost bound is fixed (contributing a constant factor of $2$), while the outer two loops both range over all of $n$, contributing the $n^2$ — three nested loops here produce a quadratic count, not a cubic one, because only two of the three bounds actually grow with $n$.

7. $\Theta(n^2)$ is a claim about growth rate, not about exact equality — `Asymptotic notation: O, Omega, Theta`'s definition only requires each function to be sandwiched between constant multiples of $n^2$ from some point on, not that the two functions coincide. $\frac{n(n+1)}{2} = \frac{1}{2}n^2 + \frac{1}{2}n$ and $n^2$ differ by roughly a factor of two at every $n$, and both sit between constant multiples of $n^2$ (section 5 exhibited the witnesses directly), which is all $\Theta(n^2)$ actually asserts.
