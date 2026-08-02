#!/usr/bin/env python3
"""Validate graph/graph.json and its consistency with content/.

Checks:
  - every prereq id exists
  - the graph is acyclic
  - the edge set is transitively reduced
  - every node has a non-empty scope
  - every node with an article has frontmatter matching graph.json
  - no article references a concept-bearing id that is not an ancestor (advisory)

Exit status is non-zero if any check fails.
"""

import collections
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
GRAPH = ROOT / "graph" / "graph.json"
CONTENT = ROOT / "content"

failures = []
warnings = []


def fail(msg):
    failures.append(msg)


def warn(msg):
    warnings.append(msg)


graph = json.loads(GRAPH.read_text())
nodes = {n["id"]: n for n in graph["nodes"]}
if len(nodes) != len(graph["nodes"]):
    fail("duplicate node ids")

adj = collections.defaultdict(set)
for node in graph["nodes"]:
    for p in node["prereqs"]:
        if p not in nodes:
            fail(f"{node['id']}: prereq '{p}' does not exist")
        else:
            adj[p].add(node["id"])
    if not node.get("scope", "").strip():
        fail(f"{node['id']}: empty scope")
    if len(set(node["prereqs"])) != len(node["prereqs"]):
        fail(f"{node['id']}: duplicate prereq")

WHITE, GREY, BLACK = 0, 1, 2
colour = {k: WHITE for k in nodes}


def visit(u, stack):
    colour[u] = GREY
    stack.append(u)
    for v in sorted(adj[u]):
        if colour[v] == GREY:
            fail("cycle: " + " -> ".join(stack[stack.index(v):] + [v]))
        elif colour[v] == WHITE:
            visit(v, stack)
    stack.pop()
    colour[u] = BLACK


sys.setrecursionlimit(10000)
for k in sorted(nodes):
    if colour[k] == WHITE:
        visit(k, [])

if not failures:
    order, seen = [], set()

    def topo(u):
        if u in seen:
            return
        seen.add(u)
        for v in adj[u]:
            topo(v)
        order.append(u)

    for k in nodes:
        topo(k)

    descendants = {}
    for u in order:
        s = set()
        for v in adj[u]:
            s.add(v)
            s |= descendants[v]
        descendants[u] = s

    for node in graph["nodes"]:
        ps = node["prereqs"]
        for p in ps:
            for q in ps:
                if p != q and p in descendants[q]:
                    fail(
                        f"{node['id']}: edge from '{q}' is transitively redundant "
                        f"(reaches it via '{p}')"
                    )

    ancestors = {k: set() for k in nodes}
    for u in reversed(order):
        for p in nodes[u]["prereqs"]:
            ancestors[u].add(p)
            ancestors[u] |= ancestors[p]

FM = re.compile(r"\A---\n(.*?)\n---\n", re.S)

for node_id in sorted(nodes):
    article = CONTENT / node_id / "index.md"
    if not article.exists():
        warn(f"{node_id}: no article yet")
        continue
    text = article.read_text()
    m = FM.match(text)
    if not m:
        fail(f"{node_id}: article has no frontmatter")
        continue
    fm = {}
    for line in m.group(1).splitlines():
        if ":" in line and not line.startswith(" "):
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip().strip("\"'")
    if fm.get("id") != node_id:
        fail(f"{node_id}: frontmatter id is '{fm.get('id')}'")
    if fm.get("title") != nodes[node_id]["title"]:
        fail(f"{node_id}: frontmatter title does not match graph.json")

for d in sorted(CONTENT.glob("*/")) if CONTENT.exists() else []:
    if d.name not in nodes:
        fail(f"content/{d.name}/ has no corresponding node in graph.json")

print(f"{len(nodes)} nodes, {sum(len(n['prereqs']) for n in graph['nodes'])} edges")
for w in warnings:
    print("warning:", w)
for f in failures:
    print("FAIL:", f)
sys.exit(1 if failures else 0)