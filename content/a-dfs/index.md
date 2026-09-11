---
id: a-dfs
title: "Depth-first search"
track: algo
---

# Depth-first search

`Breadth-first search` explores a graph one full layer of distance at a time, using a queue to hold everything discovered but not yet processed. **Depth-first search** (DFS) takes the opposite approach: from the current vertex, plunge into one unvisited neighbour immediately, and keep plunging deeper until nothing unvisited remains reachable that way, only then backing up to try whatever was left unexplored along the way.

## 1. The recursive formulation

```c file=dfsrec.c run
#include <stdio.h>
#include <stdlib.h>

#define V 6

typedef struct node {
    int vertex;
    struct node *next;
} node_t;

node_t *adj[V];
int visited[V];

void add_edge(int u, int v)
{
    node_t *n1 = malloc(sizeof(node_t));
    n1->vertex = v;
    n1->next = adj[u];
    adj[u] = n1;
    node_t *n2 = malloc(sizeof(node_t));
    n2->vertex = u;
    n2->next = adj[v];
    adj[v] = n2;
}

void dfs_recursive(int v)
{
    visited[v] = 1;
    printf("%d ", v);
    for (node_t *n = adj[v]; n != NULL; n = n->next) {
        if (!visited[n->vertex])
            dfs_recursive(n->vertex);
    }
}

int main(void)
{
    for (int i = 0; i < V; i++) {
        adj[i] = NULL;
        visited[i] = 0;
    }
    add_edge(0, 1);
    add_edge(0, 2);
    add_edge(1, 3);
    add_edge(2, 4);
    add_edge(3, 5);

    dfs_recursive(0);
    printf("\n");

    return 0;
}
```

```output
0 2 4 1 3 5 
```

`dfs_recursive` visits `v`, then, for each of `v`'s neighbours in turn, recurses *immediately* if that neighbour is unvisited — `Recursion`'s trust-the-recursive-call habit doing all the work of "go as deep as possible before coming back." The call only returns to try `v`'s next neighbour once the entire branch through the previous one has been fully explored, which is exactly why `2`'s branch (`2`, then `4`) completes in full before `1`'s branch even starts, even though `1` is also a direct neighbour of `0`.

## 2. The explicit-stack formulation

```c file=dfsiter.c run
#include <stdio.h>
#include <stdlib.h>

#define V 6

typedef struct node {
    int vertex;
    struct node *next;
} node_t;

node_t *adj[V];

void add_edge(int u, int v)
{
    node_t *n1 = malloc(sizeof(node_t));
    n1->vertex = v;
    n1->next = adj[u];
    adj[u] = n1;
    node_t *n2 = malloc(sizeof(node_t));
    n2->vertex = u;
    n2->next = adj[v];
    adj[v] = n2;
}

void dfs_iterative(int source)
{
    int visited[V] = {0};
    int stack[V];
    int top = 0;
    stack[top++] = source;

    while (top > 0) {
        int v = stack[--top];
        if (visited[v])
            continue;
        visited[v] = 1;
        printf("%d ", v);
        for (node_t *n = adj[v]; n != NULL; n = n->next) {
            if (!visited[n->vertex])
                stack[top++] = n->vertex;
        }
    }
}

int main(void)
{
    for (int i = 0; i < V; i++)
        adj[i] = NULL;
    add_edge(0, 1);
    add_edge(0, 2);
    add_edge(1, 3);
    add_edge(2, 4);
    add_edge(3, 5);

    dfs_iterative(0);
    printf("\n");

    return 0;
}
```

```output
0 1 3 5 2 4 
```

`dfs_iterative` replaces the call stack `The stack and function calls` manages automatically with an explicit array, `stack`, and `top`, managed by hand — push every unvisited neighbour, then pop and process whichever was pushed *most recently*, `Stacks and queues`'s own last-in-first-out discipline. Note the visited check happens on **pop**, not on push, here — unlike a neighbour pushed onto the stack twice by two different visits before either is popped, which the `if (visited[v]) continue;` line catches and discards rather than reprocessing.

