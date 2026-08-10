---
id: d-linked-lists
title: "Linked lists"
track: ds
---

# Linked lists

`Arrays and contiguous memory` gave you one way to hold a sequence of values: one contiguous block, indexed by offset. `The heap: malloc, free, and object lifetime` gave you storage that can be requested and released one piece at a time, with no requirement that any two pieces sit next to each other in memory. A **linked list** builds a sequence out of exactly that — separate, individually allocated pieces, each one holding the address of the next — trading an array's contiguity for the ability to grow, shrink, and rearrange without ever moving existing data.

## 1. The self-referential node struct

```c file=nodetype.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct node {
    int value;
    struct node *next;
} node_t;

int main(void)
{
    node_t *n = malloc(sizeof(node_t));
    if (n == NULL)
        return 1;

    n->value = 10;
    n->next = NULL;

    printf("n->value is %d\n", n->value);
    printf("n->next is %s\n", n->next == NULL ? "NULL" : "not NULL");

    free(n);
    return 0;
}
```

```output
n->value is 10
n->next is NULL
```

`struct node` holds an `int` and a pointer to another `struct node` — a struct containing a pointer to its own type, which is what makes it **self-referential**. This compiles, where a member of type `struct node` directly (not `struct node *`) would not: `Structs and memory layout` fixed every struct's size at compile time from the sizes of its members, and a struct containing a full copy of itself would need to know its own size to compute its own size, an impossible requirement. A pointer sidesteps this entirely — `Pointers` already established that every pointer is a fixed number of bytes (`8` on the platforms this website targets) regardless of what type it points to, so `struct node *next` costs exactly `8` bytes whether it points at one more node or a whole chain of a million.

`n->value` and `n->next` use the **arrow operator**, `->`, which `Structs and memory layout` deferred: `n` here is a pointer to a struct, not a struct value itself, so the dot operator does not apply directly. `n->value` is defined to mean exactly `(*n).value` — dereference the pointer to get the struct, then access its member — and `->` exists purely so that this common combination does not have to be written with an extra layer of parentheses every time.

```c file=selfref.c expect_fail
struct broken {
    int value;
    struct broken next;
};
```

```output
selfref.c:3:19: error: field 'next' has incomplete type 'struct broken'
    3 |     struct broken next;
      |                   ^
```

### Wrong model: A node can hold the next node directly, without a pointer

**What is actually true:** Section 1's `expect_fail` block shows the compiler refusing exactly this. A `struct node` containing a `struct node next;` member would need `sizeof(struct node)` to include another full `struct node` inside it, which would itself need to include another, without end — there is no finite size that satisfies this. `struct node *next;` avoids the problem completely, because a pointer's size never depends on the size of what it points to, the same fact `The heap: malloc, free, and object lifetime` relied on when a pointer to a `5`-element array and a pointer to a `500`-element array turned out to be exactly the same size.

## 2. The head pointer and the empty list

A linked list, as a whole, is represented by a single variable: a `node_t *` pointing at the first node, conventionally called **head**. There is no separate "list" type — the list is whatever is reachable by following `next` pointers starting from `head`. An empty list is represented by `head == NULL`: no first node, hence nothing to point at.

```c file=emptylist.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct node {
    int value;
    struct node *next;
} node_t;

int main(void)
{
    node_t *head = NULL;
    printf("head is %s\n", head == NULL ? "NULL (empty list)" : "not NULL");
    return 0;
}
```

```output
head is NULL (empty list)
```

## 3. Traversal

```c file=traverse.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct node {
    int value;
    struct node *next;
} node_t;

int main(void)
{
    node_t third = {30, NULL};
    node_t second = {20, &third};
    node_t first = {10, &second};
    node_t *head = &first;

    for (node_t *cur = head; cur != NULL; cur = cur->next)
        printf("%d ", cur->value);
    printf("\n");

    return 0;
}
```

```output
10 20 30 
```

This particular list is built out of three ordinary local variables, wired together by address, purely so the traversal itself can be shown without also needing insertion yet — every node here has automatic lifetime, not allocated lifetime, and none of it needs `free`ing. `cur` starts at `head` and, each iteration, moves to `cur->next`, printing as it goes, stopping the moment `cur` becomes `NULL`. Reaching `NULL` is not a special case handled separately; it is the loop's own, ordinary stopping condition, checked by `cur != NULL` exactly like any other condition `Loops and iteration` covered — the address `NULL` itself was chosen, when the list was built, specifically to mark "there is nothing further," so a plain comparison against it is all a traversal ever needs.

## 4. Insertion at the head

