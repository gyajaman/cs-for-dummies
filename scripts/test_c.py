#!/usr/bin/env python3
"""Compile, run, and verify every C code block in the given articles.

Fence attributes (see CLAUDE.md):
    file=NAME     required; the filename the student saves
    run           compile and execute
    wrap=main     snippet is statements only; wrap it in main()
    expect_fail   the block must fail to compile
    nocompile     skip entirely

An ```output block immediately following a `run` block is the expected stdout.
A line containing {{ANY}} matches any text at that position.

Usage: python3 scripts/test_c.py [paths...]   (default: all of content/)
"""

import pathlib
import re
import shlex
import subprocess
import sys
import tempfile

CC = ["gcc", "-Wall", "-Wextra", "-std=c17"]
ROOT = pathlib.Path(__file__).resolve().parent.parent

FENCE = re.compile(r"^```([^\n]*)\n(.*?)^```\s*$", re.M | re.S)

WRAPPER = """#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void)
{
%s
    return 0;
}
"""


def parse_attrs(info):
    parts = shlex.split(info)
    if not parts:
        return None, {}
    lang, attrs = parts[0], {}
    for p in parts[1:]:
        k, _, v = p.partition("=")
        attrs[k] = v if v else True
    return lang, attrs


def match_output(expected, actual):
    exp_lines = expected.rstrip("\n").split("\n")
    act_lines = actual.rstrip("\n").split("\n")
    if len(exp_lines) != len(act_lines):
        return False
    for e, a in zip(exp_lines, act_lines):
        if "{{ANY}}" not in e:
            if e != a:
                return False
            continue
        pattern = "".join(
            ".*" if seg == "{{ANY}}" else re.escape(seg)
            for seg in re.split(r"(\{\{ANY\}\})", e)
        )
        if not re.fullmatch(pattern, a):
            return False
    return True


def check_article(path):
    text = path.read_text()
    blocks = [(m.group(1).strip(), m.group(2)) for m in FENCE.finditer(text)]
    problems = []
    tested = 0

    for i, (info, body) in enumerate(blocks):
        lang, attrs = parse_attrs(info)
        if lang != "c":
            continue
        if attrs.get("nocompile"):
            continue
        name = attrs.get("file")
        if not isinstance(name, str):
            problems.append(f"block {i}: missing file= attribute")
            continue

        source = WRAPPER % body.rstrip("\n") if attrs.get("wrap") == "main" else body

        with tempfile.TemporaryDirectory() as td:
            d = pathlib.Path(td)
            src = d / name
            src.write_text(source)
            binp = d / "a.out"
            cp = subprocess.run(
                CC + [str(src), "-o", str(binp)],
                capture_output=True,
                text=True,
            )
            tested += 1

            if attrs.get("expect_fail"):
                if cp.returncode == 0:
                    problems.append(f"{name}: expected compilation to fail, it succeeded")
                continue

            if cp.returncode != 0:
                problems.append(f"{name}: compilation failed\n{cp.stderr.strip()}")
                continue
            if cp.stderr.strip():
                problems.append(f"{name}: warnings\n{cp.stderr.strip()}")
                continue

            if not attrs.get("run"):
                continue

            rp = subprocess.run([str(binp)], capture_output=True, text=True, timeout=10)
            if rp.returncode != 0:
                problems.append(f"{name}: exited with status {rp.returncode}")
                continue

            nxt = blocks[i + 1] if i + 1 < len(blocks) else None
            if nxt and parse_attrs(nxt[0])[0] == "output":
                if not match_output(nxt[1], rp.stdout):
                    problems.append(
                        f"{name}: output mismatch\n--- expected ---\n{nxt[1]}"
                        f"--- actual ---\n{rp.stdout}"
                    )

    return tested, problems


def main():
    args = sys.argv[1:]
    paths = (
        [pathlib.Path(a) for a in args]
        if args
        else sorted((ROOT / "content").glob("*/index.md"))
    )
    total, failed = 0, 0
    for p in paths:
        tested, problems = check_article(p)
        total += tested
        for prob in problems:
            failed += 1
            print(f"FAIL {p}: {prob}")
    print(f"{total} C blocks tested, {failed} problems")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()