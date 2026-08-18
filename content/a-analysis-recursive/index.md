---
id: a-analysis-recursive
title: "Analysing recursive algorithms"
track: algo
---

# Analysing recursive algorithms

`Recursion` writes algorithms as calls to smaller instances of themselves rather than as loops, and `Recurrence relations` is exactly the tool built for that shape: this article's whole method is to read a recursive function's own body as a recurrence, solve it with `Recurrence relations`'s techniques, and classify the result with `Asymptotic notation: O, Omega, Theta` — and, new here, account for the memory a chain of live calls consumes, not only the operations it performs.

## 1. Deriving the recurrence from the code

```c file=recsum.c run
#include <stdio.h>

int sum(int *a, int n)
{
    if (n == 0)
        return 0;
    return a[n - 1] + sum(a, n - 1);
}

int main(void)
{
    int a[5] = {10, 20, 30, 40, 50};
    printf("sum is %d\n", sum(a, 5));
    return 0;
}
```

```output
sum is 150
```

`sum`'s base case, `n == 0`, does a fixed, constant amount of work — one comparison, one `return`. Its recursive case does a fixed amount of work of its own — one subtraction, one array access, one addition, one call — plus whatever the call `sum(a, n - 1)` costs. Reading the code directly as a recurrence:

$$T(0) = c_1, \qquad T(n) = T(n-1) + c_2 \text{ for } n \ge 1$$

for constants $c_1, c_2$ — the cost of the base case and the cost of the recursive case's own work, respectively. This is mechanical: a base case's own work becomes the recurrence's base case; a recursive case's own work, plus one $T(\cdot)$ term per recursive call it makes, at whatever smaller argument that call uses, becomes the recursive case.

## 2. A second example, with branching

```c file=maxof.c run
#include <stdio.h>

int max_of(int *a, int lo, int hi)
{
    if (lo == hi)
        return a[lo];
    int mid = lo + (hi - lo) / 2;
    int left = max_of(a, lo, mid);
    int right = max_of(a, mid + 1, hi);
    return left > right ? left : right;
}

int main(void)
{
    int a[8] = {30, 10, 50, 20, 90, 40, 70, 60};
    printf("max is %d\n", max_of(a, 0, 7));
    return 0;
}
```

```output
max is 90
```

`max_of` splits its range in half and recurses on each half, combining the two results with one comparison. Writing $n = hi - lo + 1$ for the number of elements being considered, the base case does constant work; the recursive case makes *two* calls, each on roughly $n/2$ elements, plus its own constant work:

$$T(1) = c_1, \qquad T(n) = 2\,T(n/2) + c_2 \text{ for } n \ge 2$$

exactly `Recurrence relations`'s section 6 shape, $a=2, b=2$, with $f(n)$ here a constant rather than $n$ itself.

## 3. Solving by unrolling and verifying by induction

Section 1's recurrence is `Recurrence relations`'s section 1 shape exactly, with $f(n) = c_2$ constant rather than $n$. Unrolling:

$$T(n) = T(n-1) + c_2 = T(n-2) + 2c_2 = \cdots = T(0) + n c_2 = c_1 + n c_2$$

**Verify by induction.** Base case ($n=0$): $T(0) = c_1$; the formula gives $c_1 + 0 \cdot c_2 = c_1$. Equal. Inductive step: assume $T(k) = c_1 + k c_2$ for arbitrary $k \ge 0$. Then $T(k+1) = T(k) + c_2 = c_1 + kc_2 + c_2 = c_1 + (k+1)c_2$, exactly the formula at $n=k+1$. Proved for every $n \ge 0$: $T(n) = c_1 + nc_2$, which is $\Theta(n)$ by `Asymptotic notation: O, Omega, Theta`'s constant-absorption argument, regardless of the specific values of $c_1, c_2$.

