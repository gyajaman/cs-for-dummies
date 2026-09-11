---
id: d-heaps
title: "Binary heaps and priority queues"
track: ds
---

# Binary heaps and priority queues

`Binary trees and traversals` gave you a tree built from nodes and pointers, one allocation per element. A **binary heap** is a different kind of binary tree entirely: it never allocates a node, never stores a pointer, and lives in nothing more than an ordinary array — `Arrays and contiguous memory`'s own fixed-size block — because it insists on one extra structural property that makes pointers unnecessary.

## 1. The heap property

A **min-heap** is a binary tree in which every node's value is less than or equal to both of its children's values. This says nothing about left-to-right order the way `Binary search trees` does — a heap's left child can be larger or smaller than its right sibling, with no fixed rule between them — it only constrains each parent against its own children, all the way down. The one guarantee this buys is cheap and specific: the smallest value in the entire tree is always at the root, since every path down from the root can only ever increase or stay level, never decrease.

## 2. A complete binary tree stored in an array

A binary tree is **complete** if every level is entirely full except possibly the last, and the last level's nodes are filled left to right with no gaps. A complete tree's shape is entirely determined by how many nodes it has — there is exactly one complete-tree shape for any given node count — which is precisely what makes an array a sufficient representation: store the nodes in the order a level-by-level, left-to-right scan would visit them, and the shape itself needs no separate record, no `left` or `right` pointer anywhere.

```c file=heaparray.c run
#include <stdio.h>

int main(void)
{
    int heap[7] = {1, 3, 2, 7, 4, 5, 6};

    printf("root: %d\n", heap[0]);
    printf("root's children: %d, %d\n", heap[1], heap[2]);
    printf("heap[1]'s children: %d, %d\n", heap[3], heap[4]);

    return 0;
}
```

```output
root: 1
root's children: 3, 2
heap[1]'s children: 7, 4
```

No `left` or `right` pointer was read anywhere in that program — every relationship came from plain index arithmetic on a single flat array, `heap[1]` and `heap[2]` next to the root, `heap[3]` and `heap[4]` next to `heap[1]`. Section 3 makes that arithmetic explicit.

## 3. Parent and child index arithmetic

For a heap stored at indices $0$ through $\text{size}-1$:

$$\text{parent}(i) = \frac{i-1}{2} \quad\text{(integer division)}, \qquad \text{left}(i) = 2i+1, \qquad \text{right}(i) = 2i+2$$

`parent(i)`'s formula inverts `left` and `right`: a node at index $i$ is either `2×parent + 1` (a left child) or `2×parent + 2` (a right child) of whatever sits at `parent(i)`, and integer division by $2$ recovers `parent` correctly from either case, discarding the remainder that distinguishes them. Index `0`, the root, is the one index with no valid parent — `parent(0)` would compute `(0-1)/2`, which is not a meaningful index, so code that walks upward always checks `i > 0` first.

## 4. Sift up

```c file=siftup.c run
#include <stdio.h>

#define CAPACITY 100

typedef struct {
    int data[CAPACITY];
    int size;
} heap_t;

int parent_idx(int i) { return (i - 1) / 2; }

void sift_up(heap_t *h, int i)
{
    while (i > 0 && h->data[parent_idx(i)] > h->data[i]) {
        int temp = h->data[parent_idx(i)];
        h->data[parent_idx(i)] = h->data[i];
        h->data[i] = temp;
        i = parent_idx(i);
    }
}

int main(void)
{
    heap_t h;
    h.size = 6;
    int initial[6] = {1, 3, 2, 7, 4, 0};
    for (int i = 0; i < 6; i++)
        h.data[i] = initial[i];

    sift_up(&h, 5);

    for (int i = 0; i < h.size; i++)
        printf("%d ", h.data[i]);
    printf("\n");

    return 0;
}
```

```output
0 3 1 7 4 2 
```

`sift_up` fixes a heap that is correct everywhere except possibly along the path from index `i` up to the root — exactly the situation after appending one new value at the end. It compares the value at `i` against its parent; if the parent is larger, the two swap, and `i` becomes its own former parent's index, repeating the check one level higher. `0`, appended at index `5`, was smaller than its parent at index `2` (`2`), swapped up; `0` was still smaller than *its new* parent at index `0` (`1`), swapped up again; index `0` has no parent, so the loop's `i > 0` check stops it there. The array's root is now `0`, the smallest value, restoring section 1's property everywhere.

## 5. Insert