```c file=insertfront.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct node {
    int value;
    struct node *next;
} node_t;

void push_front(node_t **head, int value)
{
    node_t *n = malloc(sizeof(node_t));
    if (n == NULL)
        return;
    n->value = value;
    n->next = *head;
    *head = n;
}

void print_list(node_t *head)
{
    for (node_t *cur = head; cur != NULL; cur = cur->next)
        printf("%d ", cur->value);
    printf("\n");
}

void free_list(node_t *head)
{
    node_t *cur = head;
    while (cur != NULL) {
        node_t *next = cur->next;
        free(cur);
        cur = next;
    }
}

int main(void)
{
    node_t *head = NULL;
    push_front(&head, 30);
    push_front(&head, 20);
    push_front(&head, 10);

    print_list(head);
    free_list(head);
    return 0;
}
```

```output
10 20 30 
```

`push_front` allocates a new node, points its `next` at whatever `head` currently points at, then makes `head` point at the new node instead — three assignments, done in that order specifically, because setting `*head = n;` before `n->next = *head;` would overwrite `head` before its old value had been saved anywhere, losing the rest of the list. `push_front` takes `node_t **head`, a pointer to the caller's `head` variable, not `node_t *head` — exactly the same reasoning `The heap: malloc, free, and object lifetime` used for why `free` cannot reach back and null out the caller's pointer: a plain `node_t *head` parameter would receive only a copy of the address `main`'s `head` holds, and reassigning that copy inside `push_front` would never be visible to `main` once the function returned, per `Functions, parameters, and pass-by-value`. Taking the address of `head` and dereferencing it as `*head` is what gives `push_front` a route back to the variable that actually needs to change.

Three calls to `push_front(&head, ...)`, each inserting at the front, produce the values in reverse order of insertion: `30` is pushed first and ends up last, since every subsequent push lands in front of it — matching the printed order `10 20 30`.

### Wrong model: `void push_front(node_t *head, int value)` can update the caller's list

**What is actually true:** A parameter declared `node_t *head` receives a copy of the caller's pointer value, exactly as any parameter does. Reassigning that copy inside the function — `head = n;` — only changes the local copy; the caller's own `head` variable is untouched, and the newly allocated node becomes unreachable from `main` the instant the function returns, a leak by `Memory errors: leaks, dangling pointers, use-after-free`'s definition, since nothing outside the function ever gets a chance to free it either. `node_t **head`, taking the address of the caller's variable, is what makes the update visible outside the function — the identical fix `The heap: malloc, free, and object lifetime` used to explain why `free` cannot null out its argument on its own.

## 5. Insertion at the tail

```c file=insertback.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct node {
    int value;
    struct node *next;
} node_t;

void push_back(node_t **head, int value)
{
    node_t *n = malloc(sizeof(node_t));
    if (n == NULL)
        return;
    n->value = value;
    n->next = NULL;

    if (*head == NULL) {
        *head = n;
        return;
    }

    node_t *cur = *head;
    while (cur->next != NULL)
        cur = cur->next;
    cur->next = n;
}

void print_list(node_t *head)
{
    for (node_t *cur = head; cur != NULL; cur = cur->next)
        printf("%d ", cur->value);
    printf("\n");
}

void free_list(node_t *head)
{
    node_t *cur = head;
    while (cur != NULL) {
        node_t *next = cur->next;
        free(cur);
        cur = next;
    }
}

int main(void)
{
    node_t *head = NULL;
    push_back(&head, 10);
    push_back(&head, 20);
    push_back(&head, 30);

    print_list(head);
    free_list(head);
    return 0;
}
```

```output
10 20 30 
```

Appending at the tail needs `node_t **head` for the same reason section 4 did — the empty-list case, `*head == NULL`, still writes directly into the caller's `head` — but once the list is non-empty, reaching the tail requires walking every node until `cur->next == NULL` finds the last one, then linking the new node after it. This walk is section 3's traversal with a different stopping condition: stop one node early, at the last real node rather than at `NULL` itself, so that its `next` field is available to overwrite. Unlike `push_front`, which is the same fixed number of steps regardless of the list's length, `push_back` here does more work the longer the list already is, since the walk to find the tail has to cross every existing node first.

## 6. Insertion in the interior