Section 2's recurrence, substituting $n = 2^k$ and $S(k) = T(2^k)$: $S(0) = c_1$, $S(k) = 2S(k-1) + c_2$. Unrolling: $S(k) = 2^k c_1 + c_2\left(2^{k-1} + 2^{k-2} + \cdots + 1\right)$. That parenthesised sum of powers of two is always one short of the next power of two — $1 = 2-1$, $1+2=3=4-1$, $1+2+4=7=8-1$, each step's running total plus the next power of two reaching exactly one less than double it — so $2^{k-1}+\cdots+1 = 2^k - 1$, giving $S(k) = 2^k c_1 + c_2(2^k-1)$. Taking $c_1 = c_2 = 1$ to match the concrete count of comparisons `max_of` performs, $S(k) = 2^k + 2^k - 1 = 2^{k+1}-1$, so $T(n) = 2n - 1$.

**Verify directly against measurement:** `max_of` on $n=4,8,16,32$ elements makes exactly $2n-1$ total calls — $7, 15, 31, 63$ — matching the closed form exactly, for the specific constants this particular implementation happens to have.

## 4. Applying the master theorem

Section 2's recurrence, $T(n) = 2\,T(n/2) + c_2$, matches `Recurrence relations`'s master theorem with $a=2, b=2, f(n) = c_2$, a constant. $n^{\log_b a} = n^{\log_2 2} = n$. A constant $f(n)$ satisfies case 1's condition (it is bounded by $n^{1-\varepsilon}$ for any $\varepsilon < 1$, eventually), so $T(n)$ is sandwiched between constant multiples of $n^{\log_b a} = n$ — $\Theta(n)$, matching section 3's exact closed form $2n-1$ directly, derived here in one step instead of a full unrolling and induction.

## 5. A recurrence the master theorem does not cover

`Recursion`'s Fibonacci function,

```c nocompile
int fib(int n)
{
    if (n == 0) return 0;
    if (n == 1) return 1;
    return fib(n - 1) + fib(n - 2);
}
```

read as a recurrence, is $T(n) = T(n-1) + T(n-2) + c$ — two recursive calls, but on arguments $n-1$ and $n-2$, not on $n/b$ for any fixed $b$. This does not match $T(n) = a\,T(n/b) + f(n)$'s shape at all, so `Recurrence relations`'s master theorem simply does not apply, exactly the situation its own wrong-model box warns about. A recursion tree still bounds it: each call spawns at most $2$ further calls, and the deepest path decreases $n$ by at least $1$ each step, so the tree has depth at most $n$; a tree of depth $n$ where each node has at most $2$ children has at most $2^n$ leaves, giving $T(n) = O(2^n)$ — a real bound, obtained without the master theorem, just from bounding the tree's shape directly. `Recursion`'s own measurements — $21{,}891$ calls at $n=20$, far fewer than $2^{20} \approx 10^6$ — show this bound is not tight, but it is still a correct upper bound, derived honestly from the recursion tree's structure rather than read off a table.

### Wrong model: Two recursive calls always means the same growth rate as $T(n) = 2T(n/2) + f(n)$

**What is actually true:** Section 2's `max_of` and `Recursion`'s `fib` both make exactly two recursive calls per non-base case, and their growth rates are nowhere near each other — $\Theta(n)$ against a genuinely exponential bound. What matters is not how many recursive calls a function makes, but how much smaller each call's argument is. `max_of` halves the size every call, so the recursion tree's depth is only $\log_2 n$; `fib` only decreases the size by $1$ or $2$, so the tree's depth is $n$ itself, giving vastly more room for the branching to multiply out before any base case is reached.

## 6. Accounting for space: only the current path is on the stack

`The stack and function calls` established that frames are pushed on call and popped on return, in strict last-in-first-out order — a call's frame does not disappear until it returns, and two calls' frames coexist on the stack only if one is still waiting on the other. This has a direct consequence for recursion: at any instant, the stack holds exactly the frames of calls still in progress along the *current* path from the outermost call down to whichever call is presently running — not every call that has ever been made.

