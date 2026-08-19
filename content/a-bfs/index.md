---
id: a-bfs
title: "Breadth-first search"
track: algo
---

# Breadth-first search

`Representing graphs: adjacency matrix and adjacency list` gave you a way to store a graph; `Stacks and queues` gave you a queue, first in, first out. **Breadth-first search** (BFS) combines them into the standard way to explore a graph one layer of distance at a time, starting from a chosen source vertex — and, as a direct consequence of exploring in that specific order, it finds shortest paths in an unweighted graph for free.

## 1. Layer-by-layer exploration

Starting from a source vertex, BFS visits every vertex at distance $1$ (directly adjacent to the source) before visiting any vertex at distance $2$, every vertex at distance $2$ before any at distance $3$, and so on — expanding outward in complete rings, never skipping ahead to a farther vertex while a nearer one remains unvisited. This layering is not a side effect of some other goal; it is BFS's entire organising principle, and every other property in this article follows from it.

## 2. The queue

```c file=bfsqueue.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct qnode {
    int vertex;
    struct qnode *next;
} qnode_t;

typedef struct {
    qnode_t *head;
    qnode_t *tail;
} queue_t;

void queue_init(queue_t *q)
{
    q->head = NULL;
    q->tail = NULL;
}

void enqueue(queue_t *q, int vertex)
{
    qnode_t *n = malloc(sizeof(qnode_t));
    n->vertex = vertex;
    n->next = NULL;
    if (q->tail == NULL) {
        q->head = n;
        q->tail = n;
    } else {
        q->tail->next = n;
        q->tail = n;
    }
}

int dequeue(queue_t *q, int *out)
{
    if (q->head == NULL)
        return 0;
    qnode_t *old = q->head;
    *out = old->vertex;
    q->head = old->next;
    if (q->head == NULL)
        q->tail = NULL;
    free(old);
    return 1;
}

int main(void)
{
    queue_t q;
    queue_init(&q);
    enqueue(&q, 10);
    enqueue(&q, 20);
    enqueue(&q, 30);

    int v;
    while (dequeue(&q, &v))
        printf("%d ", v);
    printf("\n");

    return 0;
}
```

```output
10 20 30 
```

This is `Stacks and queues`'s own list-backed queue, holding vertex numbers instead of arbitrary values. The FIFO order this queue guarantees is exactly what layer-by-layer exploration needs: enqueue a vertex's unvisited neighbours as they are discovered, and the queue's first-in-first-out discipline guarantees every vertex at the current layer is dequeued, and its own neighbours discovered, before any vertex from the *next* layer is dequeued — the queue is not an implementation convenience, it is the mechanism that produces the layering in section 1 at all.

## 3. Visited marking

```c file=bfsvisited.c run
#include <stdio.h>
#include <stdlib.h>

#define V 5

typedef struct anode {
    int vertex;
    struct anode *next;
} anode_t;

anode_t *adj[V];

void add_edge(int u, int v)
{
    anode_t *n1 = malloc(sizeof(anode_t));
    n1->vertex = v;
    n1->next = adj[u];
    adj[u] = n1;

    anode_t *n2 = malloc(sizeof(anode_t));
    n2->vertex = u;
    n2->next = adj[v];
    adj[v] = n2;
}

typedef struct qnode {
    int vertex;
    struct qnode *next;
} qnode_t;

typedef struct {
    qnode_t *head;
    qnode_t *tail;
} queue_t;

void queue_init(queue_t *q) { q->head = NULL; q->tail = NULL; }

void enqueue(queue_t *q, int vertex)
{
    qnode_t *n = malloc(sizeof(qnode_t));
    n->vertex = vertex;
    n->next = NULL;
    if (q->tail == NULL) { q->head = n; q->tail = n; }
    else { q->tail->next = n; q->tail = n; }
}

int dequeue(queue_t *q, int *out)
{
    if (q->head == NULL) return 0;
    qnode_t *old = q->head;
    *out = old->vertex;
    q->head = old->next;
    if (q->head == NULL) q->tail = NULL;
    free(old);
    return 1;
}

void bfs(int source)
{
    int visited[V];
    for (int i = 0; i < V; i++)
        visited[i] = 0;

    queue_t q;
    queue_init(&q);
    visited[source] = 1;
    enqueue(&q, source);

    int cur;
    while (dequeue(&q, &cur)) {
        printf("visiting %d\n", cur);
        for (anode_t *n = adj[cur]; n != NULL; n = n->next) {
            if (!visited[n->vertex]) {
                visited[n->vertex] = 1;
                enqueue(&q, n->vertex);
            }
        }
    }
}

int main(void)
{
    for (int i = 0; i < V; i++)
        adj[i] = NULL;

    add_edge(0, 1);
    add_edge(0, 2);
    add_edge(1, 2);
    add_edge(1, 3);
    add_edge(2, 4);

    bfs(0);
    return 0;
}
```