### Wrong model: The recursive and explicit-stack formulations always visit vertices in the identical order

**What is actually true:** Section 1 and section 2's own outputs are the direct counterexample: `0 2 4 1 3 5` against `0 1 3 5 2 4` — both fully valid depth-first traversals of the identical graph from the identical source, ending up with every vertex visited exactly once, but in a different order. The difference traces to how each formulation handles a vertex with more than one unvisited neighbour: recursion dives into the *first* neighbour in `adj[v]`'s list immediately, finishing that entire branch before trying the second; the stack pushes *both* neighbours first and then pops the *most recently pushed* one, which is the *last* neighbour in the list, not the first — reversing the order in which branches are explored relative to how they appear in the adjacency list. Both are still depth-first; "depth-first" constrains *how deep before how wide*, not which specific neighbour is tried first among several.

## 3. Discovery and finish

```c file=dfstimes.c run
#include <stdio.h>
#include <stdlib.h>

#define V 6

typedef struct node {
    int vertex;
    struct node *next;
} node_t;

node_t *adj[V];
int visited[V];
int disc[V], fin[V], timer_val = 0;

void add_edge(int u, int v)
{
    node_t *n1 = malloc(sizeof(node_t));
    n1->vertex = v;
    n1->next = adj[u];
    adj[u] = n1;
    node_t *n2 = malloc(sizeof(node_t));
    n2->vertex = u;
    n2->next = adj[v];
    adj[v] = n2;
}

void dfs_times(int v)
{
    visited[v] = 1;
    disc[v] = timer_val++;
    for (node_t *n = adj[v]; n != NULL; n = n->next)
        if (!visited[n->vertex])
            dfs_times(n->vertex);
    fin[v] = timer_val++;
}

int main(void)
{
    for (int i = 0; i < V; i++) {
        adj[i] = NULL;
        visited[i] = 0;
    }
    add_edge(0, 1);
    add_edge(0, 2);
    add_edge(1, 3);
    add_edge(2, 4);
    add_edge(3, 5);

    dfs_times(0);

    for (int i = 0; i < V; i++)
        printf("vertex %d: discovered=%d, finished=%d\n", i, disc[i], fin[i]);

    return 0;
}
```

```output
vertex 0: discovered=0, finished=11
vertex 1: discovered=5, finished=10
vertex 2: discovered=1, finished=4
vertex 3: discovered=6, finished=9
vertex 4: discovered=2, finished=3
vertex 5: discovered=7, finished=8
```

