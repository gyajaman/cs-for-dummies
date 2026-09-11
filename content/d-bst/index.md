---
id: d-bst
title: "Binary search trees"
track: ds
---

# Binary search trees

`Binary trees and traversals` gave you the node struct and the traversal vocabulary, with no constraint on which value goes where. A **binary search tree** (BST) is the identical struct with exactly one added rule, and that single rule is what turns a tree into a structure `Linear search and binary search`'s own halving strategy can run on directly — search, insert, and delete all in time bounded by the tree's height, not its size.

## 1. The ordering invariant

For every node in a binary search tree, every value in its left subtree is strictly less than the node's own value, and every value in its right subtree is strictly greater. This holds not just for a node's immediate children but for the *entire* subtree rooted at each child — the rule is recursive, matching `Binary trees and traversals`'s own recursive definition of what a tree is in the first place.

## 2. Search

```c file=bstsearch.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct tree_node {
    int value;
    struct tree_node *left;
    struct tree_node *right;
} tree_node_t;

tree_node_t *bst_search(tree_node_t *root, int target)
{
    if (root == NULL || root->value == target)
        return root;
    if (target < root->value)
        return bst_search(root->left, target);
    return bst_search(root->right, target);
}

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
    tree_node_t *root = make_node(8,
        make_node(3, make_node(1, NULL, NULL), make_node(6, NULL, NULL)),
        make_node(10, NULL, make_node(14, NULL, NULL)));

    printf("search 6: %s\n", bst_search(root, 6) ? "found" : "not found");
    printf("search 5: %s\n", bst_search(root, 5) ? "found" : "not found");

    return 0;
}
```

```output
search 6: found
search 5: not found
```

`bst_search` uses section 1's invariant directly: at any node, if `target` is smaller than the node's value, it can only possibly exist in the left subtree — the invariant guarantees the entire right subtree is strictly larger, so searching there would be pointless — and symmetrically for the right. This is `Linear search and binary search`'s halving idea, expressed as tree structure instead of an array bracket: every comparison discards one entire subtree from consideration, exactly as `a-searching`'s `lo`/`hi` bracket discarded half the remaining array.

## 3. Insert

```c file=bstinsert.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct tree_node {
    int value;
    struct tree_node *left;
    struct tree_node *right;
} tree_node_t;

tree_node_t *bst_insert(tree_node_t *root, int value)
{
    if (root == NULL) {
        tree_node_t *n = malloc(sizeof(tree_node_t));
        n->value = value;
        n->left = NULL;
        n->right = NULL;
        return n;
    }
    if (value < root->value)
        root->left = bst_insert(root->left, value);
    else if (value > root->value)
        root->right = bst_insert(root->right, value);
    return root;
}

void inorder(tree_node_t *root)
{
    if (root == NULL)
        return;
    inorder(root->left);
    printf("%d ", root->value);
    inorder(root->right);
}

int main(void)
{
    tree_node_t *root = NULL;
    int values[9] = {8, 3, 10, 1, 6, 14, 4, 7, 13};
    for (int i = 0; i < 9; i++)
        root = bst_insert(root, values[i]);

    inorder(root);
    printf("\n");

    return 0;
}
```

```output
1 3 4 6 7 8 10 13 14 
```

`bst_insert` follows the identical path `bst_search` would take looking for `value`, and, on reaching a `NULL` — a spot where `value` provably is not already present, by section 1's invariant — creates a new leaf there. The return value is what makes this work with plain recursion rather than needing the double-pointer trick `Linked lists` needed for `push_front`: `root->left = bst_insert(root->left, value);` reassigns the parent's own pointer to whatever the recursive call decided that subtree should now be — unchanged if it was already non-`NULL`, or the freshly made leaf if it was `NULL` — so every level of the recursion re-links itself on the way back up.

## 4. The three deletion cases

```c file=bstdelete.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct tree_node {
    int value;
    struct tree_node *left;
    struct tree_node *right;
} tree_node_t;

tree_node_t *bst_insert(tree_node_t *root, int value)
{
    if (root == NULL) {
        tree_node_t *n = malloc(sizeof(tree_node_t));
        n->value = value;
        n->left = NULL;
        n->right = NULL;
        return n;
    }
    if (value < root->value)
        root->left = bst_insert(root->left, value);
    else if (value > root->value)
        root->right = bst_insert(root->right, value);
    return root;
}

void inorder(tree_node_t *root)
{
    if (root == NULL)
        return;
    inorder(root->left);
    printf("%d ", root->value);
    inorder(root->right);
}

tree_node_t *find_min(tree_node_t *root)
{
    while (root->left != NULL)
        root = root->left;
    return root;
}

tree_node_t *bst_delete(tree_node_t *root, int value)
{
    if (root == NULL)
        return NULL;
    if (value < root->value) {
        root->left = bst_delete(root->left, value);
    } else if (value > root->value) {
        root->right = bst_delete(root->right, value);
    } else {
        if (root->left == NULL) {
            tree_node_t *replacement = root->right;
            free(root);
            return replacement;
        } else if (root->right == NULL) {
            tree_node_t *replacement = root->left;
            free(root);
            return replacement;
        } else {
            tree_node_t *successor = find_min(root->right);
            root->value = successor->value;
            root->right = bst_delete(root->right, successor->value);
        }
    }
    return root;
}

int main(void)
{
    tree_node_t *root = NULL;
    int values[9] = {8, 3, 10, 1, 6, 14, 4, 7, 13};
    for (int i = 0; i < 9; i++)
        root = bst_insert(root, values[i]);

    root = bst_delete(root, 1);
    printf("delete leaf (1):        ");
    inorder(root);
    printf("\n");

    root = bst_delete(root, 14);
    printf("delete one child (14):  ");
    inorder(root);
    printf("\n");

    root = bst_delete(root, 3);
    printf("delete two children (3): ");
    inorder(root);
    printf("\n");

    return 0;
}
```