```output
visiting 0
visiting 2
visiting 1
visiting 4
visiting 3
```

`visited` prevents a graph's cycles from turning BFS into an infinite loop: vertex `1` and vertex `2` are both adjacent to each other *and* to `0`, so without marking, `0`'s exploration would rediscover `1` and `2` over and over through every path connecting them. Every vertex is marked the moment it is first discovered, and the check `if (!visited[n->vertex])` before enqueuing anything guarantees each vertex enters the queue at most once — visited marking is not a performance nicety layered on top of a correct algorithm, it is what keeps BFS from revisiting the same vertex through a cycle indefinitely.

## 4. Shortest paths in unweighted graphs

```c file=bfsdist.c run
#include <stdio.h>
#include <stdlib.h>

#define V 5

typedef struct anode {
    int vertex;
    struct anode *next;
} anode_t;

anode_t *adj[V];

void add_edge(int u, int v)
{
    anode_t *n1 = malloc(sizeof(anode_t));
    n1->vertex = v;
    n1->next = adj[u];
    adj[u] = n1;

    anode_t *n2 = malloc(sizeof(anode_t));
    n2->vertex = u;
    n2->next = adj[v];
    adj[v] = n2;
}

typedef struct qnode {
    int vertex;
    struct qnode *next;
} qnode_t;

typedef struct {
    qnode_t *head;
    qnode_t *tail;
} queue_t;

void queue_init(queue_t *q) { q->head = NULL; q->tail = NULL; }

void enqueue(queue_t *q, int vertex)
{
    qnode_t *n = malloc(sizeof(qnode_t));
    n->vertex = vertex;
    n->next = NULL;
    if (q->tail == NULL) { q->head = n; q->tail = n; }
    else { q->tail->next = n; q->tail = n; }
}

int dequeue(queue_t *q, int *out)
{
    if (q->head == NULL) return 0;
    qnode_t *old = q->head;
    *out = old->vertex;
    q->head = old->next;
    if (q->head == NULL) q->tail = NULL;
    free(old);
    return 1;
}

void bfs(int source, int *dist)
{
    int visited[V];
    for (int i = 0; i < V; i++) {
        visited[i] = 0;
        dist[i] = -1;
    }

    queue_t q;
    queue_init(&q);
    visited[source] = 1;
    dist[source] = 0;
    enqueue(&q, source);

    int cur;
    while (dequeue(&q, &cur)) {
        for (anode_t *n = adj[cur]; n != NULL; n = n->next) {
            if (!visited[n->vertex]) {
                visited[n->vertex] = 1;
                dist[n->vertex] = dist[cur] + 1;
                enqueue(&q, n->vertex);
            }
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
    add_edge(2, 3);
    add_edge(3, 4);

    int dist[V];
    bfs(0, dist);

    for (int i = 0; i < V; i++)
        printf("vertex %d: distance %d\n", i, dist[i]);

    return 0;
}
```

```output
vertex 0: distance 0
vertex 1: distance 1
vertex 2: distance 1
vertex 3: distance 2
vertex 4: distance 3
```

`dist[n->vertex] = dist[cur] + 1` is correct precisely because of section 1's layering guarantee: when vertex `cur` is dequeued, every vertex closer to the source than `cur` has already been fully processed — `cur` itself was only ever discovered, and given its own `dist` value, by a vertex one layer nearer the source — so any *new* vertex `cur` discovers is necessarily one edge farther out than `cur`, and BFS is the first thing to ever reach it, since anything reachable in fewer edges would already have been discovered by an earlier, nearer layer. This is why BFS's discovery order corresponds exactly to shortest-path distance only for **unweighted** graphs — every edge contributes the identical cost, $1$, to a path's length, so "fewest edges" and "shortest path" are the same question.

## 5. Parent array and path reconstruction

