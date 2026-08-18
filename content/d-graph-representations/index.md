---
id: d-graph-representations
title: "Representing graphs: adjacency matrix and adjacency list"
track: ds
---

# Representing graphs: adjacency matrix and adjacency list

`Graphs and trees as mathematical objects` defined a graph as a pair of sets, $G=(V,E)$, with no commitment to how either set is actually stored in memory. This article gives two genuinely different answers, built entirely from structures already available — a fixed-size array and a linked list — and shows that the choice between them is a real engineering tradeoff, not a matter of taste.

## 1. The adjacency matrix

```c file=adjmatrix.c run
#include <stdio.h>

#define V 5

int main(void)
{
    int adj[V][V];
    for (int i = 0; i < V; i++)
        for (int j = 0; j < V; j++)
            adj[i][j] = 0;

    int edges[4][2] = { {0, 1}, {0, 2}, {1, 2}, {3, 4} };
    for (int e = 0; e < 4; e++) {
        int u = edges[e][0], v = edges[e][1];
        adj[u][v] = 1;
        adj[v][u] = 1;
    }

    for (int i = 0; i < V; i++) {
        for (int j = 0; j < V; j++)
            printf("%d ", adj[i][j]);
        printf("\n");
    }

    return 0;
}
```

```output
0 1 1 0 0 
1 0 1 0 0 
1 1 0 0 0 
0 0 0 0 1 
0 0 0 1 0 
```

An **adjacency matrix** is a $V \times V$ array, `adj`, one row and one column per vertex, where `adj[i][j]` is nonzero exactly when an edge connects vertex `i` to vertex `j` — a direct, two-dimensional encoding of `Graphs and trees as mathematical objects`'s edge set $E$, using the row-major layout `Arrays and contiguous memory` already established for any two-dimensional array. Building it from a list of edges, `edges`, means one assignment per edge (two, for an undirected graph — section 3 addresses why); the matrix's size is fixed by `V` alone, decided before a single edge is added, exactly as any fixed-size array's size is decided at compile time.

## 2. The adjacency list

```c file=adjlist.c run
#include <stdio.h>
#include <stdlib.h>

#define V 5

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

int main(void)
{
    for (int i = 0; i < V; i++)
        adj[i] = NULL;

    int edges[4][2] = { {0, 1}, {0, 2}, {1, 2}, {3, 4} };
    for (int e = 0; e < 4; e++)
        add_edge(edges[e][0], edges[e][1]);

    for (int i = 0; i < V; i++) {
        printf("%d:", i);
        for (node_t *cur = adj[i]; cur != NULL; cur = cur->next)
            printf(" %d", cur->vertex);
        printf("\n");
    }

    for (int i = 0; i < V; i++) {
        node_t *cur = adj[i];
        while (cur != NULL) {
            node_t *next = cur->next;
            free(cur);
            cur = next;
        }
    }

    return 0;
}
```

```output
0: 2 1
1: 2 0
2: 1 0
3: 4
4: 3
```

An **adjacency list** is an array of `V` linked lists, `adj[i]` holding exactly the vertices adjacent to `i` — the same self-referential `node_t` `Linked lists` built, reused here with `value` renamed `vertex` for clarity, one whole list per vertex rather than one list total. `add_edge` performs `Linked lists`'s `push_front` twice for an undirected edge — once into `adj[u]`'s list, recording that `v` is a neighbour of `u`, and once into `adj[v]`'s list, recording the reverse — since an undirected edge $\{u,v\}$ makes each of $u$ and $v$ a neighbour of the other. Each vertex's list only ever holds exactly the neighbours it actually has, printed above with `0` and `1` and `2` each listing the two others, and `3` and `4` listing only each other.

## 3. Directed, undirected, and weighted variants

Section 1 and section 2 both wrote each undirected edge twice — `adj[u][v]` *and* `adj[v][u]`; a new node in `adj[u]`'s list *and* in `adj[v]`'s. A **directed** graph writes it once: `adj[u][v] = 1;` alone for the matrix, one call to a one-directional `add_edge` for the list, recording that $u \to v$ without implying $v \to u$. Since section 4's edge-list construction and section 5's traversal work identically either way, the entire difference between representing a directed and an undirected graph is whether one insertion happens or two.