```output
delete leaf (1):        3 4 6 7 8 10 13 14 
delete one child (14):  3 4 6 7 8 10 13 
delete two children (3): 4 6 7 8 10 13 
```

Deleting a value found at some node splits into three cases, handled by the three branches of `bst_delete`'s inner `if`. **A leaf** (`root->left == NULL` and `root->right == NULL`, both handled by the first branch, since `root->right` is `NULL` too): the node is simply freed, and `NULL` — the empty tree — takes its place; deleting `1`, a leaf, removes it with nothing further to reconnect. **One child**: the node is freed and the *one* existing child is promoted directly into the parent's link, skipping the deleted node entirely — deleting `14`, whose only child is `13`, leaves `13` linked in `14`'s former place. **Two children**: neither child can simply take the node's place without breaking section 1's invariant somewhere, so the deleted value is instead *replaced* by its **inorder successor** — the smallest value in its right subtree, found by `find_min`, which is guaranteed larger than everything in the left subtree and smaller than everything else in the right — and that successor's own (necessarily simpler) node is then deleted from its original spot. By this point `1` is already gone, so `3` has only its right subtree, `{4, 6, 7}`, left to supply a successor from; deleting `3` promotes `4`, the smallest value in that subtree, into `3`'s position.

## 5. Inorder traversal produces sorted order

Every `inorder` call above printed its tree's values in strictly increasing order — not a coincidence specific to this data, but a direct consequence of section 1. `Binary trees and traversals`'s `inorder` visits a node's entire left subtree, then the node itself, then its entire right subtree; section 1 guarantees everything in the left subtree is smaller and everything in the right is larger, so recursively printing left-root-right at every node necessarily prints every value in sorted order, with no comparison or rearrangement beyond the traversal itself.

## 6. Height as the cost determinant

Every operation in this article — `bst_search`, `bst_insert`, `bst_delete` — does a bounded amount of work per node visited, and visits only nodes along a single root-to-somewhere path, never branching to explore both children at once the way `count_nodes` in `Binary trees and traversals` had to. The number of nodes on any such path is bounded by the tree's height, plus one, so every operation here costs $O(h)$, where $h$ is the tree's current height — not $O(n)$, the total node count, unless the two happen to coincide.

## 7. Degeneration to a list on sorted input

```c file=bstdegenerate.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct tree_node {
    int value;
    struct tree_node *left;
    struct tree_node *right;
} tree_node_t;

tree_node_t *bst_insert(tree_node_t *root, int value)
{
    if (root == NULL) {
        tree_node_t *n = malloc(sizeof(tree_node_t));
        n->value = value;
        n->left = NULL;
        n->right = NULL;
        return n;
    }
    if (value < root->value)
        root->left = bst_insert(root->left, value);
    else if (value > root->value)
        root->right = bst_insert(root->right, value);
    return root;
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
    tree_node_t *sorted_root = NULL;
    for (int i = 1; i <= 7; i++)
        sorted_root = bst_insert(sorted_root, i);
    printf("inserted 1..7 in order: height = %d\n", height(sorted_root));

    tree_node_t *balanced_root = NULL;
    int balanced_order[7] = {4, 2, 6, 1, 3, 5, 7};
    for (int i = 0; i < 7; i++)
        balanced_root = bst_insert(balanced_root, balanced_order[i]);
    printf("inserted in balanced order: height = %d\n", height(balanced_root));

    return 0;
}
```

```output
inserted 1..7 in order: height = 6
inserted in balanced order: height = 2
```

Inserting `1, 2, 3, 4, 5, 6, 7` in that order builds a tree with height `6` — one less than the node count, `7` — because every value is larger than everything inserted before it, so `bst_insert`'s `value > root->value` branch fires every single time, all the way down: each new node becomes the *right* child of the previous one, producing a structure that is a binary tree only in name, functionally identical to `Linked lists`' singly linked list, one node dangling off the last. Inserting the identical seven values in a different order, `4, 2, 6, 1, 3, 5, 7`, produces height `2` — the minimum possible for seven nodes, `Graphs and trees as mathematical objects`'s section 10 bound of $2^{h+1}-1$ nodes for height $h$, met exactly.