```c file=bfspath.c run
#include <stdio.h>
#include <stdlib.h>

#define V 5

typedef struct anode {
    int vertex;
    struct anode *next;
} anode_t;

anode_t *adj[V];

void add_edge(int u, int v)
{
    anode_t *n1 = malloc(sizeof(anode_t));
    n1->vertex = v;
    n1->next = adj[u];
    adj[u] = n1;

    anode_t *n2 = malloc(sizeof(anode_t));
    n2->vertex = u;
    n2->next = adj[v];
    adj[v] = n2;
}

typedef struct qnode {
    int vertex;
    struct qnode *next;
} qnode_t;

typedef struct {
    qnode_t *head;
    qnode_t *tail;
} queue_t;

void queue_init(queue_t *q) { q->head = NULL; q->tail = NULL; }

void enqueue(queue_t *q, int vertex)
{
    qnode_t *n = malloc(sizeof(qnode_t));
    n->vertex = vertex;
    n->next = NULL;
    if (q->tail == NULL) { q->head = n; q->tail = n; }
    else { q->tail->next = n; q->tail = n; }
}

int dequeue(queue_t *q, int *out)
{
    if (q->head == NULL) return 0;
    qnode_t *old = q->head;
    *out = old->vertex;
    q->head = old->next;
    if (q->head == NULL) q->tail = NULL;
    free(old);
    return 1;
}

void bfs(int source, int *dist, int *parent)
{
    int visited[V];
    for (int i = 0; i < V; i++) {
        visited[i] = 0;
        dist[i] = -1;
        parent[i] = -1;
    }

    queue_t q;
    queue_init(&q);
    visited[source] = 1;
    dist[source] = 0;
    enqueue(&q, source);

    int cur;
    while (dequeue(&q, &cur)) {
        for (anode_t *n = adj[cur]; n != NULL; n = n->next) {
            if (!visited[n->vertex]) {
                visited[n->vertex] = 1;
                dist[n->vertex] = dist[cur] + 1;
                parent[n->vertex] = cur;
                enqueue(&q, n->vertex);
            }
        }
    }
}

void print_path(int target, int *parent)
{
    if (parent[target] != -1)
        print_path(parent[target], parent);
    printf("%d ", target);
}

int main(void)
{
    for (int i = 0; i < V; i++)
        adj[i] = NULL;

    add_edge(0, 1);
    add_edge(0, 2);
    add_edge(1, 3);
    add_edge(2, 3);
    add_edge(3, 4);

    int dist[V], parent[V];
    bfs(0, dist, parent);

    printf("path from 0 to 4: ");
    print_path(4, parent);
    printf("(length %d)\n", dist[4]);

    return 0;
}
```

```output
path from 0 to 4: 0 2 3 4 (length 3)
```

`parent[n->vertex] = cur` records, for every vertex, *which* vertex first discovered it — the vertex one layer nearer the source that BFS used to reach it. Because every vertex's parent is strictly nearer the source (by section 4's own layering argument), following `parent` backward from any target — `print_path`, itself a small recursive base-case-and-recursive-case function — always reaches the source in a finite number of steps, one per layer crossed, and the sequence of vertices visited along the way is a genuine shortest path: `dist[4]` reports its length, and the parent chain reports the path achieving it.

## 6. $\Theta(V + E)$

```c nocompile
while (dequeue(&q, &cur)) {
    for (anode_t *n = adj[cur]; n != NULL; n = n->next) {
        ...
    }
}
```

Every vertex is enqueued at most once — section 3's `visited` check guarantees this — so the outer loop dequeues each vertex exactly once, contributing $\Theta(V)$ total across the whole run. Each vertex's inner loop walks its own adjacency list once, and `Representing graphs: adjacency matrix and adjacency list`'s section 5 already established that visiting every neighbour of every vertex, once each, touches every edge exactly twice for an undirected graph (once from each endpoint) or once for a directed graph — $\Theta(E)$ total, not $\Theta(V \times E)$ or anything larger, since no edge is ever examined from a vertex more than the one time that vertex is dequeued. Together, $\Theta(V) + \Theta(E) = \Theta(V+E)$: BFS visits every vertex once and inspects every edge a bounded number of times, with no step of the algorithm costing more than that.

## 7. Why vertices are marked on enqueue rather than dequeue