```c file=weighted.c run
#include <stdio.h>
#include <stdlib.h>

#define V 4
#define NO_EDGE 0

typedef struct wnode {
    int vertex;
    int weight;
    struct wnode *next;
} wnode_t;

wnode_t *adj[V];

void add_directed_edge(int u, int v, int weight)
{
    wnode_t *n = malloc(sizeof(wnode_t));
    n->vertex = v;
    n->weight = weight;
    n->next = adj[u];
    adj[u] = n;
}

int main(void)
{
    int matrix[V][V];
    for (int i = 0; i < V; i++)
        for (int j = 0; j < V; j++)
            matrix[i][j] = NO_EDGE;

    matrix[0][1] = 5;
    matrix[1][2] = 3;
    matrix[0][2] = 9;

    for (int i = 0; i < V; i++)
        adj[i] = NULL;
    add_directed_edge(0, 1, 5);
    add_directed_edge(1, 2, 3);
    add_directed_edge(0, 2, 9);

    printf("matrix weight from 0 to 2: %d\n", matrix[0][2]);
    printf("matrix weight from 2 to 0 (no edge): %d\n", matrix[2][0]);

    printf("list neighbours of 0:");
    for (wnode_t *cur = adj[0]; cur != NULL; cur = cur->next)
        printf(" (%d, weight %d)", cur->vertex, cur->weight);
    printf("\n");

    for (int i = 0; i < V; i++) {
        wnode_t *cur = adj[i];
        while (cur != NULL) {
            wnode_t *next = cur->next;
            free(cur);
            cur = next;
        }
    }

    return 0;
}
```

```output
matrix weight from 0 to 2: 9
matrix weight from 2 to 0 (no edge): 0
list neighbours of 0: (2, weight 9) (1, weight 5)
```

A **weighted** matrix stores the weight directly in the cell, `matrix[u][v] = 9` rather than `= 1`, with a chosen sentinel value — `0` here, `NO_EDGE` — standing in for "no edge," which requires that `0` never be a legitimate edge weight in whatever this matrix is modelling, or a different sentinel has to be picked. A weighted list adds one field, `weight`, to the node struct alongside `vertex`, exactly the way `Structs and memory layout` lets any struct grow a new member without disturbing the others; there is no sentinel problem here at all, since a missing edge is simply the absence of a node in the list, not a special value competing with real ones.

### Wrong model: A weighted adjacency matrix needs a special data type to represent "no edge"

**What is actually true:** Section 3's matrix uses an ordinary `int` and a chosen sentinel value, `0`, pressed into service to mean two different things by convention alone — nothing about the type itself distinguishes "the weight is zero" from "there is no edge here." The only requirement is that the sentinel not collide with a real weight the graph actually needs to represent; if edge weights of exactly `0` are meaningful, a different sentinel — a negative number, if weights are never negative, or a separate boolean matrix recording presence alongside a weight matrix — has to be chosen instead. Nothing about weighted matrices demands a new type; it demands picking a value the real data will never produce.

## 4. Construction from an edge list

Both section 1's matrix and section 2's list were built from the identical starting data: `edges`, a plain array of `(u, v)` pairs — the most direct textual encoding of $E$ from `Graphs and trees as mathematical objects`'s $G=(V,E)$. Converting that edge list into either representation is one pass over it, one or two writes per edge, and nothing about the pass itself depends on which target representation is being filled in — the loop in section 1 and the loop in section 2 differ only in what a single edge's insertion actually does, matrix assignment against linked-list insertion, not in how the edges are iterated.

## 5. Iterating over neighbours

Section 1's matrix answers "what are vertex `i`'s neighbours" by scanning an entire row: `for (int j = 0; j < V; j++) if (adj[i][j]) ...` checks every one of the `V` possible neighbours, whether or not vertex `i` actually has anywhere near that many. Section 2's list answers the identical question by walking exactly `adj[i]`'s own list: `for (node_t *cur = adj[i]; cur != NULL; cur = cur->next) ...` visits precisely vertex `i`'s actual neighbours, no more, no fewer — a direct instance of `Linked lists`'s general traversal pattern, one node per real neighbour rather than one check per possible one.

## 6. Space and time tradeoffs

An adjacency matrix always uses $\Theta(V^2)$ space — `int adj[V][V]` reserves every one of its $V^2$ cells whether the graph has one edge or is completely full, since `Arrays and contiguous memory`'s fixed-size arrays commit to their full declared size regardless of how much of it ends up used. An adjacency list uses $\Theta(V + E)$ space — one list-head slot per vertex, `V` of them, plus one node per edge-endpoint recorded (two nodes per undirected edge, one per directed edge), so a graph with few edges relative to $V^2$ costs proportionally little.

Checking whether a *specific* pair `(u, v)` is an edge is a single array access, `adj[u][v]`, on the matrix — the same constant-time index computation `Arrays and contiguous memory` established for any array — against a walk down `adj[u]`'s entire list on the adjacency list, checking every neighbour until `v` is found or the list ends, costing as much as vertex `u`'s degree in the worst case. Iterating over *all* of a vertex's neighbours, section 5's operation, reverses the comparison: the matrix always costs $\Theta(V)$, scanning every column regardless of how few neighbours actually exist, while the list costs $\Theta(\deg(v))$ exactly, `Graphs and trees as mathematical objects`'s own degree, touching nothing beyond the neighbours that are actually there.