```c file=insertafter.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct node {
    int value;
    struct node *next;
} node_t;

void insert_after(node_t *target, int value)
{
    if (target == NULL)
        return;
    node_t *n = malloc(sizeof(node_t));
    if (n == NULL)
        return;
    n->value = value;
    n->next = target->next;
    target->next = n;
}

void print_list(node_t *head)
{
    for (node_t *cur = head; cur != NULL; cur = cur->next)
        printf("%d ", cur->value);
    printf("\n");
}

void free_list(node_t *head)
{
    node_t *cur = head;
    while (cur != NULL) {
        node_t *next = cur->next;
        free(cur);
        cur = next;
    }
}

node_t *make_node(int value)
{
    node_t *n = malloc(sizeof(node_t));
    if (n != NULL) {
        n->value = value;
        n->next = NULL;
    }
    return n;
}

int main(void)
{
    node_t *head = make_node(10);
    head->next = make_node(30);

    print_list(head);
    insert_after(head, 20);
    print_list(head);

    free_list(head);
    return 0;
}
```

```output
10 30 
10 20 30 
```

`insert_after` takes a pointer to an existing node, `target`, rather than a pointer to `head` — inserting after a node that already has a valid address never changes what the *first* node of the list is, so there is no caller variable that needs updating, and a plain `node_t *target` parameter is enough. The two assignments follow section 4's ordering discipline for the same reason: `n->next = target->next;` has to happen before `target->next = n;`, or `target`'s original next node would be overwritten and lost before the new node had a chance to point at it.

## 7. Deletion

```c file=deletebyvalue.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct node {
    int value;
    struct node *next;
} node_t;

void push_back(node_t **head, int value)
{
    node_t *n = malloc(sizeof(node_t));
    if (n == NULL)
        return;
    n->value = value;
    n->next = NULL;
    if (*head == NULL) {
        *head = n;
        return;
    }
    node_t *cur = *head;
    while (cur->next != NULL)
        cur = cur->next;
    cur->next = n;
}

void delete_value(node_t **head, int value)
{
    node_t *cur = *head;
    node_t *prev = NULL;

    while (cur != NULL && cur->value != value) {
        prev = cur;
        cur = cur->next;
    }

    if (cur == NULL)
        return;

    if (prev == NULL)
        *head = cur->next;
    else
        prev->next = cur->next;

    free(cur);
}

void print_list(node_t *head)
{
    for (node_t *c = head; c != NULL; c = c->next)
        printf("%d ", c->value);
    printf("\n");
}

void free_list(node_t *head)
{
    node_t *cur = head;
    while (cur != NULL) {
        node_t *next = cur->next;
        free(cur);
        cur = next;
    }
}

int main(void)
{
    node_t *head = NULL;
    push_back(&head, 10);
    push_back(&head, 20);
    push_back(&head, 30);

    print_list(head);
    delete_value(&head, 20);
    print_list(head);
    delete_value(&head, 10);
    print_list(head);

    free_list(head);
    return 0;
}
```

```output
10 20 30 
10 30 
30 
```

`delete_value` walks the list keeping one node behind the search, `prev`, alongside `cur`, because unlinking a node requires rewriting the `next` field of whichever node points *at* it — a singly linked list has no way to go backward from `cur` to find that node other than having remembered it on the way forward. Deleting a non-head node — `20`, in the first deletion — rewrites `prev->next` to skip over `cur`. Deleting the head itself — `10`, in the second — has `prev` still `NULL` when the matching node is found, so `*head` is rewritten directly instead, the same head-needs-`node_t **`-to-update situation section 4 already established. Either way, `free(cur)` runs only after `cur` has been fully unlinked from the list — freeing it first and then reading `cur->next` to relink around it would be reading through a pointer that `Memory errors: leaks, dangling pointers, use-after-free` names precisely: a use-after-free, freed before it was needed one last time.

## 8. Freeing the whole list

Every example above already contains `free_list`, and it is worth isolating why it is written the way it is:

```c nocompile
void free_list_wrong(node_t *head)
{
    for (node_t *cur = head; cur != NULL; cur = cur->next)
        free(cur);
}
```

Not run: `cur->next` is read *after* `free(cur);` has already released `cur`'s memory back to the allocator — a use-after-free on every iteration but the last, reading a `next` field through a pointer that no longer names memory the loop owns. The correct version, used throughout this article, saves `cur->next` into a separate variable, `next`, before `free(cur)` runs, so the address needed to continue the traversal is captured while `cur` is still valid:

```c nocompile
node_t *next = cur->next;
free(cur);
cur = next;
```

This is the same ordering discipline as sections 4 through 6's insertions, generalised: whenever a step is going to invalidate a pointer, anything still needed from what it points to has to be read out first.

## 9. The dummy-head technique

Sections 5 and 7 both had to special-case an empty list or a head deletion, because `head` itself is not a node — there is nothing before the first real node to point a `prev` at. The **dummy-head** technique adds one extra node, never holding real data, permanently at the front of the list, so that every real node always has *some* node before it, and head-of-list insertion or deletion becomes exactly the interior case with no special branch at all.