```c file=marktiming.c run
#include <stdio.h>
#include <stdlib.h>

#define V 4

typedef struct anode {
    int vertex;
    struct anode *next;
} anode_t;

anode_t *adj[V];

void add_edge(int u, int v)
{
    anode_t *n1 = malloc(sizeof(anode_t));
    n1->vertex = v;
    n1->next = adj[u];
    adj[u] = n1;
    anode_t *n2 = malloc(sizeof(anode_t));
    n2->vertex = u;
    n2->next = adj[v];
    adj[v] = n2;
}

typedef struct qnode {
    int vertex;
    struct qnode *next;
} qnode_t;

typedef struct { qnode_t *head, *tail; } queue_t;
void queue_init(queue_t *q) { q->head = NULL; q->tail = NULL; }
void enqueue(queue_t *q, int vertex, long *enq_count)
{
    (*enq_count)++;
    qnode_t *n = malloc(sizeof(qnode_t));
    n->vertex = vertex;
    n->next = NULL;
    if (q->tail == NULL) { q->head = n; q->tail = n; }
    else { q->tail->next = n; q->tail = n; }
}
int dequeue(queue_t *q, int *out)
{
    if (q->head == NULL) return 0;
    qnode_t *old = q->head;
    *out = old->vertex;
    q->head = old->next;
    if (q->head == NULL) q->tail = NULL;
    free(old);
    return 1;
}

long bfs_mark_on_enqueue(int source)
{
    int visited[V] = {0};
    long enq = 0;
    queue_t q;
    queue_init(&q);
    visited[source] = 1;
    enqueue(&q, source, &enq);
    int cur;
    while (dequeue(&q, &cur)) {
        for (anode_t *n = adj[cur]; n != NULL; n = n->next) {
            if (!visited[n->vertex]) {
                visited[n->vertex] = 1;
                enqueue(&q, n->vertex, &enq);
            }
        }
    }
    return enq;
}

long bfs_mark_on_dequeue(int source)
{
    int visited[V] = {0};
    long enq = 0;
    queue_t q;
    queue_init(&q);
    enqueue(&q, source, &enq);
    int cur;
    while (dequeue(&q, &cur)) {
        if (visited[cur])
            continue;
        visited[cur] = 1;
        for (anode_t *n = adj[cur]; n != NULL; n = n->next) {
            if (!visited[n->vertex])
                enqueue(&q, n->vertex, &enq);
        }
    }
    return enq;
}

int main(void)
{
    for (int i = 0; i < V; i++)
        adj[i] = NULL;
    add_edge(0, 1);
    add_edge(0, 2);
    add_edge(1, 3);
    add_edge(2, 3);

    printf("mark on enqueue: %ld total enqueue operations\n", bfs_mark_on_enqueue(0));
    printf("mark on dequeue: %ld total enqueue operations\n", bfs_mark_on_dequeue(0));

    return 0;
}
```

```output
mark on enqueue: 4 total enqueue operations
mark on dequeue: 5 total enqueue operations
```

Vertices `1` and `2` are both adjacent to `0` and both adjacent to `3` — a diamond shape. `bfs_mark_on_enqueue`, section 3's discipline, marks `3` visited the instant it is first discovered (while processing `1`), so when `2` is processed shortly after and also finds `3` among its neighbours, `visited[3]` is already true and `3` is never enqueued a second time: exactly `4` enqueues, one per vertex, matching section 6's $\Theta(V)$ claim precisely. `bfs_mark_on_dequeue` instead waits to mark a vertex until it is actually dequeued — so between `3` being discovered by `1` and `3` finally being dequeued, `2` is processed in between, finds `visited[3]` still false, and enqueues `3` a second time: `5` enqueues, one redundant. This does not change BFS's *asymptotic* cost — a vertex can be enqueued at most once per incoming edge either way, so the total is still bounded within a constant factor of $\Theta(V+E)$ — but it does real, measurable, avoidable work, and it means a vertex can sit in the queue multiple times simultaneously, which section 3's single-enqueue discipline rules out entirely.

### Wrong model: Marking on dequeue instead of enqueue is just a harmless stylistic choice

**What is actually true:** Section 7's measurement shows it is not free — it produces a genuinely redundant queue entry, confirmed directly, `5` enqueues instead of the minimum possible `4`. The two versions still land in the same $\Theta(V+E)$ complexity class, since duplicate enqueues of any one vertex are bounded by that vertex's own degree, which sums to $\Theta(E)$ across the whole graph either way — this is a real, avoidable constant-factor cost, not a difference in asymptotic order, and not "harmless" in the sense of costing nothing at all. Marking on enqueue is the version that actually achieves the tight bound sections 3 and 6 describe, with each vertex entering the queue exactly once; marking on dequeue reaches the same final answer, correctly, while doing detectably more work to get there.

## Exercises

