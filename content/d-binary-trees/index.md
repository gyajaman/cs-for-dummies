---
id: d-binary-trees
title: "Binary trees and traversals"
track: ds
---

# Binary trees and traversals

`Graphs and trees as mathematical objects` defined a binary tree mathematically: a rooted tree where every vertex has at most two children. `Linked lists` gave you a self-referential struct with one link, `next`, and `Recursion` gave you the habit of trusting a call on a smaller instance of the same problem. A binary tree's node struct needs two links instead of one, and — unlike a list, which only ever gets smaller in one direction — every operation on it is written most naturally as a recursive call on each of those two links in turn.

## 1. The node struct

```c file=treenode.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct tree_node {
    int value;
    struct tree_node *left;
    struct tree_node *right;
} tree_node_t;

tree_node_t *make_node(int value, tree_node_t *left, tree_node_t *right)
{
    tree_node_t *n = malloc(sizeof(tree_node_t));
    n->value = value;
    n->left = left;
    n->right = right;
    return n;
}

int main(void)
{
    tree_node_t *leaf = make_node(1, NULL, NULL);
    printf("leaf value is %d\n", leaf->value);
    printf("leaf->left is %s\n", leaf->left == NULL ? "NULL" : "not NULL");
    free(leaf);
    return 0;
}
```

```output
leaf value is 1
leaf->left is NULL
```

`struct tree_node` is `Linked lists`'s self-referential pattern with a second pointer added — `left` and `right`, each `struct tree_node *`, self-referential for the identical reason `next` was: a pointer's size never depends on what it points to, so two pointers to the same struct type cost no more than two pointers to anything else. A **leaf** — `Graphs and trees as mathematical objects`'s own term for a childless vertex — is exactly a node whose `left` and `right` are both `NULL`, the same "nothing further" convention `Linked lists`' `NULL` `next` used for the end of a list.

## 2. The recursive structure

A binary tree is either empty — represented by a `NULL` pointer — or a node holding a value, together with a left subtree and a right subtree, each of which is *itself* a complete binary tree by the identical definition, possibly empty. This is `Recursion`'s base case and recursive case, read as a data structure rather than a function: `NULL` is the base case, a node with two smaller trees hanging off it is the recursive case, and every function in this article that operates on a tree mirrors that same two-case shape in its own control flow — check for `NULL` first, then handle a node by combining the results of the identical operation applied to `left` and to `right`.

## 3. Preorder, inorder, and postorder traversal

```c file=traversals.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct tree_node {
    int value;
    struct tree_node *left;
    struct tree_node *right;
} tree_node_t;

tree_node_t *make_node(int value, tree_node_t *left, tree_node_t *right)
{
    tree_node_t *n = malloc(sizeof(tree_node_t));
    n->value = value;
    n->left = left;
    n->right = right;
    return n;
}

void preorder(tree_node_t *root)
{
    if (root == NULL)
        return;
    printf("%d ", root->value);
    preorder(root->left);
    preorder(root->right);
}

void inorder(tree_node_t *root)
{
    if (root == NULL)
        return;
    inorder(root->left);
    printf("%d ", root->value);
    inorder(root->right);
}

void postorder(tree_node_t *root)
{
    if (root == NULL)
        return;
    postorder(root->left);
    postorder(root->right);
    printf("%d ", root->value);
}

int main(void)
{
    tree_node_t *root = make_node(4,
        make_node(2, make_node(1, NULL, NULL), make_node(3, NULL, NULL)),
        make_node(6, make_node(5, NULL, NULL), make_node(7, NULL, NULL)));

    printf("preorder:  ");
    preorder(root);
    printf("\n");

    printf("inorder:   ");
    inorder(root);
    printf("\n");

    printf("postorder: ");
    postorder(root);
    printf("\n");

    return 0;
}
```

```output
preorder:  4 2 1 3 6 5 7 
inorder:   1 2 3 4 5 6 7 
postorder: 1 3 2 5 7 6 4 
```

The tree built in `main` has `4` at the root, `2` and `6` as its children, and `1, 3, 5, 7` as the four leaves underneath them. All three functions share the identical base case, returning immediately on `NULL`, and differ only in *when* the current node's own value is printed relative to the two recursive calls: **preorder** prints the node before either subtree — root, then everything under `left`, then everything under `right` — giving `4 2 1 3 6 5 7`. **Inorder** prints between the two subtrees — everything under `left`, then the node, then everything under `right` — giving `1 2 3 4 5 6 7`, sorted order for this particular tree, because this tree happens to have every value in `left` less than its parent and every value in `right` greater, a property `Binary search trees` builds on directly. **Postorder** prints after both subtrees — everything under `left`, then everything under `right`, then the node — giving `1 3 2 5 7 6 4`, visiting a node only once both of its children are fully accounted for.

## 4. Recursive height and node count