```c file=heapinsert.c run
#include <stdio.h>

#define CAPACITY 100

typedef struct {
    int data[CAPACITY];
    int size;
} heap_t;

void heap_init(heap_t *h) { h->size = 0; }

int parent_idx(int i) { return (i - 1) / 2; }

void sift_up(heap_t *h, int i)
{
    while (i > 0 && h->data[parent_idx(i)] > h->data[i]) {
        int temp = h->data[parent_idx(i)];
        h->data[parent_idx(i)] = h->data[i];
        h->data[i] = temp;
        i = parent_idx(i);
    }
}

void heap_insert(heap_t *h, int value)
{
    h->data[h->size] = value;
    h->size++;
    sift_up(h, h->size - 1);
}

int main(void)
{
    heap_t h;
    heap_init(&h);
    int values[8] = {5, 3, 8, 1, 9, 2, 7, 4};
    for (int i = 0; i < 8; i++)
        heap_insert(&h, values[i]);

    for (int i = 0; i < h.size; i++)
        printf("%d ", h.data[i]);
    printf("\n");

    return 0;
}
```

```output
1 3 2 4 9 8 7 5 
```

`heap_insert` places the new value at the first free slot, `data[size]` — the one position that keeps the tree complete, per section 2 — then calls `sift_up` to restore section 1's property, which can only have been broken along that new leaf's own path to the root. Since `Graphs and trees as mathematical objects`'s section 10 bounds a binary tree's height by $\log_2 n$, and `sift_up` does at most one comparison per level of height, insertion costs $O(\log n)$ in the worst case — never a full scan of the heap.

## 6. Sift down and extract-min

```c file=extractmin.c run
#include <stdio.h>

#define CAPACITY 100

typedef struct {
    int data[CAPACITY];
    int size;
} heap_t;

void heap_init(heap_t *h) { h->size = 0; }

int parent_idx(int i) { return (i - 1) / 2; }
int left_idx(int i) { return 2 * i + 1; }
int right_idx(int i) { return 2 * i + 2; }

void sift_up(heap_t *h, int i)
{
    while (i > 0 && h->data[parent_idx(i)] > h->data[i]) {
        int temp = h->data[parent_idx(i)];
        h->data[parent_idx(i)] = h->data[i];
        h->data[i] = temp;
        i = parent_idx(i);
    }
}

void heap_insert(heap_t *h, int value)
{
    h->data[h->size] = value;
    h->size++;
    sift_up(h, h->size - 1);
}

void sift_down(heap_t *h, int i)
{
    while (1) {
        int smallest = i;
        int l = left_idx(i), r = right_idx(i);
        if (l < h->size && h->data[l] < h->data[smallest])
            smallest = l;
        if (r < h->size && h->data[r] < h->data[smallest])
            smallest = r;
        if (smallest == i)
            break;
        int temp = h->data[i];
        h->data[i] = h->data[smallest];
        h->data[smallest] = temp;
        i = smallest;
    }
}

int heap_extract_min(heap_t *h, int *out)
{
    if (h->size == 0)
        return 0;
    *out = h->data[0];
    h->size--;
    h->data[0] = h->data[h->size];
    sift_down(h, 0);
    return 1;
}

int main(void)
{
    heap_t h;
    heap_init(&h);
    int values[8] = {5, 3, 8, 1, 9, 2, 7, 4};
    for (int i = 0; i < 8; i++)
        heap_insert(&h, values[i]);

    int out;
    while (heap_extract_min(&h, &out))
        printf("%d ", out);
    printf("\n");

    return 0;
}
```

```output
1 2 3 4 5 7 8 9 
```

`sift_down` is `sift_up`'s mirror image, moving *away* from the root instead of toward it: at each step, it compares the current node against both children and swaps with the *smaller* of the two if either beats it, continuing from the new position until neither child is smaller or a leaf is reached. `heap_extract_min` removes the root — the minimum, by section 1 — but cannot simply leave a hole there: moving the *last* element (index `size-1`) into the vacated root position keeps the tree complete, per section 2, at the cost of possibly breaking section 1's property at the root, which `sift_down` then repairs. Extracting all eight values in sequence returns them in fully sorted order — each extraction removes exactly the smallest value still present, by section 1's own guarantee, applied repeatedly.

## 7. Linear-time build-heap

