---
id: c-building-and-running
title: "Building and running a C program"
track: c
---

# Building and running a C program

The previous article told you to install a compiler and come back. This is where you do the rest of the work: turn a text file into a running program, and read the machine's first complaint when the text is wrong. Nothing here adds a new claim about what memory or the CPU do — it is the concrete procedure that turns those ideas into something you can run yourself.

## 1. Installing a compiler

A compiler is a program. Installing one means putting an executable called `gcc`, or something that behaves like it, somewhere your shell can find it.

**Linux.** Most distributions install one straight from the package manager: `sudo apt install build-essential` on Debian and Ubuntu, `sudo dnf install gcc` on Fedora, `sudo pacman -S gcc` on Arch. Many developer-oriented Linux installations already have gcc present.

**macOS.** Install the Xcode Command Line Tools: run `xcode-select --install` in a terminal and follow the prompts. This gives you commands called `gcc` and `cc`, but they are actually Apple's build of a different compiler, clang, answering to the gcc name for compatibility. The commands in this book work unchanged either way; only the exact wording of warnings and errors will sometimes differ from a machine running the genuine GNU Compiler Collection. The real thing is installable through Homebrew, but nothing here requires it.

**Windows.** The most reliable route is to install a Linux environment through WSL (Windows Subsystem for Linux), then follow the Linux instructions inside it — search "install WSL" for Microsoft's current instructions, since the exact command has changed across Windows versions. Native alternatives such as MSYS2 also provide a working gcc, at the cost of a fussier setup.

Whatever the route, confirm it worked before going further:

```
gcc --version
```

If that prints a version number instead of an error, you have a compiler.

## 2. A minimal program

Save this as `hello.c`:

```c file=hello.c run
#include <stdio.h>

int main(void)
{
    printf("Hello, machine.\n");
    return 0;
}
```

```output
Hello, machine.
```

Every piece of that file is a fixed shape you will reuse constantly, so take each line on its own terms.

`#include <stdio.h>` pulls in the declarations for the standard input/output functions, including `printf`. A program that calls `printf` without this line does not compile; treat the line as a fixed cost of using it, explained properly in `Multi-file programs, headers, and linking`.

`int main(void)` is not a name you are choosing. It is the one name the toolchain is built to look for: when your program starts running, startup code supplied by the compiler gets control first, and its job is to call a function named exactly `main`. `int` is the type of the value `main` hands back when it finishes — section 7 covers what that value is for. `void` inside the parentheses means, explicitly, zero parameters. Leaving the parentheses empty, `int main()`, is legal C but means something different: an unspecified parameter list, a wrinkle inherited from decades of backward compatibility. Write `void`.

The braces mark where the function's body starts and ends.

`printf("Hello, machine.\n");` calls a function with one argument, a piece of text in double quotes. `\n` inside the text is a single character, newline, written with two characters because it has no key of its own. The semicolon ends the statement; C does not use line breaks to mean anything.

`return 0;` is covered in section 7.

## 3. printf, for now

`printf` can do far more than print fixed text — formatting numbers, addresses, and more, which is how the demonstration program in the previous article produced its output. All of that depends on ideas from `Variables, types, and memory addresses` and `Expressions, operators, and conditionals` that have not been covered yet. Until then, use `printf` for exactly one thing: writing literal text.

The one behaviour worth knowing now is that `printf` never adds a newline on its own. Save this as `lines.c`:

```c file=lines.c run
#include <stdio.h>

int main(void)
{
    printf("one");
    printf("two\n");
    printf("three\n");
    return 0;
}
```

```output
onetwo
three
```

The first two calls run together on one line because neither the end of the first call nor the start of the second inserted a break — only an explicit `\n` does that. Output appears in exactly the order the calls run, nothing more.

## 4. Compiling: source file to executable file

The file you have been editing, `hello.c`, is text. It means nothing to the CPU, and nothing about it changes what any running program does. Compiling turns it into something that does: an executable file, a file of instructions in the machine's own format.

```
gcc -Wall -Wextra -std=c17 -o hello hello.c
```

Every compile command in this book takes this shape. `-Wall -Wextra` ask the compiler to report constructs that are legal C but are probably mistakes — without them, gcc stays quiet about a lot of code that will misbehave. `-std=c17` pins the language version, so the rules do not shift under you as compilers update. `-o hello` names the output file `hello`; without it, gcc names the output `a.out` by default, a name left over from a much older convention. `hello.c` is the source file being compiled.

Run that command and a new file, `hello`, appears alongside `hello.c`. It is a binary file, bytes of machine instructions, not text, and it did not exist until you compiled. Edit `hello.c` again without recompiling, and `hello` does not change: it is a snapshot, produced once, of whatever `hello.c` contained at compile time.

## 5. Running: executable file to process

```
./hello
```

`./` means "in the current directory" — without it, your shell searches only the directories it is configured to search, which usually does not include the directory you are standing in.

Running the executable makes the operating system load its instructions into memory and start the fetch–decode–execute loop on them, exactly as the previous article described. The running instance is called a **process**. It is a third distinct thing, alongside the source file and the executable file:

- `hello.c` — text, edited by you, never executed directly.
- `hello` — a binary file on disk, produced by the compiler, unchanging until you recompile.
- the process — instructions from `hello` loaded into memory and actually running, with its own private memory, existing only while it runs.

