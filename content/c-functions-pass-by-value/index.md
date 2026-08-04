---
id: c-functions-pass-by-value
title: "Functions, parameters, and pass-by-value"
track: c
---

# Functions, parameters, and pass-by-value

Every program so far has had exactly one function, `main`. This article is where that stops: you will write code once and call it from several places, and — the point the whole article is really building to — see exactly what does and does not happen to a variable when you hand it to a function. Recursion, a function calling itself, is deliberately left out; it depends on ideas from `The stack and function calls` this article has not earned yet.

## 1. Declaring and defining a function

```c file=square.c run
#include <stdio.h>

int square(int x)
{
    return x * x;
}

int main(void)
{
    int result = square(5);
    printf("square of 5 is %d\n", result);
    return 0;
}
```

```output
square of 5 is 25
```

`int square(int x)` is `square`'s **declaration**: its name, its return type, and the type of the one value it takes. The body in `{ }` that follows makes this also a **definition** — as with the local variables in `Variables, types, and memory addresses`, a declaration and its definition can appear in the same place. Unlike a local variable, a function's declaration and definition genuinely can be written apart, which section 6 puts to use.

## 2. Parameters and arguments

`square`'s `x` is a **parameter**: a name that exists only inside `square`'s definition, standing in for whatever value the function is given. `5`, in the call `square(5)`, is an **argument**: the actual value supplied at the call site. A function can take more than one:

```c file=add.c run
#include <stdio.h>

int add(int a, int b)
{
    return a + b;
}

int main(void)
{
    printf("%d\n", add(3, 4));
    printf("%d\n", add(10, -2));
    return 0;
}
```

```output
7
8
```

Each call supplies its own arguments, matched to `a` and `b` in order; the two calls to `add` share nothing between them.

## 3. Return values

`return x * x;` in section 1 does two things at once: it hands the value `x * x` back to whoever called the function, and it ends the function's execution immediately, right there — any code after a `return` that executes will not run on that call. `square`'s declared return type, `int`, is a promise: every path through the function must eventually `return` an `int`, or the compiler will not accept it. `square(5)` can be used anywhere an `int` value could be, which is why `int result = square(5);` and `printf("%d\n", add(3, 4))` both work directly.

## 4. void

`int main(void)` used `void` once already, in `Building and running a C program`: as the parameter list, it means "takes no arguments." `void` has a second use, as a return type, meaning "hands nothing back":

```c file=greet.c run
#include <stdio.h>

void greet(void)
{
    printf("hello from greet\n");
}

int main(void)
{
    greet();
    printf("back in main\n");
    return 0;
}
```

```output
hello from greet
back in main
```

`greet` does something — it prints a line — but produces no value for its caller to use. A `void` function may use a bare `return;`, with nothing after it, to end early; reaching the end of its body with no `return` at all is equally legal, since there was never a value it needed to produce.

## 5. Pass-by-value

```c file=change.c run
#include <stdio.h>

void try_to_change(int x)
{
    x = 100;
    printf("inside try_to_change, x is %d\n", x);
}

int main(void)
{
    int n = 5;
    try_to_change(n);
    printf("back in main, n is still %d\n", n);
    return 0;
}
```

```output
inside try_to_change, x is 100
back in main, n is still 5
```

`n` is `5` before the call and `5` after it, even though `try_to_change` assigned `100` to its parameter. This is what **pass-by-value** means: calling `try_to_change(n)` copies `n`'s current value into the parameter `x`, a completely separate piece of storage with its own address. Everything `try_to_change` does to `x` — assignments, arithmetic, anything — happens to that copy alone. There is no route back to `n` from inside the function; C simply does not hand a function the caller's variable, only a value.

### Wrong model: passing a variable to a function lets the function change it

**What is actually true:** a parameter is a local variable, brought into existence fresh for this call and initialised with a copy of whatever the argument evaluated to — the same "fresh storage on entry" rule every local variable follows, from `Variables, types, and memory addresses`. Assigning to a parameter only ever changes that local copy. Making a function actually change the caller's variable is possible in C, but it requires giving the function the variable's address rather than its value, which needs `Pointers`, not covered here.

## 6. Prototypes

```c file=prototype.c run
#include <stdio.h>

int cube(int x);

int main(void)
{
    printf("cube of 3 is %d\n", cube(3));
    return 0;
}

int cube(int x)
{
    return x * x * x;
}
```

```output
cube of 3 is 27
```