```c file=depthcompare.c run
#include <stdio.h>

int sum_depth = 0, sum_max_depth = 0;

int sum(int *a, int n)
{
    sum_depth++;
    if (sum_depth > sum_max_depth)
        sum_max_depth = sum_depth;
    int result = (n == 0) ? 0 : a[n - 1] + sum(a, n - 1);
    sum_depth--;
    return result;
}

int mo_depth = 0, mo_max_depth = 0;

int max_of(int *a, int lo, int hi)
{
    mo_depth++;
    if (mo_depth > mo_max_depth)
        mo_max_depth = mo_depth;
    int result;
    if (lo == hi) {
        result = a[lo];
    } else {
        int mid = lo + (hi - lo) / 2;
        int left = max_of(a, lo, mid);
        int right = max_of(a, mid + 1, hi);
        result = left > right ? left : right;
    }
    mo_depth--;
    return result;
}

int main(void)
{
    int a[16];
    for (int i = 0; i < 16; i++)
        a[i] = i;

    sum(a, 16);
    printf("sum: n=16, max simultaneous depth = %d\n", sum_max_depth);

    max_of(a, 0, 15);
    printf("max_of: n=16, max simultaneous depth = %d\n", mo_max_depth);

    return 0;
}
```

```output
sum: n=16, max simultaneous depth = 17
max_of: n=16, max simultaneous depth = 5
```

`sum`'s recursive case makes its call *last*, after which nothing more happens in that frame until the call returns — so the chain `sum(a,16)`, `sum(a,15)`, ..., `sum(a,0)` is entirely nested, all $17$ frames alive simultaneously right before the base case returns, matching $n+1$. `max_of`, in contrast, calls `max_of(a, lo, mid)` and *waits for it to return completely* — popping every frame it created — before calling `max_of(a, mid+1, hi)` at all; the right half's frames are never on the stack at the same time as the left half's. Only one root-to-leaf path is ever live at once, and that path's length is the tree's height, $\log_2 16 + 1 = 5$ — matching the measurement exactly, even though `max_of` makes $2 \times 16 - 1 = 31$ calls in total over its entire run, section 3's count. Time counts every call that ever happens; space counts only how many are simultaneously unfinished, and section 6's two examples show these need not be the same order of growth at all.

### Wrong model: A function with more total calls uses more stack space

**What is actually true:** `max_of` on $16$ elements makes $31$ calls in total, nearly twice `sum`'s $17$, yet uses barely a quarter of the stack depth — $5$ against $17$. Total call count is a *time* measure, summing work across the entire run; stack depth is a *space* measure, counting only calls still waiting for a nested call to return at one instant. A recursion that fans out but resolves each branch fully before starting the next, as `max_of` does, keeps space tied to the tree's depth, however many total calls the tree contains; a recursion that nests every call inside the next before any of them return, as `sum` does, keeps space tied to $n$ itself, however few total calls are made. `Recursion`'s Fibonacci makes this starkest: exponentially many total calls, `Recursion`'s own measurements show, and yet at $n=20$ its maximum simultaneous depth is exactly $20$ — linear, not exponential — because the branching that produces so many total calls happens across calls that have already returned by the time later ones start, never all at once on the stack together.

## Exercises

1. Given `int f(int n) { if (n <= 1) return n; return f(n-1) + f(n-1); }`, write the recurrence $T(n)$ directly from the code, following section 1's method.

2. Solve exercise 1's recurrence by unrolling, following section 3's pattern for a branching recurrence, and verify your closed form by induction.

3. Using section 4, apply the master theorem to exercise 1's recurrence and confirm it agrees with your answer to exercise 2.

4. Explain, using section 6, why `sum`'s recursive case computing `a[n-1] + sum(a, n-1)` (the recursive call is not the last thing evaluated) still results in every frame being nested, rather than popped before the addition happens.

5. A function makes one recursive call on an argument of size $n - 1$, and does this call *before* any other work in that frame — the recursive case is `int r = f(n-1); return r + n;` rather than `return f(n-1) + n;`. Does this change the stack depth compared to section 6's `sum`? Explain.