Run `./hello` three times and you get three separate processes, one after another, each with its own copy of the program's memory, even though there is only ever one `hello` file on disk.

### Wrong model: the source file is the program

A natural shorthand is to say the `.c` file "is" the program, since it is the thing you write and read.

**What is actually true:** the source file is a description the compiler reads once, at compile time, to produce the executable. What the CPU executes is the executable's bytes, loaded into a process's memory. Editing the source file after compiling changes nothing about a process already running, and changes nothing about the executable file either, until you compile again. A program that has been running for an hour is completely unaffected by whatever you do to its source file in the meantime.

## 6. Reading a first compiler error

Save this as `broken.c` — it is missing a semicolon:

```c file=broken.c expect_fail
#include <stdio.h>

int main(void)
{
    printf("Hello, machine.\n")
    return 0;
}
```

Compiling it produces something close to this:

```output
broken.c: In function 'main':
broken.c:6:5: error: expected ';' before 'return'
    6 |     return 0;
      |     ^
```

The exact wording and column vary by compiler and version, but the shape is always the same: a filename, a line and column number, `error:`, and a description of what the parser expected but did not find. Notice the line it names is line 6, `return 0;`, not line 5, the line actually missing the semicolon. The compiler cannot know a statement is incomplete until it starts reading the next one and finds something that cannot follow; by then it has moved on. When an error names a line that already looks correct, check the line above it first.

Fix the missing semicolon and it compiles clean.

### Wrong model: if it compiles, it works

**What is actually true:** compiling checks only whether your text describes a legal sequence of C constructs — correct syntax, and, where the compiler can determine it, correct types. It checks nothing about whether the program does what you intended. A program that compiles with zero errors and zero warnings under `-Wall -Wextra -std=c17` can still print the wrong answer, corrupt its own memory, or loop forever; none of that is a compile-time property. Compiling successfully is necessary to have a program at all. It is not evidence the program is correct.

## 7. Exit status

Every process ends with a number, its **exit status**, and `return 0;` in `main` is what sets it. Save this as `status.c`:

```c file=status.c
#include <stdio.h>

int main(void)
{
    printf("about to exit with status 2\n");
    return 2;
}
```

Compiled and run, `./status` prints its line and then ends with exit status `2`, not `0`. On Linux and macOS the shell keeps the most recent exit status in a variable you can inspect immediately afterward:

```
./status
echo $?
```

```output
about to exit with status 2
2
```

By convention, `0` means the program completed without anything going wrong, and any nonzero value signals some kind of failure — which failure is up to the program to define. This is why every other program in this article ends `return 0;`: it is reporting success. Section 6's `broken.c` never got this far; a program that fails to compile has no exit status at all, because it never became a process.

## Exercises

1. Name the three artifacts involved in getting a C program to run, in the order they come into existence, and say what form each one takes.

2. `int main(void)` and `int main()` are both legal C under `-std=c17`. What is the difference, and which should you write?

3. Predict, line by line, the exact output of a program that calls `printf("A");`, then `printf("B\n");`, then `printf("C");`, then `printf("D\n");`. Then write it, compile it, and check.

4. You edit `hello.c`, save it, but forget to recompile, then run `./hello` again and see the old output. Explain what happened in terms of the source file, the executable file, and the process.

5. A classmate's program fails to compile with an error naming a line that looks completely correct. What should they check first, and why might the true mistake be on an earlier line?

6. A program compiles with `-Wall -Wextra -std=c17`, producing zero warnings, but prints the wrong answer when run. What has this told you about the program, and what has it not told you?

7. What exit status does a program have if it fails to compile? What exit status does `int main(void) { return 0; }` produce?

8. Explain why `gcc` on a Mac with only the Xcode Command Line Tools installed might report an error in slightly different wording than `gcc` on a Linux machine, given identical source code.

## Answers

1. The source file (text, written by you) first; the executable file (binary, produced by compiling) second; the process (the executable's instructions loaded into memory and running) third, and only while it runs.

2. `int main(void)` explicitly declares zero parameters. `int main()` declares an unspecified parameter list — legal, but not the same thing, and a holdover from older C. Write `void`.

3. `AB` on the first line, `CD` on the second. Neither `A` nor `C` is followed by a newline, so each runs into the call after it; `\n` is what actually starts a new line, not the boundary between separate `printf` calls.

4. `./hello` runs the executable file, not the source file. The executable was produced the last time you compiled, so it still contains instructions matching the old version of `hello.c`. Recompiling would overwrite it with a new executable reflecting the current source; running the old executable again just runs the same old instructions again.

5. Check the line above the one named in the error. The compiler cannot detect a missing token, such as a semicolon, until it starts parsing the following statement and finds something unexpected; the error is reported where the confusion surfaced, not necessarily where the mistake was made.

6. It has told you the program is syntactically legal C, and that the compiler found no additional constructs worth warning about. It has told you nothing about whether the program's logic is correct — that is a separate question compiling cannot answer.

7. A program that fails to compile never becomes a process and has no exit status at all. `int main(void) { return 0; }` produces exit status `0`.

8. The Xcode Command Line Tools' `gcc` is actually a build of clang answering to the gcc name. Both are standards-conformant C compilers and will agree on whether code compiles, but they are different pieces of software with different internals, so the exact wording, and sometimes the exact column, of a diagnostic message can differ between them.