```c file=heightcount.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct tree_node {
    int value;
    struct tree_node *left;
    struct tree_node *right;
} tree_node_t;

tree_node_t *make_node(int value, tree_node_t *left, tree_node_t *right)
{
    tree_node_t *n = malloc(sizeof(tree_node_t));
    n->value = value;
    n->left = left;
    n->right = right;
    return n;
}

int count_nodes(tree_node_t *root)
{
    if (root == NULL)
        return 0;
    return 1 + count_nodes(root->left) + count_nodes(root->right);
}

int height(tree_node_t *root)
{
    if (root == NULL)
        return -1;
    int lh = height(root->left);
    int rh = height(root->right);
    return 1 + (lh > rh ? lh : rh);
}

int main(void)
{
    tree_node_t *root = make_node(4,
        make_node(2, make_node(1, NULL, NULL), make_node(3, NULL, NULL)),
        make_node(6, make_node(5, NULL, NULL), make_node(7, NULL, NULL)));

    printf("count: %d\n", count_nodes(root));
    printf("height: %d\n", height(root));

    return 0;
}
```

```output
count: 7
height: 2
```

`count_nodes` trusts its own recursive calls exactly as `Recursion`'s section 2 described trusting `factorial(n-1)`: assume `count_nodes(root->left)` correctly counts the left subtree and `count_nodes(root->right)` correctly counts the right, and the total is simply those two counts plus `1` for the root itself — no need to trace the whole tree by hand to believe it. `height` uses `Graphs and trees as mathematical objects`'s own definition, the number of edges on the longest root-to-leaf path: an empty tree's height is defined as $-1$ specifically so that a single leaf, one level above an empty tree on both sides, comes out to $1 + \max(-1,-1) = 0$, matching a leaf having no edges below it. This tree's `7` nodes and height `2` match direct inspection: two full levels below the root, exactly `Graphs and trees as mathematical objects`'s section 10 bound of $2^{h+1}-1 = 2^3-1=7$ nodes for a full binary tree of height $2$.

## 5. Recursive destruction

```c file=freetree.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct tree_node {
    int value;
    struct tree_node *left;
    struct tree_node *right;
} tree_node_t;

tree_node_t *make_node(int value, tree_node_t *left, tree_node_t *right)
{
    tree_node_t *n = malloc(sizeof(tree_node_t));
    n->value = value;
    n->left = left;
    n->right = right;
    return n;
}

void free_tree(tree_node_t *root)
{
    if (root == NULL)
        return;
    free_tree(root->left);
    free_tree(root->right);
    free(root);
}

int main(void)
{
    tree_node_t *root = make_node(4,
        make_node(2, make_node(1, NULL, NULL), make_node(3, NULL, NULL)),
        make_node(6, make_node(5, NULL, NULL), make_node(7, NULL, NULL)));

    free_tree(root);
    printf("tree freed\n");
    return 0;
}
```

```output
tree freed
```

`free_tree` follows postorder's shape specifically: both children have to be freed *before* the current node, because `free_tree(root->left)` and `free_tree(root->right)` still need to read `root->left` and `root->right` to know where to recurse — freeing `root` itself first would leave those two reads reaching through memory already returned to the allocator, a use-after-free exactly as `The heap: malloc, free, and object lifetime` described for any pointer used after its own `free`, now for a tree instead of a single variable. `Linked lists`'s `free_list` saved `cur->next` into a separate variable before freeing `cur`, for the identical reason, with a loop instead of two recursive calls; a binary tree's two children make an iterative version of that same save-then-free discipline substantially more awkward, which section 6 returns to.

## 6. Iterative traversal with an explicit stack

```c file=iterativepreorder.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct tree_node {
    int value;
    struct tree_node *left;
    struct tree_node *right;
} tree_node_t;

tree_node_t *make_node(int value, tree_node_t *left, tree_node_t *right)
{
    tree_node_t *n = malloc(sizeof(tree_node_t));
    n->value = value;
    n->left = left;
    n->right = right;
    return n;
}

#define STACK_CAPACITY 100

void preorder_iterative(tree_node_t *root)
{
    tree_node_t *stack[STACK_CAPACITY];
    int top = 0;

    if (root != NULL)
        stack[top++] = root;

    while (top > 0) {
        tree_node_t *cur = stack[--top];
        printf("%d ", cur->value);

        if (cur->right != NULL)
            stack[top++] = cur->right;
        if (cur->left != NULL)
            stack[top++] = cur->left;
    }
}

int main(void)
{
    tree_node_t *root = make_node(4,
        make_node(2, make_node(1, NULL, NULL), make_node(3, NULL, NULL)),
        make_node(6, make_node(5, NULL, NULL), make_node(7, NULL, NULL)));

    printf("iterative preorder: ");
    preorder_iterative(root);
    printf("\n");

    return 0;
}
```

```output
iterative preorder: 4 2 1 3 6 5 7 
```

`stack`, a plain fixed-size array here with `top` tracking how many elements are currently in use, holds nodes still waiting to be visited — `stack[top++] = x` pushes, `stack[--top]` pops the most recently pushed node, last in, first out. Each iteration pops a node, prints it, then pushes its two children — `right` before `left`, specifically, so that `left` ends up on *top* and gets popped, and therefore printed, first, matching preorder's left-before-right order. Run against section 3's identical tree, the output matches section 3's recursive preorder exactly: `4 2 1 3 6 5 7`.