`int cube(int x);` above `main` is a **prototype**: a declaration with no body, just the signature and a semicolon. `main` calls `cube` before `cube`'s definition appears later in the file; without the prototype, the compiler would reach that call with no idea what `cube` takes or returns, and refuse to compile it. The prototype supplies exactly enough information — name, parameter types, return type — for the call to be checked, with the actual body supplied afterward. Prototypes become essential once a declaration and its definition are genuinely in different files, which `Multi-file programs, headers, and linking` covers properly.

## 7. Local scope

```c file=localscope.c run
#include <stdio.h>

void count_once(void)
{
    int calls = 0;
    calls = calls + 1;
    printf("calls is %d\n", calls);
}

int main(void)
{
    count_once();
    count_once();
    count_once();
    return 0;
}
```

```output
calls is 1
calls is 1
calls is 1
```

`calls` prints `1` all three times, not `1`, `2`, `3`. `count_once`'s body is a block like any other, and `Variables, types, and memory addresses` already established what that means: a variable declared inside a block gets fresh storage each time execution enters it. Every call to `count_once` is a fresh entry into its body, so `calls` is declared and initialised to `0` all over again on every call — there is no memory of the previous call anywhere for it to have accumulated in.

### Wrong model: a local variable remembers its value between calls

**What is actually true:** an ordinary local variable's storage does not outlive the block it was declared in, and a function's body ends, as a block, the moment that call returns. The next call is a completely new entry into that block, with new storage, however many times the function has been called before. Nothing about `count_once`'s third call knows the first two ever happened.

## Exercises

1. Distinguish "parameter" from "argument," using the `add` function in section 2 as your example.

2. Why does a function with return type `int` need a `return` statement on every path through its body, while a `void` function does not?

3. Predict the output of `try_to_change` in section 5 if its body were changed to `x = x + 1;` instead of `x = 100;`, given `n` is `5` in `main`.

4. What would you expect from the compiler if `cube`'s prototype in section 6 were removed entirely, with `main` still calling `cube` before `cube`'s definition later in the file?

5. In section 7, why does `calls` print `1` all three times instead of `1`, `2`, `3`?

6. A function `void set_five(int x) { x = 5; }` is called as `set_five(n);`. After the call, what is `n`? Explain in terms of what `x` actually is.

7. Two different functions each declare a local variable named `total`. Are these the same variable? Justify your answer using `Variables, types, and memory addresses`.

8. Why is recursion, a function calling itself, deliberately not covered in this article?

## Answers

1. In `add(int a, int b) { return a + b; }`, `a` and `b` are parameters — names that exist only inside `add`'s own definition, standing in for whatever is passed. In `add(3, 4)`, `3` and `4` are arguments — the actual values supplied at the call site, copied into `a` and `b`.

2. An `int` function promises to hand back an `int` value to its caller; a path that reaches the end of the function with nothing returned would break that promise, which the language does not permit. A `void` function promises nothing back at all, so reaching the end of its body with no `return` has nothing missing — there was never a value to produce.

3. `x` would become `6` inside `try_to_change`, printed as `inside try_to_change, x is 6`, and `main` would still print `back in main, n is still 5` — `x` is a separate copy from `n`, so no arithmetic performed on `x`, however it is written, ever reaches `n`.

4. Without a visible prototype or an earlier definition, the compiler reaches the call to `cube` in `main` with no idea what `cube`'s parameter or return types are, and refuses to compile — an error about an unknown or implicitly declared function, not something to shrug off as a warning.

5. `calls` is a local variable declared fresh inside `count_once`'s body. Every call is a fresh entry into that block, giving `calls` new storage initialised to `0` all over again; nothing carries over from a previous call, so it becomes `1` — never `2` or `3` — on every single call.

6. `n` is unchanged after the call. `x` inside `set_five` is a parameter, initialised with a copy of whatever was passed as the argument; assigning `5` to `x` only ever changes that local copy. `n` in the caller was never touched.

7. They are not the same variable, for the same reason two same-named variables in different non-nested blocks are not the same variable, as covered in `Variables, types, and memory addresses`: each function body is its own block, and each call creates fresh storage for its locals. Two functions happening to use the same local name is a naming coincidence with no shared storage implied.

8. Because recursion depends on understanding what actually happens, mechanically, when one function calls another while it is still running — whose storage is used, and what accumulates as calls stack up — which this article has not covered. `The stack and function calls` builds that picture first; `Recursion` is where it gets put to use.
