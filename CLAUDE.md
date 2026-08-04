# CLAUDE.md

## What this repository is

A website teaching CS fundamentals to first-year students, some with zero programming
experience. The interface is a pannable, zoomable dependency graph; each node is a topic
with one article behind it.

`graph/graph.json` is the single source of truth for the node set, the edges, and the
scope of each article. Nothing else may define nodes or edges. Article frontmatter
mirrors it and is checked against it.

## Non-negotiable constraints

**Language is C throughout, including for early and abstract topics.** This is deliberate:
the point is to teach the memory model and the machine alongside algorithmic thinking.
Do not suggest Python, do not add Python examples, do not soften the on-ramp by
introducing pseudocode.

**All code is real, compilable C.** Never write pseudocode. Never write a snippet you have
not compiled. `scripts/test_c.py` runs every code block in every article; a change that
breaks it is not finished. Compile with `gcc -Wall -Wextra -std=c17` and treat warnings
as defects.

**Edges are strict prerequisites only.** `A -> B` means B cannot be honestly understood
without A. If a topic merely helps, mention it in prose ("this will make more sense once
you have also seen X") and do not add an edge. Never add or remove an edge as a side
effect of writing an article; edge changes are a separate, deliberate commit with a
justification in the message.

**An article may only use concepts from its transitive prerequisites**, plus the C fluency
floor declared in `graph.json` under `meta.fluency_floor`. If writing an article requires
something not available, that is a finding about the graph, not a licence to use it.
Stop and report it.

**Scope is fixed by `graph.json`.** Each node has a `scope` field. It states what the
article covers and, by exclusion, what it must not. Do not let an article absorb material
belonging to a neighbour.

## Voice and format

Dry, informative, second person. No "we". No filler, no restated definitions, no hedging
phrases ("it's worth noting", "essentially", "simply"). No emoji.

Length is whatever the concept requires. Do not pad and do not truncate to hit a number.

Metric units. LaTeX for all mathematics, `$...$` inline and `$$...$$` displayed, rendered
by KaTeX.

**Misconceptions** use a fixed two-part form, always in this order:

    ### Wrong model: <the incorrect belief, stated plainly>
    **What is actually true:** <correction, with a concrete artefact — output, byte
    values, an address — not a general warning>

**Article references**, forward or backward, name the other node's exact title in
backticks — `` `Exact Node Title` `` — and the build hyperlinks any backticked span that
matches a node title exactly to that node's article. Use the title verbatim; a
paraphrase or shortened form will silently fail to link.

**Diagrams** are separate SVG files in `content/<node-id>/figures/`, referenced by figure
number with a full caption. An article must remain coherent read as text alone; a figure
is additive, never load-bearing. If a figure is needed but not yet drawn, emit a
placeholder containing the complete specification of what it must show.

**Exercises** close every article, followed by an answers section. Exercises must be
answerable from the article alone unless the article explicitly hands the reader
something to look up.

`content/c-machine-model/index.md` is the style exemplar. Match it. Read it before
writing any new article.

## Code block conventions

Every C block carries attributes on the fence. `scripts/test_c.py` enforces them.

    ```c file=demo.c run
    ...full program...
    ```
    ```output
    ...exact expected stdout, {{ANY}} matches any text on that line...
    ```

Attributes:

- `file=NAME` — required for every C block; names the file the student saves
- `run` — compile and execute; if an `output` block follows, stdout must match
- `wrap=main` — the snippet is statements only; the harness wraps it in `main`
- `expect_fail` — the code is meant not to compile; the harness checks that it does not
- `nocompile` — excluded from testing; use only when the block is deliberately incomplete,
  and say so in the surrounding prose

Use `expect_fail` rather than `nocompile` for wrong-model examples wherever the error is
a compile error, so that the article's claim about the error is verified.

## Workflow

One node per session. Before writing:

1. Read `graph/graph.json` for the node's scope and its transitive prerequisites.
2. Read the articles for its direct prerequisites, to avoid re-explaining and to reuse
   established notation.
3. Read `content/c-machine-model/index.md` for voice.

After writing, run all three checks:

    python3 scripts/validate_graph.py
    python3 scripts/test_c.py content/<node-id>/index.md
    npm run build

Do not mark work complete while any of them fails.

## Things not to do

Do not generate several articles in one pass. Do not restructure the graph without being
asked. Do not add a JavaScript dependency without saying why in the commit message. Do
not compute the graph layout in the browser: layout is deterministic and computed at
build time so that node positions are stable between visits.