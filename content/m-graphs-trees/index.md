---
id: m-graphs-trees
title: "Graphs and trees as mathematical objects"
track: math
---

# Graphs and trees as mathematical objects

`Sets and functions` gave you sets and the relations between their elements. A **graph** is nothing more than two sets used together in a specific way: a set of things, and a set of connections between pairs of them. Almost every structure this website builds from here on — a linked list, a tree, a network of dependencies — is a graph wearing a more specific costume, and the vocabulary in this article is what lets you name precisely which costume.

## 1. $G = (V, E)$

A graph is a pair $G = (V, E)$: $V$, a set of **vertices** (also called **nodes**), and $E$, a set of **edges**, where each edge connects two vertices. Nothing about a graph requires it to be drawn any particular way, or drawn at all — the pair of sets is the entire mathematical object; a picture is one convenient way to look at it, not the object itself.

## 2. Directed and undirected

In an **undirected** graph, an edge is a $2$-element subset of $V$: $\{u, v\}$, connecting $u$ and $v$ with no direction — $\{u,v\}$ and $\{v,u\}$ are the same set, hence the same edge, exactly as `Sets and functions` established that a set does not care about the order its elements are written in. In a **directed** graph, an edge is an ordered pair $(u,v) \in V \times V$, going *from* $u$ *to* $v$ specifically; $(u,v)$ and $(v,u)$ are different pairs, and a directed graph may contain one, both, or neither.

$$V = \{A, B, C\}, \quad E = \{\{A,B\}, \{B,C\}\}$$

is an undirected graph on three vertices with two edges — $A$ connected to $B$, $B$ connected to $C$, $A$ not directly connected to $C$.

## 3. Weighted graphs

A **weighted** graph attaches a number to every edge — a **weight**, formally a function $w : E \to \mathbb{R}$, assigning each edge its own weight. An unweighted graph is the special case where every edge is treated as having weight $1$, or equivalently, where only the presence or absence of a connection matters, not any cost or distance associated with it. A road network is a natural weighted graph — vertices are intersections, edges are roads, weights are distances or travel times; a graph of "who follows whom" is naturally unweighted — a follow either exists or does not.

## 4. Adjacency and degree

Two vertices are **adjacent** if an edge connects them directly: $u$ and $v$ are adjacent in an undirected graph exactly when $\{u,v\} \in E$. The **degree** of a vertex, $\deg(v)$, is the number of edges incident to it — for an undirected graph, the number of vertices adjacent to $v$.

$$\sum_{v \in V} \deg(v) = 2|E|$$

Every edge $\{u,v\}$ contributes exactly $1$ to $\deg(u)$ and exactly $1$ to $\deg(v)$ — two contributions per edge, to two different vertices' degree counts — so summing every vertex's degree counts every edge exactly twice. This identity, sometimes called the **handshake lemma**, holds for any undirected graph regardless of its shape, since it follows purely from each edge touching exactly two vertices.

### Wrong model: The sum of all degrees equals the number of edges

**What is actually true:** Section 4's identity is $\sum_v \deg(v) = 2|E|$, not $|E|$ — every edge is counted twice in the sum, once from each endpoint it touches, since $\deg(u)$ and $\deg(v)$ both individually include the edge $\{u,v\}$. A graph with three edges has a degree sum of $6$, not $3$; dividing the degree sum by $2$ recovers the edge count, and forgetting the division is the single most common arithmetic slip this identity invites.

A directed graph splits degree into two counts: **out-degree**, the number of edges leaving $v$, and **in-degree**, the number of edges entering $v$. Summing out-degrees over every vertex counts each edge once (at its source); summing in-degrees does the same (at its target); both sums equal $|E|$ exactly, with no factor of $2$, since a directed edge has only one source and one target rather than two interchangeable endpoints.

## 5. Walks, paths, and cycles

A **walk** is a sequence of vertices $v_0, v_1, \ldots, v_k$ where consecutive vertices are adjacent — $\{v_{i}, v_{i+1}\} \in E$ for every $i$ — with no restriction on repeating a vertex or an edge. A **path** is a walk in which every vertex appears at most once — no repeats at all. A **cycle** is a walk of length at least $3$ (for an undirected graph) that starts and ends at the same vertex, $v_0 = v_k$, with no other repeated vertex along the way.