### Wrong model: Only recursive traversal can visit a tree in preorder, inorder, or postorder

**What is actually true:** Section 6 visits every node in the identical preorder sequence section 3's recursive version produced, using no recursion at all — an explicit stack, managed entirely by hand, does the job just as correctly. What differs is not *whether* the order can be produced iteratively, but *how much bookkeeping the programmer has to manage explicitly* versus how much `The stack and function calls`' own call stack manages automatically, which is exactly section 7's subject.

## 7. Why traversal is naturally recursive

`The stack and function calls` established that every function call pushes a frame recording where to resume once it returns; a recursive traversal function does not manage that bookkeeping itself at all — it is handed to the language's own call mechanism, automatically, one frame per node currently being visited along the current path. Section 6's iterative version has to build a parallel structure, `stack`, purely to replicate what those call frames would have tracked for free: which nodes are still owed a visit, and in what order to return to them. This is why the recursive versions in sections 3 through 5 read as barely more than "handle `NULL`, then combine the two subtrees' results" — the traversal order and the bookkeeping needed to achieve it are both supplied by ordinary function calls — while section 6's iterative preorder, doing the identical work, has to declare a stack, manage `top` by hand, and reason explicitly about push and pop order to get the same sequence out. A binary tree's two children are exactly the situation `Linked lists`' single-`next` traversal never faced: there is more than one direction to go, and a call stack's automatic, last-in-first-out bookkeeping is precisely what "go one way, fully finish it, then go the other way" needs.

## Exercises

1. Given the tree in section 3, what would `preorder`, `inorder`, and `postorder` each print if the tree had only a root node `4` with no children at all?

2. Using section 2, explain why `NULL` is described as the base case of a binary tree's own recursive definition, not merely a special value checked for convenience.

3. In section 4, explain why `height` is defined to return $-1$ for an empty tree rather than $0$, referencing what a single-leaf tree's height should come out to.

4. Trace `count_nodes` on a tree consisting of a root with a left child (itself a leaf) and no right child. What value does `count_nodes` return, and from which recursive calls does it come?

5. Using section 5, explain specifically what would go wrong if `free_tree`'s body were reordered to `free(root); free_tree(root->left); free_tree(root->right);`.

6. In section 6, why does the code push `cur->right` before `cur->left`, rather than the other way around?

7. Using section 7, explain in your own words what section 6's `stack` array is standing in for, and why a single-linked list traversal (`Linked lists`' own) never needed anything like it.

## Answers

1. All three would print just `4 ` — with no children, every recursive call in each function immediately hits the `root->left == NULL` and `root->right == NULL` base cases and returns without printing, leaving only the root's own print statement to run, and the relative position of that one print doesn't matter when there is nothing else to interleave it with.

2. Section 2 defines a binary tree as *either* empty *or* a node with two smaller binary trees attached — `NULL` is not an edge case bolted onto the "real" definition, it is one of the two cases the definition itself consists of, exactly the way `Recursion`'s base case is not an afterthought to the recursive case but an equal, required part of what makes the recursion well-founded and eventually terminate.

3. A single leaf has no edges beneath it at all, so `Graphs and trees as mathematical objects`'s definition of height as the longest root-to-leaf edge count gives it height `0`. `height`'s formula for a leaf is `1 + max(height(NULL), height(NULL))`; for this to evaluate to `0`, `height(NULL)` has to be $-1$, so that $1 + \max(-1,-1) = 1 + (-1) = 0$ comes out correctly.

4. `count_nodes` returns `2`. The root's own call computes `1 + count_nodes(left) + count_nodes(right)`. `count_nodes(right)` hits the `NULL` base case and returns `0`. `count_nodes(left)` recurses into the leaf, whose own two children are `NULL`, giving `1 + 0 + 0 = 1` for the leaf. The root's total is `1 + 1 + 0 = 2`.

5. `free(root);` would release `root`'s memory while `root->left` and `root->right` are still needed by the two calls immediately after — reading either field after `root` has been freed is a use-after-free, reading through a pointer to memory no longer owned; the two subtrees' addresses would either be lost or read as whatever leftover, possibly overwritten bytes happen to occupy `root`'s former storage.

6. Pushing `right` first places it deeper in the stack, underneath `left`; since the stack pops most-recently-pushed first, pushing `left` second means `left` sits on top and gets popped — and printed — before `right`, which is exactly preorder's required left-before-right order. Pushing them in the opposite order would print `right` before `left`, producing a different, incorrect sequence relative to section 3's recursive version.

7. Section 6's `stack` array stands in for the sequence of function-call frames a recursive traversal would have pushed and popped automatically, per `The stack and function calls` — a record of which nodes still need to be visited and in what order to come back to them. `Linked lists`' single-`next` traversal never needed anything like it because there was never more than one direction to go from any given node; with only one path forward, a single loop variable following `next` is enough bookkeeping on its own, with nothing to remember about a "second direction" to return to later.