A vertex's **discovery time** is stamped the instant `dfs_times` first reaches it; its **finish time** is stamped only after every one of its neighbours has been fully explored — the very last thing that happens before the call returns. Every finish time is strictly greater than its own discovery time, and, critically, a vertex's discovery-to-finish interval either entirely contains or is entirely disjoint from any other vertex's interval — vertex `2`'s interval, `[1,4]`, entirely contains `4`'s, `[2,3]`, because `4` was reached, fully explored, and finished, all while `2`'s own call was still active, waiting on the stack. This nesting is not incidental — it is a direct readout of which calls were active (on `The stack and function calls`'s stack) at the same time as which others.

## 4. Visited marking

Section 1 and section 2's `visited` array serves the identical purpose `Breadth-first search`'s did: without it, a cycle in the graph would send DFS back around it forever, since nothing would ever stop a vertex from being "discovered" again through a different path. The check happens before recursing (section 1) or before processing a popped vertex (section 2), in both cases guaranteeing no vertex's own exploration — printing it, stamping its discovery time, recursing into its neighbours — ever runs more than once.

## 5. Connected components

```c file=components.c run
#include <stdio.h>
#include <stdlib.h>

#define V 6

typedef struct node {
    int vertex;
    struct node *next;
} node_t;

node_t *adj[V];
int visited[V];
int component[V];

void add_edge(int u, int v)
{
    node_t *n1 = malloc(sizeof(node_t));
    n1->vertex = v;
    n1->next = adj[u];
    adj[u] = n1;
    node_t *n2 = malloc(sizeof(node_t));
    n2->vertex = u;
    n2->next = adj[v];
    adj[v] = n2;
}

void dfs_label(int v, int label)
{
    visited[v] = 1;
    component[v] = label;
    for (node_t *n = adj[v]; n != NULL; n = n->next)
        if (!visited[n->vertex])
            dfs_label(n->vertex, label);
}

int main(void)
{
    for (int i = 0; i < V; i++) {
        adj[i] = NULL;
        visited[i] = 0;
    }
    add_edge(0, 1);
    add_edge(2, 3);
    add_edge(3, 4);

    int label = 0;
    for (int v = 0; v < V; v++) {
        if (!visited[v]) {
            dfs_label(v, label);
            label++;
        }
    }

    for (int i = 0; i < V; i++)
        printf("vertex %d: component %d\n", i, component[i]);
    printf("total components: %d\n", label);

    return 0;
}
```

```output
vertex 0: component 0
vertex 1: component 0
vertex 2: component 1
vertex 3: component 1
vertex 4: component 1
vertex 5: component 2
total components: 3
```

`Graphs and trees as mathematical objects`'s connected components — maximal sets of vertices with a path between every pair — fall directly out of a DFS that does not stop at one source: looping over every vertex, running a fresh DFS from any not-yet-visited one, and giving every vertex that DFS reaches the identical label, correctly separates the graph into its components, since a single connected DFS from any starting point inside a component reaches every other vertex in that same component and none outside it. Vertex `5`, connected to nothing, gets its own component, `2`, entirely by itself.

## 6. Cycle detection

```c file=cycledetect.c run
#include <stdio.h>
#include <stdlib.h>

#define V 4

typedef struct node {
    int vertex;
    struct node *next;
} node_t;

node_t *adj[V];
int visited[V];

void add_edge(int u, int v)
{
    node_t *n1 = malloc(sizeof(node_t));
    n1->vertex = v;
    n1->next = adj[u];
    adj[u] = n1;
    node_t *n2 = malloc(sizeof(node_t));
    n2->vertex = u;
    n2->next = adj[v];
    adj[v] = n2;
}

int has_cycle_util(int v, int parent)
{
    visited[v] = 1;
    for (node_t *n = adj[v]; n != NULL; n = n->next) {
        if (!visited[n->vertex]) {
            if (has_cycle_util(n->vertex, v))
                return 1;
        } else if (n->vertex != parent) {
            return 1;
        }
    }
    return 0;
}

int main(void)
{
    for (int i = 0; i < V; i++) {
        adj[i] = NULL;
        visited[i] = 0;
    }
    add_edge(0, 1);
    add_edge(1, 2);
    add_edge(2, 3);
    printf("path (no cycle): %s\n", has_cycle_util(0, -1) ? "cycle found" : "no cycle");

    for (int i = 0; i < V; i++) {
        adj[i] = NULL;
        visited[i] = 0;
    }
    add_edge(0, 1);
    add_edge(1, 2);
    add_edge(2, 3);
    add_edge(3, 0);
    printf("with back edge: %s\n", has_cycle_util(0, -1) ? "cycle found" : "no cycle");

    return 0;
}
```

```output
path (no cycle): no cycle
with back edge: cycle found
```

`has_cycle_util` passes `parent` — the vertex the current call was reached *from* — down through every recursive call, since an undirected edge back to that immediate parent is not a cycle, only the same edge read in reverse. Any *other* already-visited vertex reached from `v`, one that is not `v`'s own parent, means two different paths from the DFS's starting point reach the same vertex — exactly what a cycle is. The three-edge path `0-1-2-3` has no such extra connection; adding the edge `3-0` closes it into a loop, and `has_cycle_util` finds it the instant it tries to explore from `3` back to `0`, already visited and not `3`'s parent (`2` is).

## 7. $\Theta(V + E)$

Every vertex is visited exactly once, in both formulations — section 4's `visited` check guarantees this — contributing $\Theta(V)$ total. Each vertex's own adjacency list is walked exactly once, during that one visit, and `Representing graphs: adjacency matrix and adjacency list`'s section 5 already established that summing every vertex's own neighbour list touches every edge a bounded number of times — twice for an undirected graph, once for a directed one — contributing $\Theta(E)$ total. Together, $\Theta(V) + \Theta(E) = \Theta(V+E)$, the identical bound `Breadth-first search` reached, by the identical argument: one bounded amount of work per vertex, plus one bounded amount of work per edge, with nothing in either formulation costing more.

## 8. Recursion depth on large graphs

```c file=dfsdepth.c run
#include <stdio.h>
#include <stdlib.h>

#define V 1000

typedef struct node {
    int vertex;
    struct node *next;
} node_t;

node_t *adj[V];
int visited[V];
int depth = 0, max_depth = 0;

void add_edge(int u, int v)
{
    node_t *n1 = malloc(sizeof(node_t));
    n1->vertex = v;
    n1->next = adj[u];
    adj[u] = n1;
    node_t *n2 = malloc(sizeof(node_t));
    n2->vertex = u;
    n2->next = adj[v];
    adj[v] = n2;
}

void dfs_recursive(int v)
{
    depth++;
    if (depth > max_depth)
        max_depth = depth;
    visited[v] = 1;
    for (node_t *n = adj[v]; n != NULL; n = n->next)
        if (!visited[n->vertex])
            dfs_recursive(n->vertex);
    depth--;
}

int main(void)
{
    for (int i = 0; i < V; i++) {
        adj[i] = NULL;
        visited[i] = 0;
    }
    for (int i = 0; i < V - 1; i++)
        add_edge(i, i + 1);

    dfs_recursive(0);
    printf("path graph, %d vertices: max recursion depth = %d\n", V, max_depth);

    return 0;
}
```

```output
path graph, 1000 vertices: max recursion depth = 1000
```

A graph shaped like a long path — each vertex connected only to the next — forces the recursive formulation to nest one call inside another for every single vertex before any of them can return, exactly `Recursion`'s missing-base-case concern applied to a perfectly well-founded recursion that simply happens to run very deep: `V=1000` here produces `1000` simultaneously active stack frames, and a graph with millions of vertices arranged this way risks the identical stack overflow `Recursion`'s section 6 described, entirely from legitimate, correct recursive calls. The explicit-stack formulation from section 2 has no such risk — `stack` there is an ordinary array, sized to the graph directly and living whereever the program allocates it, not bound by the call stack's typically much smaller fixed size.

## 9. Contrast with BFS

`Breadth-first search` and DFS both visit every vertex reachable from a source exactly once, in $\Theta(V+E)$, using nearly identical code — the only structural difference is a queue in one and a stack in the other, FIFO against LIFO. That single difference in ordering changes what each is naturally suited for. BFS's layer-by-layer guarantee gives shortest paths in an unweighted graph for free, section 1's own point in `Breadth-first search`; DFS gives no such guarantee — section 1's own traversal reached `5` at "depth" `3` from the source along one specific path, with no promise that path was the shortest available. What DFS gives instead is exactly what sections 5 and 6 used: a natural way to fully explore one branch before considering another, which is what makes it the natural fit for questions about structure — components, cycles — rather than questions about distance.

## Exercises

1. Using section 1, explain why `dfs_recursive(0)`'s call to `dfs_recursive(2)` does not return until vertex `4` has been fully visited, referencing what "fully explored" means for a recursive call.

2. Using section 2's wrong-model box, explain what specifically would need to change about `dfs_iterative` to make it visit vertices in the identical order as `dfs_recursive`, without changing `dfs_recursive` at all.

3. Using section 3, explain why vertex `2`'s discovery-finish interval, `[1,4]`, entirely contains vertex `4`'s, `[2,3]`, rather than the two intervals overlapping partially.

4. Using section 5, explain why running `dfs_label` from an already-visited vertex (rather than skipping it, as the `for` loop's `if (!visited[v])` check does) would be redundant, not merely inefficient.

5. Using section 6, explain why checking `n->vertex != parent` is necessary — what would `has_cycle_util` incorrectly report on a simple two-vertex graph with a single edge `0-1` if that check were removed?

6. Using section 7, explain why examining a vertex's entire adjacency list once, even though it must be walked to find each individual neighbour, does not change the algorithm's overall order of growth from $\Theta(V+E)$ to something larger.

7. Using section 8 and section 9, describe a situation where the explicit-stack formulation is clearly the better choice over the recursive one, independent of which traversal order either produces.

## Answers

1. `dfs_recursive(2)`'s own body does not reach its closing `}` — and therefore does not return control back to `dfs_recursive(0)`'s loop — until every statement in its body has run, including its own `for` loop over `2`'s neighbours, which is exactly where the call to `dfs_recursive(4)` happens and has to complete first; "fully explored" means every line of that specific call's body, including every nested call it made, has finished.

2. `dfs_iterative` would need to push `v`'s neighbours in *reverse* adjacency-list order, so that the *first* neighbour in the list ends up pushed *last* and therefore popped *first* — the identical fix `Binary trees and traversals`'s iterative preorder used, pushing `right` before `left` so that `left` ends up on top. Nothing about `dfs_recursive` needs to change; it already processes the list front to back directly.

3. Vertex `4` is only reached *through* vertex `2` — `2`'s own call is still active, part way through its `for` loop, at the exact moment it calls `dfs_recursive(4)` (or the analogous stack operation). `4`'s entire discovery and finish, one complete nested call, happens strictly between `2`'s own discovery and `2`'s own finish, since `2`'s call cannot finish until every call it made, including the one for `4`, has already returned — two active calls on the same stack are always nested this way, never partially overlapping.

4. `visited[v]` being true already means `v`'s own discovery, labelling, and recursive exploration of all its neighbours have already happened in full, during whichever earlier call first reached it — running `dfs_label` on it again would repeat exactly that same work and assign exactly the same label it already has (or, worse, a different one, incorrectly relabelling an already-correctly-labelled vertex), not merely waste time recomputing an unchanged answer.

5. Without that check, encountering the already-visited vertex `0` while exploring from `1` (having arrived at `1` via the edge from `0`) would report a cycle — `0` is visited and is not being excluded as the parent — even though the only "back" connection is the same single edge `0-1` read in the opposite direction, not a genuine second path. `has_cycle_util(0, -1)` would incorrectly report `cycle found` on a graph that is just one edge, not even a loop.

6. Each vertex's adjacency list is walked exactly once in total, during that one vertex's single visit — not once per *other* vertex, and not repeatedly. Summing the total number of steps across every list walked, over the whole algorithm, counts each edge a small, fixed number of times (twice for undirected, once for directed), which is what makes the total $\Theta(E)$ rather than, say, $\Theta(V \times E)$, which would result only if every vertex's list were walked once for *every other* vertex instead of once for itself.

7. A graph with a very long path-like structure, or otherwise very deep before it branches, risks recursion depth in the thousands or more, per section 8 — a real danger of stack overflow purely from correct, well-founded recursive calls. In that specific situation, the explicit-stack formulation is the better choice, since its stack is an ordinary array with no dependence on the call stack's typically much smaller fixed size — independent of which traversal order either version happens to produce, since section 9 already established both are equally valid, equally $\Theta(V+E)$ depth-first traversals.