### Wrong model: "Walk" and "path" are two words for the same idea

**What is actually true:** Every path is a walk, but not every walk is a path — a walk is allowed to revisit a vertex, or retrace an edge, and a path is specifically the stricter case where it does not. $A, B, C, B, D$ is a walk (each consecutive pair adjacent, matching the definition) but not a path, since $B$ appears twice; $A, B, C, D$, with no repeats, is both a walk and a path. Confusing the two matters concretely once distances are being computed: the *shortest* walk between two vertices is always a path, since removing a repeated loop from a walk can only shorten it, never lengthen it — but a general walk can be made arbitrarily long by looping, while a path cannot exceed $|V|$ vertices.

## 6. Connectivity and components

An undirected graph is **connected** if a path exists between every pair of vertices. A graph that is not connected breaks into **connected components** — maximal sets of vertices, each internally connected, with no path crossing between two different components. Every vertex belongs to exactly one component; a connected graph is the special case of exactly one component containing everything.

## 7. Acyclicity

A graph is **acyclic** if it contains no cycles at all — no walk of length $3$ or more returns to its own starting vertex without repeating an earlier one along the way. Acyclicity and connectivity are independent properties: a graph can be connected and cyclic (a single loop through every vertex and back), connected and acyclic, disconnected and cyclic (two separate loops), or disconnected and acyclic (isolated vertices with no edges at all).

## 8. Trees and $|E| = |V| - 1$

A **tree** is a graph that is both connected and acyclic. Both conditions are load-bearing: dropping connectivity gives a **forest**, a disjoint collection of trees, acyclic but not necessarily all one piece; dropping acyclicity gives a connected graph that may still contain a cycle.

### Wrong model: A tree is just a graph with no cycles

**What is actually true:** Acyclic alone describes a forest, which may consist of several separate pieces — an acyclic graph on six vertices split into two disconnected triangleless clumps of three is still acyclic, but it is not one tree, it is a forest of (at least) two trees. `Sets and functions`-style precision matters here: "tree" names a graph satisfying *both* clauses, connected *and* acyclic, simultaneously — not either one alone.

Claim: every tree on $n \ge 1$ vertices has exactly $n - 1$ edges.

A tree on a single vertex ($n=1$) has no edges — $0 = 1 - 1$. Building up from there, take any tree on $n \ge 2$ vertices and remove one vertex of degree $1$ (a tree always has at least one, since a cycle would be needed to avoid it, and a tree has none) together with its single incident edge. What remains is still connected — nothing else was reachable only through the removed vertex, since it had exactly one edge — and still acyclic, since removing a vertex cannot create a cycle — so it is a tree on $n - 1$ vertices. If that smaller tree has $(n-1) - 1$ edges, the original had one more: $(n-1-1) + 1 = n - 1$. Repeating this removal, one vertex at a time, down to the single-vertex base case, confirms the edge count at every size along the way: an $n$-vertex tree always has exactly $n-1$ edges.

## 9. Rooted trees: parent, child, leaf, depth, height

A **rooted tree** is a tree with one vertex designated the **root**. Designating a root gives every other vertex a well-defined direction "toward the root" or "away from it," which the vocabulary below is built on:

- The **parent** of a vertex $v$ (other than the root) is the neighbour of $v$ on the path from $v$ to the root.
- A **child** of $v$ is any vertex whose parent is $v$.
- A **leaf** is a vertex with no children.
- The **depth** of $v$ is the number of edges on the path from the root to $v$; the root itself has depth $0$.
- The **height** of the tree is the maximum depth of any vertex in it.

Every non-root vertex has exactly one parent — the tree's acyclicity guarantees exactly one path from any vertex back to the root, so "the neighbour on that path" is never ambiguous — while a vertex can have any number of children, including zero (a leaf).

## 10. Binary trees and node counts per level

A **binary tree** is a rooted tree in which every vertex has at most two children, conventionally distinguished as a **left child** and a **right child**. Call the set of all vertices at depth $d$ **level $d$**.