```c file=dummyhead.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct node {
    int value;
    struct node *next;
} node_t;

void push_back(node_t *dummy, int value)
{
    node_t *cur = dummy;
    while (cur->next != NULL)
        cur = cur->next;
    node_t *n = malloc(sizeof(node_t));
    if (n == NULL)
        return;
    n->value = value;
    n->next = NULL;
    cur->next = n;
}

void print_list(node_t *dummy)
{
    for (node_t *cur = dummy->next; cur != NULL; cur = cur->next)
        printf("%d ", cur->value);
    printf("\n");
}

void free_list(node_t *dummy)
{
    node_t *cur = dummy->next;
    while (cur != NULL) {
        node_t *next = cur->next;
        free(cur);
        cur = next;
    }
}

int main(void)
{
    node_t dummy = {0, NULL};

    push_back(&dummy, 10);
    push_back(&dummy, 20);
    push_back(&dummy, 30);

    print_list(&dummy);

    free_list(&dummy);
    return 0;
}
```

```output
10 20 30 
```

`dummy` is an ordinary, always-present node whose `value` is never read — only its `next` field matters, and it always plays the role of "the node before the first real one." `push_back` no longer needs an `if (*head == NULL)` branch: even an empty list, meaning `dummy.next == NULL`, is handled by the same `while (cur->next != NULL) cur = cur->next;` loop, which simply stops immediately at `dummy` itself. `push_back` also no longer needs `node_t **`, since the list's identity — the address of `dummy` — never changes, only which nodes come after it; only the version without a dummy head needed to rewrite the caller's own `head` variable. `print_list` and `free_list` both start from `dummy->next`, skipping the dummy itself — `dummy` here is an ordinary stack variable in `main`, never allocated with `malloc`, so `free`ing it would be as invalid as freeing any other address `malloc` never returned. Remembering to start one node past the dummy is the one place the technique's bookkeeping has to be handled explicitly, in every function that walks the list.

## 10. Doubly linked lists

```c file=doubly.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct dnode {
    int value;
    struct dnode *next;
    struct dnode *prev;
} dnode_t;

dnode_t *make_node(int value)
{
    dnode_t *n = malloc(sizeof(dnode_t));
    if (n != NULL) {
        n->value = value;
        n->next = NULL;
        n->prev = NULL;
    }
    return n;
}

int main(void)
{
    dnode_t *first = make_node(10);
    dnode_t *second = make_node(20);

    first->next = second;
    second->prev = first;

    printf("second->prev->value is %d\n", second->prev->value);
    printf("first->next->value is %d\n", first->next->value);

    free(first);
    free(second);
    return 0;
}
```

```output
second->prev->value is 10
first->next->value is 20
```

A **doubly linked list**'s node holds two pointers, `next` and `prev`, and every link is made in both directions: `first->next = second;` and `second->prev = first;` are two separate assignments, not one operation, and both are needed or the structure is only correctly linked in one direction. The payoff is that `prev` gives a way to move backward from any node without having walked forward from the head remembering the way, which section 7's singly linked `delete_value` had to do by hand with its own `prev` variable — a doubly linked list keeps that bookkeeping as a permanent part of every node instead of recomputing it on every deletion. The cost is symmetric: every insertion and deletion now has twice as many pointer assignments to get right, in the correct order, since a broken `prev` link is exactly as real a bug as a broken `next` link, just invisible to a traversal that only ever follows `next`.

## 11. When a list beats an array, and when it does not

A linked list never needs to shift existing elements to insert or delete once you already hold a pointer to the relevant node — section 6's `insert_after` and section 7's `delete_value`, once positioned, do a fixed handful of pointer assignments regardless of how many nodes come before or after. An array insertion at any position other than the end, by contrast, has to move every following element over by one slot to make room, and a deletion has to move every following element back — work that grows with how much of the array sits after the affected position. A linked list also never needs to know its final size in advance, or to `realloc` and copy everything into a larger block the way `Arrays and contiguous memory`'s fixed-size arrays would require for unpredictable growth.

What a linked list gives up is direct access by position: reaching the $k$-th element requires walking $k$ links from the head, one `next` at a time, exactly as section 5's `push_back` had to walk to the tail before it could append — there is no equivalent of an array's `a[k]`, reaching any element in one step regardless of $k$. A linked list also spends extra memory on every node's `next` (and, for a doubly linked list, `prev`) pointer, memory an array's elements do not need at all, and its nodes are scattered across whatever addresses the allocator happened to hand out, rather than sitting next to each other the way `Arrays and contiguous memory` first introduced contiguous storage — which matters for how fast a traversal runs in practice, even when it does not change how many steps it logically takes.