```c file=buildheap.c run
#include <stdio.h>
#include <stdlib.h>

#define CAPACITY 2000

typedef struct {
    int data[CAPACITY];
    int size;
} heap_t;

long swaps = 0;

int parent_idx(int i) { return (i - 1) / 2; }
int left_idx(int i) { return 2 * i + 1; }
int right_idx(int i) { return 2 * i + 2; }

void sift_up(heap_t *h, int i)
{
    while (i > 0 && h->data[parent_idx(i)] > h->data[i]) {
        swaps++;
        int temp = h->data[parent_idx(i)];
        h->data[parent_idx(i)] = h->data[i];
        h->data[i] = temp;
        i = parent_idx(i);
    }
}

void heap_insert(heap_t *h, int value)
{
    h->data[h->size] = value;
    h->size++;
    sift_up(h, h->size - 1);
}

void sift_down(heap_t *h, int i)
{
    while (1) {
        int smallest = i;
        int l = left_idx(i), r = right_idx(i);
        if (l < h->size && h->data[l] < h->data[smallest])
            smallest = l;
        if (r < h->size && h->data[r] < h->data[smallest])
            smallest = r;
        if (smallest == i)
            break;
        swaps++;
        int temp = h->data[i];
        h->data[i] = h->data[smallest];
        h->data[smallest] = temp;
        i = smallest;
    }
}

void build_heap(heap_t *h, int *arr, int n)
{
    for (int i = 0; i < n; i++)
        h->data[i] = arr[i];
    h->size = n;
    for (int i = n / 2 - 1; i >= 0; i--)
        sift_down(h, i);
}

int main(void)
{
    for (int n = 128; n <= 1024; n *= 2) {
        int *arr = malloc(n * sizeof(*arr));
        for (int i = 0; i < n; i++)
            arr[i] = n - i;

        heap_t h1;
        swaps = 0;
        build_heap(&h1, arr, n);
        long build_swaps = swaps;

        heap_t h2;
        h2.size = 0;
        swaps = 0;
        for (int i = 0; i < n; i++)
            heap_insert(&h2, arr[i]);
        long insert_swaps = swaps;

        printf("n=%d: build_heap swaps=%ld, n inserts swaps=%ld\n", n, build_swaps, insert_swaps);
        free(arr);
    }
    return 0;
}
```

```output
n=128: build_heap swaps=122, n inserts swaps=649
n=256: build_heap swaps=249, n inserts swaps=1546
n=512: build_heap swaps=504, n inserts swaps=3595
n=1024: build_heap swaps=1015, n inserts swaps=8204
```

`build_heap` copies the input in, unordered, then calls `sift_down` starting from the *last non-leaf node*, `n/2 - 1`, working backward to the root — every leaf (roughly half the array) is skipped entirely, since a single node with no children already trivially satisfies section 1's property. Doubling `n` roughly doubles `build_heap`'s swap count — $122, 249, 504, 1015$, each about double the last — the signature of $\Theta(n)$, not $\Theta(n \log n)$: most nodes sit near the bottom of the tree, where `sift_down` has almost no distance left to travel, and only a few sit near the root, where it might travel the full height: `Graphs and trees as mathematical objects`'s section 10 halves the node count at every level going down, and this geometric shrinkage is exactly what keeps the total bounded by a constant multiple of $n$ rather than $n \log n$. The $n$-separate-inserts alternative, by contrast, grows visibly faster than linearly — $649, 1546, 3595, 8204$ — because every one of those $n$ insertions can cost up to the *current* tree's full height, and that height itself grows as more elements are added.

### Wrong model: Building a heap by inserting elements one at a time is the same cost as `build_heap`

**What is actually true:** Section 7's own measurements separate the two clearly — at $n=1024$, `build_heap` uses $1015$ swaps, close to $n$ itself, where $1024$ separate inserts use $8204$, roughly eight times as many. Both produce a valid heap; they are not the same algorithm wearing different code. `build_heap`'s advantage comes specifically from doing the expensive, near-root sifts on an array that is already almost entirely heap-shaped by the time they happen, where repeated single insertion pays something close to the full height cost on a large fraction of its calls, since the tree it is inserting into keeps growing throughout.

## 8. Heapsort

```c file=heapsort.c run
#include <stdio.h>

void sift_down_max(int *a, int n, int i)
{
    while (1) {
        int largest = i;
        int l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && a[l] > a[largest])
            largest = l;
        if (r < n && a[r] > a[largest])
            largest = r;
        if (largest == i)
            break;
        int temp = a[i];
        a[i] = a[largest];
        a[largest] = temp;
        i = largest;
    }
}

void heapsort(int *a, int n)
{
    for (int i = n / 2 - 1; i >= 0; i--)
        sift_down_max(a, n, i);

    for (int end = n - 1; end > 0; end--) {
        int temp = a[0];
        a[0] = a[end];
        a[end] = temp;
        sift_down_max(a, end, 0);
    }
}

int main(void)
{
    int a[8] = {5, 3, 8, 1, 9, 2, 7, 4};
    heapsort(a, 8);
    for (int i = 0; i < 8; i++)
        printf("%d ", a[i]);
    printf("\n");
    return 0;
}
```

```output
1 2 3 4 5 7 8 9 
```