Level $0$ has at most $1$ vertex — the root alone. Every vertex at level $d$ contributes at most $2$ children to level $d+1$, since a binary tree caps each vertex at two children; so level $d+1$ has at most twice as many vertices as level $d$ has. Starting from at most $1$ at level $0$ and doubling at every subsequent level gives at most $2^d$ vertices at level $d$.

A binary tree of height $h$ has levels $0$ through $h$, each capped as above, so its total vertex count is at most $1 + 2 + 4 + \cdots + 2^h$. This sum is always exactly one short of the next power of two: $1 = 2 - 1$; $1 + 2 = 3 = 4 - 1$; $1 + 2 + 4 = 7 = 8 - 1$; at each step, adding the next power of two to "one less than that power" reaches exactly one less than *double* that power, which is the next one along — so the pattern continues unbroken, giving

$$1 + 2 + 4 + \cdots + 2^h = 2^{h+1} - 1.$$

A binary tree is called **full** at a given level if that level actually contains its maximum, $2^d$ vertices; a tree that is full at every level down to height $h$ has exactly $2^{h+1}-1$ vertices, the largest a binary tree of that height can hold.

## Exercises

1. Write $V$ and $E$ explicitly for an undirected graph on four vertices $A, B, C, D$ forming a single cycle $A \to B \to C \to D \to A$.

2. A graph has five vertices with degrees $2, 2, 2, 1, 1$. Using section 4's identity, compute the number of edges without being told it directly.

3. Give a walk from $A$ to $D$ in the graph $V=\{A,B,C,D\}$, $E=\{\{A,B\},\{B,C\},\{C,D\},\{B,D\}\}$ that is not a path, and a separate walk from $A$ to $D$ that is a path.

4. A graph has two connected components, one a triangle (three vertices, three edges, one cycle) and one a single isolated vertex. Is this graph acyclic? Is it a tree? Justify both answers using sections 6 through 8.

5. Using section 8's removal argument, find the edge count of a tree on $7$ vertices without applying the formula directly — describe the peeling-down process for at least the first two removals.

6. In a rooted tree, can a vertex have more than one parent? Justify your answer using section 9 and the acyclicity of trees from section 8.

7. A full binary tree has height $3$. Using section 10, compute the number of vertices at level $3$ and the tree's total vertex count.

## Answers

1. $V = \{A, B, C, D\}$, $E = \{\{A,B\}, \{B,C\}, \{C,D\}, \{D,A\}\}$ — four edges forming one cycle through all four vertices.

2. $\sum \deg(v) = 2+2+2+1+1 = 8$. By section 4's identity, $8 = 2|E|$, so $|E| = 4$.

3. Not a path: $A, B, C, B, D$ — walks from $A$ to $D$ via $B$, then $C$, then back through $B$ again before reaching $D$; $B$ repeats, so it is a walk but not a path. A path: $A, B, D$ — no repeated vertex, and both $\{A,B\}$ and $\{B,D\}$ are edges.

4. The graph is not acyclic: the triangle component, with vertices say $A,B,C$, contains the cycle $A,B,C,A$, so section 7's acyclicity condition fails. It is also not connected, since no path exists between the isolated vertex and any vertex of the triangle, so section 6's connectivity condition fails too. Either failure alone is enough to disqualify it as a tree; here both hold simultaneously.

5. Peel off any degree-$1$ vertex and its single edge, going from $7$ vertices to $6$; the remaining graph is still a tree, by section 8's argument. Peel another degree-$1$ vertex, going from $6$ to $5$. Continuing this all the way down to a single vertex ($0$ edges) takes exactly $6$ removals, one edge removed per step, giving $6$ edges total for the original $7$-vertex tree — matching $n - 1 = 7 - 1 = 6$ directly.

6. No. Section 9 defines a vertex's parent as its neighbour on *the* path from that vertex to the root, and section 8 already established that a tree's acyclicity guarantees exactly one path between any two vertices — if there were two different paths back to the root, tracing one out and the other back would trace out a cycle, which a tree by definition does not contain. With exactly one path to the root, the neighbour along it is uniquely determined, so every non-root vertex has exactly one parent, never more.

7. Level $3$ has at most $2^3 = 8$ vertices, and a full binary tree achieves that maximum at every level, so level $3$ has exactly $8$ vertices. Total vertex count is $2^{3+1} - 1 = 2^4 - 1 = 15$.