### Wrong model: A binary search tree's height is always about $\log_2 n$

**What is actually true:** Section 7's own measurement is the counterexample: the identical seven values produce height $6$ under one insertion order and height $2$, $\log_2 7$ rounded down, under another. Section 6 already showed every operation costs $O(h)$ specifically, not $O(\log n)$ — $\log_2 n$ is only an accurate estimate of $h$ when the tree happens to be roughly balanced, which insertion order alone can make arbitrarily far from guaranteeing. A binary search tree built from already-sorted input gives every search, insert, and delete the exact same $O(n)$ cost `Linear search and binary search`'s own linear search has, with none of binary search's speed — the ordering invariant was preserved throughout, and the tree is still, technically, correct; it has simply degenerated into the shape that gives it none of its usual advantage.

## 8. Balancing, named but not implemented

Section 7's degeneration is exactly what a **self-balancing** binary search tree — AVL trees and red-black trees are the two most common — exists to prevent, by restructuring the tree during insertion and deletion to keep its height within a constant factor of $\log_2 n$ regardless of insertion order, guaranteeing every operation in this article stays $O(\log n)$ rather than risking section 7's $O(n)$ worst case. The restructuring itself, generally called **rotation**, is a separate technique with its own correctness argument; this article's `bst_insert` and `bst_delete` do no such restructuring, and can degenerate exactly as section 7 measured.

## Exercises

1. Using section 1, explain why a binary search tree can never contain the same value at two different nodes, given `bst_insert`'s specific handling of `value == root->value`.

2. Trace `bst_search` on the tree from section 2, searching for `14`. Which nodes are visited, in order, and why does the search never visit `3` or `1`?

3. Using section 3, explain why `bst_insert` needs to reassign `root->left` or `root->right` on the way back up from its recursive call, rather than simply modifying the tree in place with no return value.

4. Using section 4, explain why deleting a node with two children cannot simply promote its *left* child into its place, the way the one-child case promotes its single child.

5. Using section 5, explain why a *preorder* traversal of a binary search tree does not, in general, produce sorted order, referencing what preorder visits first at each node.

6. Using section 6 and section 7, explain why claiming a specific binary search tree operation "runs in $O(\log n)$ time" is only justified once something about how the tree was built is also known.

7. A student proposes fixing section 7's degeneration by always inserting new values as the root, pushing the previous root down as a child. Would this prevent degeneration? Briefly justify your answer using section 1.

## Answers

1. `bst_insert`'s two branches are `value < root->value` and `value > root->value` specifically, both strict inequalities; when `value == root->value`, neither branch's condition holds, so the function falls through to `return root;` with no new node ever created — inserting a value already present does nothing, leaving exactly one node holding that value.

2. `bst_search` visits `8` (root), then `10` (since `14 > 8`), then `14` (since `14 > 10`), where it matches and returns. `3` and `1` are never visited because the very first comparison, `14 > 8`, rules out the entire left subtree by section 1's invariant — everything under `3`, including `1`, is guaranteed smaller than `8` and therefore smaller than `14`.

3. `root->left = bst_insert(root->left, value)` is how the newly created leaf actually becomes part of the tree: the recursive call that reached a `NULL` returns a freshly allocated node, but nothing connects that new node to its parent unless the parent's own `left` or `right` field is explicitly set to point at it. A version with no return value would need `Pointers`' double-pointer trick instead, exactly as `Linked lists`' `push_front` needed `node_t **head` to modify the caller's variable directly.

4. Promoting the left child directly would discard the entire *right* subtree's connection to the tree — the right child, and everything under it, has no field pointing back to reattach it anywhere once the node between it and the rest of the tree is gone. The successor-replacement approach in section 4 avoids this by only ever removing a node with at most one child (the successor itself, found by `find_min`, has no left child by definition), never a node needing two separate subtrees reattached at once.

5. Preorder visits the node itself *before* either of its subtrees, so a preorder traversal prints the root's own value first, before anything smaller in its left subtree — the smallest overall value in the tree, which is on the far left, would generally print well after the root, not first, breaking sorted order immediately at the very first two values printed for almost any tree.

6. Section 6 established every operation's cost is $O(h)$, the tree's *current* height, not directly $O(\log n)$ — section 7 showed the identical node count can produce heights ranging from $\log_2 n$ (rounded down) to $n - 1$, entirely depending on the order values were inserted in. Claiming $O(\log n)$ specifically requires knowing the tree is reasonably balanced, either by construction (section 8's self-balancing trees) or by some fact about the insertion order that rules out section 7's degenerate case.

7. No. Making every new value the root, with the old root demoted to a child, still has to decide *which* child — left or right — based on comparing the new value against the old root, per section 1's invariant; inserting values in already-sorted order under this scheme would still push every previous root down the identical single side every time, producing the same one-sided, linear-height shape section 7 measured, just built top-down instead of bottom-up.