## Exercises

1. Explain why `struct node { int value; struct node next; };`, without a pointer, cannot compile, referencing section 1's error.

2. What does `head == NULL` represent, and why is there no separate check needed to represent "the list has never had anything inserted"?

3. In section 4's `push_front`, what would go wrong if the two lines `n->next = *head;` and `*head = n;` were written in the opposite order?

4. Explain why `push_front` needs a `node_t **head` parameter but `insert_after` in section 6 only needs a plain `node_t *target`.

5. In section 7's `delete_value`, what is `prev` used for, and why does deleting the head node (where `prev` is still `NULL`) need a different assignment than deleting any other node?

6. Using section 8, explain exactly why `free_list_wrong`'s `for (node_t *cur = head; cur != NULL; cur = cur->next) free(cur);` is broken, identifying the specific use-after-free.

7. In section 9, why does adding a permanent dummy node let `push_back` drop its `if (*head == NULL)` special case entirely?

8. A doubly linked list's `delete` operation, given a pointer directly to the node to remove, needs to update two other nodes' pointers (or one, if deleting an end). Which two fields, and on which neighbouring nodes, referencing section 10's `next`/`prev` pair?

9. A program needs to insert new elements into the middle of a growing sequence frequently, and almost never needs to access an element by numeric position. Using section 11, which structure fits better, and why?

## Answers

1. `struct node` containing a `struct node next;` member directly would require `sizeof(struct node)` to include the size of another complete `struct node`, which itself would need to include another, with no base case — there is no finite size that satisfies this, so the compiler rejects it as an incomplete type, exactly as section 1's `expect_fail` block shows.

2. `head == NULL` means there is no first node, hence no nodes reachable at all — an empty list. This single condition already covers "nothing has ever been inserted," since a list that has had every element removed again also ends up with `head == NULL`; the representation does not distinguish "never populated" from "emptied out," and there is no need for it to.

3. `*head = n;` first would overwrite `head`'s only record of the previous first node before `n->next` had been set to it, so `n->next` would then be set to `n` itself (`*head`, now `n`) — the old list would be unreachable, lost, and the new node would point at itself instead of at what used to be the list.

4. `push_front` can change *which node the list starts at*, which is a change to the caller's own `head` variable — a plain `node_t *head` parameter would only receive a copy of that address, per `Functions, parameters, and pass-by-value`, and reassigning the copy would not be visible to the caller. `insert_after` never changes which node is first; it only rewrites `target->next`, a field reached through `target`, which a plain, copied pointer is entirely sufficient to reach.

5. `prev` holds the node immediately before `cur` in the traversal, which is the only node whose `next` field can be rewritten to skip over `cur` once it is found, since a singly linked list has no way to go backward from `cur` on its own. Deleting the head node has no such node before it — `prev` is still `NULL` at that point — so there is nothing to rewrite the `next` field of; `*head` itself has to be rewritten directly instead, since `head` is the only thing currently pointing at that node.

6. `free(cur);` releases `cur`'s memory, and the very next thing the `for` loop's increment does is evaluate `cur = cur->next`, reading the `next` field through `cur` — a pointer to memory that was just freed on the same iteration. This is a use-after-free: the read might happen to still see the correct `next` value, since `free` does not erase bytes, but nothing guarantees it, exactly as `Memory errors: leaks, dangling pointers, use-after-free` describes for reading through a freed pointer generally.

7. With a dummy node always present, `dummy.next == NULL` (an empty list) and `dummy.next` pointing at some real node (a non-empty one) are both handled by the identical loop, `while (cur->next != NULL) cur = cur->next;`, starting from `cur = dummy`: on an empty list it simply stops immediately, at `dummy` itself, which is already exactly the node the new element needs to attach after. There is no longer a structurally different case for "the list currently has nothing in it."

8. The node before the one being deleted needs its `next` field updated to skip past it, and the node after needs its `prev` field updated to skip back past it — both neighbours require one pointer update each, mirroring the two directions section 10 established for every doubly linked connection, unless the node being deleted is at one end, in which case only the single existing neighbour needs updating.

9. A linked list fits better. Section 11 established that inserting into the middle of a linked list, once positioned, is a fixed handful of pointer assignments regardless of the sequence's length, while the same operation on an array requires shifting every following element over. The program's stated lack of need for access by numeric position removes the one advantage — direct, one-step access via an index — that would have favoured an array instead.