Sorting an array in place, ascending, by repeatedly moving the *largest* remaining value to the *end* of the array is the natural fit for a **max-heap** — the mirror image of every definition in this article, with every comparison reversed: a parent is at least as large as both children, `sift_down_max` sinks a node past whichever child is *larger*, and the root is always the maximum rather than the minimum. **Heapsort** builds a max-heap in place with section 7's linear-time method, then repeatedly swaps the root (the current maximum) with the last unsorted element and shrinks the heap by one, restoring the max-heap property on the smaller remainder with a single `sift_down_max`. Every swap places one more value in its final sorted position, from the end of the array backward, using no memory beyond the input array itself and a constant number of index variables — in-place operation, achieved here through the heap structure rather than through adjacent comparisons.

## Exercises

1. Using section 3, compute `parent`, `left`, and `right` for index `5` in an array-backed heap, and verify `left(parent(5))` or `right(parent(5))` recovers `5`.

2. Using section 1, explain why a min-heap's *second-smallest* element is guaranteed to be one of the root's two children, but not necessarily the smaller of the two.

3. Trace `sift_up` on the array `{2, 5, 3, 8, 9, 4}` after appending `1` at index `6` (so the full array becomes `{2, 5, 3, 8, 9, 4, 1}`), giving the array's contents after each swap.

4. Using section 6, explain why `heap_extract_min` moves the *last* element into the root's vacated position, rather than, say, leaving the root empty and shifting everything else up by one index.

5. Using section 7, explain in your own words why skipping every leaf when building a heap is not just an optimisation but the majority of the array, for a complete binary tree on $n$ nodes.

6. A student claims `build_heap` and `heapsort`'s own initial max-heap-building loop are actually the identical function, just called on different comparison directions. Are they? Justify using section 7 and section 8's code.

7. Using section 8, explain precisely why heapsort needs no second array the way `Mergesort`'s `scratch` buffer did, referencing what `sift_down_max` actually operates on.

## Answers

1. `parent(5) = (5-1)/2 = 2`. `left(5) = 2×5+1 = 11`. `right(5) = 2×5+2 = 12`. `left(parent(5)) = left(2) = 2×2+1 = 5`, recovering `5` — index `5` is a left child of index `2`.

2. Section 1 only guarantees each parent is at most both children, saying nothing about how the root's two children compare to *each other* — the second-smallest overall value must be adjacent to the root somewhere in the ordering, but it could be either child, or, in a taller heap, still further down if both of the root's immediate children happen to be larger than some grandchild... no: it must specifically be one of the root's direct children, since anything smaller than both children would have already been moved above them by the heap property — but which of the two children it is depends entirely on the specific values, not a fixed rule.

3. Starting: `{2, 5, 3, 8, 9, 4, 1}`, sifting up from index `6`. `parent(6) = 2`, `data[2] = 3 > 1`: swap, array becomes `{2, 5, 1, 8, 9, 4, 3}`, `i` becomes `2`. `parent(2) = 0`, `data[0] = 2 > 1`: swap, array becomes `{1, 5, 2, 8, 9, 4, 3}`, `i` becomes `0`. `i = 0` stops the loop. Final array: `{1, 5, 2, 8, 9, 4, 3}`.

4. Moving the last element into the root keeps the array's used portion contiguous, indices `0` through the new, smaller `size - 1`, with no gap — exactly what section 2's completeness requires. Shifting every other element up by one index would also preserve completeness, but would cost $\Theta(n)$ per extraction (moving every remaining element), where moving just the last element into place and calling `sift_down` costs only $O(\log n)$.

5. In a complete binary tree on $n$ nodes, roughly half the nodes sit in the last level alone — every one of those is a leaf, with no children to compare against — and the level above it holds roughly a quarter of the remaining nodes, also mostly leaves relative to the whole. Summing "roughly half, plus a quarter, plus an eighth, ..." across every level already accounts for nearly the entire tree, so skipping the leaves specifically skips the majority of all nodes, not a small special case.

6. Not identical, though closely related: `build_heap` (section 7) calls `sift_down` starting from `n/2 - 1`, and heapsort's own first loop calls `sift_down_max` starting from the identical index, `n/2 - 1`, down to `0` — the same build-heap structure, applied to whichever comparison direction (`sift_down` for a min-heap, `sift_down_max` for a max-heap) the rest of the algorithm needs. The two are the identical *technique*, parameterised by comparison direction, not literally one function reused unchanged — `sift_down` and `sift_down_max` are separate functions with every comparison reversed, exactly as section 8 states.

7. `sift_down_max` only ever reads and writes within `a` itself — comparing `a[i]` against `a[l]` and `a[r]` and swapping in place — with no second array ever referenced. Every step of heapsort, from the initial build-heap loop through the repeated extract-and-shrink loop, operates purely on `a`'s own contiguous storage, using only the same constant handful of index variables `sift_down_max` already needed, unlike `Mergesort`'s `merge`, which had to write into a separate `scratch` array because comparing and overwriting `a` directly would destroy values one of the two runs still needed.