1. Using section 1, explain why BFS could not correctly compute shortest-path distances if it explored vertices in an arbitrary order instead of strictly layer by layer.

2. In section 3, trace what would happen on the very first call to `bfs(0)` if the `visited[source] = 1;` line, right before the loop, were removed. Would the algorithm still terminate? Explain using section 3's own reasoning about cycles.

3. Using section 4, explain why BFS's discovery order gives shortest paths specifically for *unweighted* graphs, and why the same reasoning would fail if edges had different costs.

4. In section 5, why does `print_path` recurse on `parent[target]` before printing `target`, rather than the other way around?

5. Using section 6, explain why an adjacency *matrix* representation (rather than a list) would change BFS's cost to $\Theta(V^2)$ instead of $\Theta(V+E)$, referencing `Representing graphs: adjacency matrix and adjacency list`'s own space and time tradeoffs.

6. Using section 7, explain precisely why the duplicate enqueue of vertex `3` happens specifically because `1` and `2` are both processed *before* `3` is ever dequeued, rather than after.

7. A student claims mark-on-dequeue must be strictly worse, in the worst case, by a factor that grows without bound as the graph gets larger. Using section 7's wrong-model box, evaluate this claim.

## Answers

1. Section 1 established that `dist[cur] + 1` is only guaranteed correct because every vertex nearer the source has already been fully processed by the time `cur` is dequeued. Exploring out of layer order would risk assigning a new vertex a distance based on a `cur` that is not actually its nearest discoverer — some other, still-unprocessed vertex closer to the source might reach it in fewer edges, an assignment BFS's strict layering is specifically what rules out.

2. Without marking the source visited before the loop starts, the very first iteration would dequeue `0`, find its neighbours (including, say, `1` and `2`), and enqueue them — but `0` itself was never marked, so if `1` or `2` are also adjacent back to `0` (which they are, since these are undirected edges), `0` would be rediscovered and enqueued again, and this could repeat indefinitely around any cycle passing back through `0` — the algorithm would not terminate on a graph containing a cycle through the source, exactly section 3's stated purpose for marking.

3. BFS discovers vertices in strict order of number of edges traversed, and in an unweighted graph every edge counts identically as one step, so "fewest edges" and "shortest total path length" are the same measurement. If edges had different weights, a path using more edges could still have a smaller total weight than a path using fewer, larger-weight edges — BFS's layering only ever tracks edge *count*, so it would have no way to prefer the lower-weight path over the shorter-edge-count one.

4. `print_path` needs to print vertices in order from the source to the target, but `parent` only lets it walk *backward*, from `target` toward the source — recursing first defers all the printing until the base case (the source, where `parent[target] == -1`) is reached, and then each recursive call's own print happens only after its own recursive call returns, which unwinds the printing back into forward, source-to-target order even though the walk that discovers it runs in the opposite direction.

5. `Representing graphs: adjacency matrix and adjacency list`'s section 5 established that finding all of a vertex's neighbours costs $\Theta(V)$ with a matrix — scanning an entire row regardless of the vertex's actual degree — against $\Theta(\deg(v))$ with a list, touching only real neighbours. Summed over all $V$ vertices, a matrix-backed BFS would cost $\Theta(V) \times V = \Theta(V^2)$ total for the neighbour-scanning alone, where the list-backed version sums to $\Theta(E)$ exactly as section 6 derived, since $\sum_v \deg(v) = \Theta(E)$ regardless of how sparse the graph is.

6. The duplicate enqueue happens because `1` and `2` are both still in the queue, not yet dequeued, when `3` is first discovered by `1` — with mark-on-dequeue, `visited[3]` is not set until `3` itself is dequeued, so `2`, processed sometime after `1` but still before `3` reaches the front of the queue, sees `3` as undiscovered and enqueues it again. If `1` and `2` had instead been dequeued only after `3` had *already* been dequeued and marked, no duplicate would occur — the specific ordering, both of `3`'s discoverers being processed while `3` still waits in the queue, is what creates the duplicate.

7. The claim does not hold up against section 7's own analysis: duplicate enqueues of any vertex are bounded by that vertex's degree, and the sum of every vertex's degree across the whole graph is $\Theta(E)$ regardless of $V$ — the worst-case gap between mark-on-dequeue and mark-on-enqueue stays within a constant factor of $\Theta(V+E)$ itself, not a factor that grows independently or without bound as the graph scales; it is real, wasted, measurable work, but it does not change which complexity class the algorithm falls into.