### Wrong model: One representation is simply better than the other

**What is actually true:** Section 6's two costs run in opposite directions depending on the graph and the operation. A **dense** graph, with $E$ close to $V^2$, wastes little with a matrix — most cells are genuine edges anyway — and gains a true constant-time single-pair check the list cannot match without a full scan. A **sparse** graph, with $E$ much smaller than $V^2$ — common for graphs modelling real networks, where each vertex connects to only a handful of others regardless of how large $V$ grows — wastes enormous space on a matrix full of unused cells, and pays for it again every time section 5's neighbour iteration scans $V$ entries to find a handful of real ones. Choosing between them means asking how dense the graph actually is and which operation the algorithm using it actually needs most, not defaulting to either one out of habit.

## Exercises

1. Given the edge list `{(1,2), (2,3), (1,3)}` on `V = 4` vertices, draw the adjacency matrix directly, following section 1's convention.

2. Using section 2's `add_edge`, trace what happens to `adj[1]` and `adj[3]` after `add_edge(1, 3)` is called on an initially empty adjacency list — what does each list contain afterward?

3. Explain, using section 3, exactly what changes in `add_edge` to make the graph directed rather than undirected.

4. A graph has `V = 1000` vertices and `E = 2000` edges. Using section 6, estimate roughly how many cells an adjacency matrix would allocate, and roughly how many list nodes an adjacency list would allocate (for an undirected graph), and explain why the two numbers differ so drastically.

5. Using section 6, explain which representation is better suited to repeatedly asking "is there an edge directly from `u` to `v`," and which is better suited to repeatedly asking "list everything reachable from `u` in one step."

6. Why does section 3's weighted matrix require choosing a sentinel value, while section 3's weighted list does not need one at all?

7. A student claims adjacency lists are always more memory-efficient than adjacency matrices. Using section 6's wrong-model box, describe a specific graph (in terms of $V$ and $E$) where this claim is false.

## Answers

1. A $4 \times 4$ matrix with rows and columns indexed $0$–$3$: `adj[1][2]=adj[2][1]=1`, `adj[2][3]=adj[3][2]=1`, `adj[1][3]=adj[3][1]=1`, every other cell (including the entire row and column for vertex `0`, which has no edges) is `0`.

2. `add_edge(1, 3)` first pushes a new node holding `3` onto the front of `adj[1]` (so `adj[1]` now contains `3`), then pushes a new node holding `1` onto the front of `adj[3]` (so `adj[3]` now contains `1`) — each vertex's list records the other as a neighbour, matching the undirected edge $\{1,3\}$.

3. Only the second half of `add_edge` — the block that creates `n2` and pushes it onto `adj[v]` — is removed. What remains, creating `n1` and pushing it onto `adj[u]`, records that $u \to v$ without ever recording $v \to u$, exactly section 3's directed variant.

4. The matrix allocates $1000^2 = 1{,}000{,}000$ cells, regardless of the actual edge count. The undirected adjacency list allocates $2 \times 2000 = 4000$ nodes — two per edge, one per endpoint. The two numbers differ so drastically because the matrix's size is fixed by $V^2$ alone, while the list's size tracks $E$ directly; with $E$ so much smaller than $V^2$ here (a sparse graph), the list uses a tiny fraction of the matrix's space.

5. The matrix is better for repeated single-pair checks — `adj[u][v]` is one array access regardless of degree, where the list requires walking potentially all of `u`'s neighbours. The list is better for repeatedly listing everything reachable from `u` in one step — it touches exactly `u`'s actual neighbours and no more, where the matrix always scans all $V$ possible neighbours regardless of how few are real.

6. A matrix cell always holds *some* value — there is no way to leave a cell "absent" the way an array slot always exists once declared — so a chosen value has to double as "no edge here," which risks colliding with a genuine weight of that same value. A list simply has no node for a non-existent edge; absence is represented by the edge's node never being created at all, not by any value stored anywhere, so no sentinel is needed.

7. $V = 10$, $E = 45$ (a complete graph on $10$ vertices, every pair connected). The matrix uses $10^2 = 100$ cells. The undirected list uses $2 \times 45 = 90$ list nodes, each carrying a `vertex` field and a `next` pointer — plus $10$ head pointers — very likely more total bytes than $100$ plain `int` cells once per-node overhead is counted, since a dense graph like this one gives the list none of the sparsity advantage section 6 describes.