6. Using section 5, explain why bounding a recursion tree's depth and branching factor directly (rather than looking for a matching master theorem case) was the right tool for `fib`, and state what specifically about `fib`'s recurrence ruled the master theorem out.

7. A recursive function makes two calls, each on $n/2$, and does $\Theta(n^2)$ work of its own combining them (rather than the constant work `max_of` does). Write the recurrence and, using the master theorem's case 3 from `Recurrence relations`, state the resulting time bound.

## Answers

1. $T(0) = c_1$, $T(1) = c_1$ (both base cases, constant work), $T(n) = 2\,T(n-1) + c_2$ for $n \ge 2$ — two recursive calls, both on $n-1$, plus constant work combining them.

2. Unrolling: $T(n) = 2T(n-1) + c_2 = 2(2T(n-2)+c_2) + c_2 = 4T(n-2) + 3c_2 = \cdots = 2^k T(n-k) + (2^k - 1)c_2$. Reaching the base case at $n - k = 1$, i.e. $k = n-1$: $T(n) = 2^{n-1}c_1 + (2^{n-1}-1)c_2$. Verify by induction: base case ($n=1$): $T(1) = c_1$; formula gives $2^0 c_1 + (2^0-1)c_2 = c_1 + 0 = c_1$. Equal. Inductive step: assume $T(k) = 2^{k-1}c_1 + (2^{k-1}-1)c_2$ for arbitrary $k \ge 1$; then $T(k+1) = 2T(k) + c_2 = 2^k c_1 + (2^k - 2)c_2 + c_2 = 2^k c_1 + (2^k-1)c_2$, matching the formula at $n=k+1$.

3. $a=2, b=1$ does not fit the master theorem's required $b > 1$ — the argument only decreases by a fixed amount ($n-1$), not by a fixed factor, exactly the same shape mismatch section 5 identified for `fib`. The master theorem does not apply here either, for the identical reason; exercise 2's exponential closed form, $2^{n-1}c_1 + (2^{n-1}-1)c_2 = \Theta(2^n)$, has to come from direct unrolling, not from the theorem.

4. A frame does not pop until its own `return` executes, regardless of what computation happens inside it first — `sum`'s frame for a given `n` is still fully on the stack, waiting, while `sum(a, n-1)` runs, because the addition `a[n-1] + sum(a, n-1)` cannot be computed until that call returns a value to add. Which operand is written first in the source has no bearing on this; the call is still nested inside the enclosing frame's unfinished work either way.

5. No change. What determines nesting is whether the frame containing the call has anything left to do (including simply returning a stored value) after the call returns, not whether the call happens to be written first or last in the source. `int r = f(n-1); return r + n;` still keeps the calling frame alive, waiting for `f(n-1)` to return before it can compute `r + n` and return itself — mechanically identical nesting to `return f(n-1) + n;`, just with the addition's operand named before use instead of written inline.

6. Section 5 found `fib`'s recurrence, $T(n) = T(n-1) + T(n-2) + c$, does not match $T(n) = a\,T(n/b) + f(n)$'s required shape at all — the arguments shrink by a fixed *amount* ($1$ or $2$), not a fixed *factor* ($n/b$ for some $b>1$), which is exactly what every case of the master theorem is built around comparing against $n^{\log_b a}$. With no valid $b$ to compute $\log_b a$ from, the theorem has nothing to apply to, so bounding the recursion tree's depth and per-node branching directly, as section 5 did, was the only avenue left.

7. $T(n) = 2\,T(n/2) + \Theta(n^2)$. $n^{\log_b a} = n^{\log_2 2} = n$, and $f(n) = n^2 = \Omega(n^{1+1})$ with $\varepsilon=1$; checking regularity, $a f(n/b) = 2(n/2)^2 = n^2/2 = 0.5 f(n)$ with $c'=0.5<1$, satisfying case 3. $T(n)$ is therefore sandwiched between constant multiples of $f(n)$ itself: $\Theta(n^2)$ — the combining work at the very top of the recursion already dominates everything the two halves contribute beneath it.
