---
id: d-stacks-queues
title: "Stacks and queues"
track: ds
---

# Stacks and queues

`Linked lists` built one concrete structure out of self-referential nodes. This article builds two more — but starts somewhere different: not with a struct, but with a **contract**. A stack and a queue are each defined first by what operations they support and what those operations promise, independent of how the data is actually stored underneath; only after that contract is fixed does this article show two genuinely different ways to satisfy it.

## 1. Abstract data type versus implementation

An **abstract data type** (ADT) is a specification: a set of operations and the guarantees each one makes, with no commitment to how those guarantees are met. A **stack** is the ADT with two core operations, **push** (add a value) and **pop** (remove and return the most recently pushed value not yet removed) — **last in, first out**, LIFO. A **queue** is the ADT with **enqueue** (add a value) and **dequeue** (remove and return the least recently added value not yet removed) — **first in, first out**, FIFO. Neither definition says anything about arrays, linked lists, or memory at all; sections 2 through 4 give three different, equally valid implementations of these two contracts, and any code written only against push/pop or enqueue/dequeue cannot tell which one it is actually running against.

## 2. Stack: list-backed, push and pop at the head

```c file=liststack.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct node {
    int value;
    struct node *next;
} node_t;

typedef struct {
    node_t *top;
} int_stack_t;

void stack_init(int_stack_t *s)
{
    s->top = NULL;
}

int stack_push(int_stack_t *s, int value)
{
    node_t *n = malloc(sizeof(node_t));
    if (n == NULL)
        return 0;
    n->value = value;
    n->next = s->top;
    s->top = n;
    return 1;
}

int stack_pop(int_stack_t *s, int *out)
{
    if (s->top == NULL)
        return 0;
    node_t *old = s->top;
    *out = old->value;
    s->top = old->next;
    free(old);
    return 1;
}

int main(void)
{
    int_stack_t s;
    stack_init(&s);

    stack_push(&s, 1);
    stack_push(&s, 2);
    stack_push(&s, 3);

    int value;
    while (stack_pop(&s, &value))
        printf("popped %d\n", value);

    if (!stack_pop(&s, &value))
        printf("pop on empty stack failed (underflow)\n");

    return 0;
}
```

```output
popped 3
popped 2
popped 1
pop on empty stack failed (underflow)
```

`int_stack_t` holds a single pointer, `top`, at the front of an ordinary linked list. `stack_push` is exactly `Linked lists`' `push_front`: allocate, point the new node's `next` at the current `top`, then make `top` point at the new node. `stack_pop` reverses it — read `top`'s value, advance `top` to `top->next`, free the old node — and reports failure through its return value rather than crashing when `s->top` is already `NULL`, since popping an empty stack has no value to return. Pushing `1`, `2`, `3` and popping three times returns `3`, `2`, `1`: the most recently pushed value is always the first one back out, exactly the LIFO contract section 1 stated, satisfied here by nothing more than inserting and removing at the same end of a linked list.

## 3. Queue: list-backed, enqueue at the tail, dequeue at the head

```c file=listqueue.c run
#include <stdio.h>
#include <stdlib.h>

typedef struct node {
    int value;
    struct node *next;
} node_t;

typedef struct {
    node_t *head;
    node_t *tail;
} queue_t;

void queue_init(queue_t *q)
{
    q->head = NULL;
    q->tail = NULL;
}

int enqueue(queue_t *q, int value)
{
    node_t *n = malloc(sizeof(node_t));
    if (n == NULL)
        return 0;
    n->value = value;
    n->next = NULL;

    if (q->tail == NULL) {
        q->head = n;
        q->tail = n;
    } else {
        q->tail->next = n;
        q->tail = n;
    }
    return 1;
}

int dequeue(queue_t *q, int *out)
{
    if (q->head == NULL)
        return 0;
    node_t *old = q->head;
    *out = old->value;
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

    enqueue(&q, 1);
    enqueue(&q, 2);
    enqueue(&q, 3);

    int value;
    while (dequeue(&q, &value))
        printf("dequeued %d\n", value);

    if (!dequeue(&q, &value))
        printf("dequeue on empty queue failed (underflow)\n");

    return 0;
}
```

```output
dequeued 1
dequeued 2
dequeued 3
dequeue on empty queue failed (underflow)
```

A queue needs insertion at one end and removal at the other, so `queue_t` keeps two pointers, `head` and `tail`, rather than the single `top` a stack needed. `enqueue` links the new node after `tail` and moves `tail` to it — the empty-queue case, `q->tail == NULL`, sets both `head` and `tail` to the new, sole node, since it is simultaneously the first and last element. `dequeue` removes from `head`, exactly as a stack pops from `top`, and additionally resets `tail` to `NULL` if the removed node was the last one, keeping both pointers consistent with an empty queue. Enqueuing `1`, `2`, `3` and dequeuing three times returns `1`, `2`, `3` — the order they arrived in, the FIFO contract.

### Wrong model: A queue is just a stack with the pop end relabelled

**What is actually true:** `Linked lists`' original `push_back` walked the entire list to find the tail before inserting, because it kept no record of where the tail was — perfectly correct, but not the constant-time operation section 5 is about to require. Section 3's `queue_t` keeps an explicit `tail` pointer specifically so `enqueue` never has to walk anything; without it, "enqueue at the tail" would still be a correct queue, just not one meeting the constant-time claim this article is building toward. A stack's single `top` pointer is not simply reinterpreted as a queue's `tail` — a queue needs *both* ends tracked, because it inserts at one and removes from the other, where a stack does both at the same one.

## 4. Array-backed: the circular buffer

```c file=ringbuffer.c run
#include <stdio.h>

#define CAPACITY 4

typedef struct {
    int data[CAPACITY];
    int head;
    int count;
} ring_t;

void ring_init(ring_t *r)
{
    r->head = 0;
    r->count = 0;
}

int ring_enqueue(ring_t *r, int value)
{
    if (r->count == CAPACITY)
        return 0;
    int tail = (r->head + r->count) % CAPACITY;
    r->data[tail] = value;
    r->count++;
    return 1;
}

int ring_dequeue(ring_t *r, int *out)
{
    if (r->count == 0)
        return 0;
    *out = r->data[r->head];
    r->head = (r->head + 1) % CAPACITY;
    r->count--;
    return 1;
}

int main(void)
{
    ring_t r;
    ring_init(&r);

    for (int i = 1; i <= CAPACITY; i++)
        ring_enqueue(&r, i);

    if (!ring_enqueue(&r, 999))
        printf("enqueue on full ring failed (overflow)\n");

    int value;
    ring_dequeue(&r, &value);
    printf("dequeued %d\n", value);
    ring_dequeue(&r, &value);
    printf("dequeued %d\n", value);

    ring_enqueue(&r, 5);
    ring_enqueue(&r, 6);

    while (ring_dequeue(&r, &value))
        printf("dequeued %d\n", value);

    return 0;
}
```

```output
enqueue on full ring failed (overflow)
dequeued 1
dequeued 2
dequeued 3
dequeued 4
dequeued 5
dequeued 6
```

`ring_t` holds a fixed-size array, `data`, whose length is decided at compile time exactly as `Arrays and contiguous memory` described, plus `head`, the index of the oldest element, and `count`, how many slots currently hold live values. There is no `tail` field: the next insertion point is computed on the fly as `(head + count) % CAPACITY`, and the `%` is what makes this a **circular buffer** — once an index would run past `CAPACITY - 1`, the modulus wraps it back to `0`, treating the array as a loop rather than a straight line. The trace confirms it: with `CAPACITY = 4`, values `1` through `4` fill every slot; dequeuing `1` and `2` frees two slots at the *front* of the logical queue, which are physically the array's first two indices; enqueuing `5` and `6` lands them at indices `0` and `1` — wrapping around past the physical end of `data` — even though the logical queue never had more than `4` elements live at once. No element is ever shifted to make room; only `head` and `count` move.

## 5. The constant-time claims

Every operation in sections 2 through 4 — `stack_push`, `stack_pop`, `enqueue`, `dequeue`, `ring_enqueue`, `ring_dequeue` — does a fixed, small number of steps regardless of how many elements the structure currently holds: one allocation or one free, a couple of pointer or index updates, no loop over existing elements anywhere in any of them. This is the sense in which each is a **constant-time** operation — the work done does not grow with the structure's size, in contrast to, say, `Linked lists`' original tail-walking `push_back`, whose cost grew with the list's length. The list-backed versions get this from never needing to walk anything, courtesy of the tracked `top` or `head`/`tail` pointers; the array-backed version gets it from computing an index directly with arithmetic, exactly as `Arrays and contiguous memory` computes any element's address directly rather than by walking from the start.

### Wrong model: The array-backed version must be slower, since arrays cannot grow

**What is actually true:** Growth and per-operation cost are separate questions. `ring_t`'s `CAPACITY` is fixed once and for all, exactly as `Arrays and contiguous memory`'s section 5 described for any ordinary array — but every enqueue and dequeue that fits inside that fixed capacity is exactly as constant-time as the list-backed version's, arguably cheaper in practice for not calling `malloc` or `free` at all. The list-backed version trades that fixed ceiling for the ability to keep growing, at the cost of one allocation per element and the extra memory every node's `next` pointer (and, for the queue, the bookkeeping for `tail`) requires — a genuine tradeoff, not a strict win for either side.

## 6. Underflow and overflow

**Underflow** is attempting to remove from an empty structure — `stack_pop` on a stack with `top == NULL`, `dequeue` on a queue with `head == NULL`, `ring_dequeue` on a ring with `count == 0` — and every implementation above reports it through a return value rather than reading through a null pointer or an invalid index, which `The heap: malloc, free, and object lifetime` already established as undefined behaviour to avoid. **Overflow** is attempting to insert past a fixed capacity, which only the array-backed version in section 4 can experience at all: `ring_enqueue` checks `count == CAPACITY` before writing, since `data` has no fifth slot to write `999` into no matter what index arithmetic is attempted. The list-backed versions in sections 2 and 3 have no analogous fixed ceiling — `stack_push` and `enqueue` fail only if `malloc` itself fails, which is a general property of running out of heap memory entirely, not a property of the stack or queue as a data type.

## Exercises

1. Using section 1, explain why a program written only against `push` and `pop` cannot tell whether it is talking to a list-backed or array-backed stack.

2. In section 2, trace `stack_push(&s, 1); stack_push(&s, 2); stack_pop(&s, &v);` by hand: what is `v`, and what does `s.top` point at immediately afterward?

3. Using section 3's wrong-model box, explain specifically why `queue_t` needs both a `head` and a `tail` field, where `int_stack_t` in section 2 only needed `top`.

4. In section 4's trace, after the two dequeues and two enqueues, which physical array indices hold the four logically-queued values `3, 4, 5, 6`, in order? Use the `(head + count) % CAPACITY` formula from `ring_enqueue`.

5. Why does `ring_dequeue` need to check `r->count == 0` specifically, rather than checking whether `r->head` equals some fixed sentinel index?

6. A student argues that since `ring_t`'s array has a fixed size, it must always be the wrong choice compared to a list-backed queue. Using section 5, evaluate this argument.

7. Explain why overflow, as section 6 defines it, cannot happen to the list-backed stack from section 2 in the same way it can to `ring_t`, and what *can* still cause `stack_push` to fail.

## Answers

1. Section 1 defines a stack purely by its `push`/`pop` contract — add a value, remove and return the most recently pushed value not yet removed — with no mention of how storage is arranged. Both section 2's list-backed version and an array-backed version honour that identical contract; a caller using only `push` and `pop` observes only LIFO ordering and return values, none of which differ between the two implementations, so nothing available through the ADT's own operations can distinguish them.

2. After `stack_push(&s, 1)`, `s.top` points at a node holding `1`, `next = NULL`. After `stack_push(&s, 2)`, `s.top` points at a new node holding `2`, whose `next` points at the node holding `1`. `stack_pop(&s, &v)` sets `v = 2` (the top node's value), then advances `s.top` to that node's `next` — the node holding `1` — and frees the popped node. Afterward, `v` is `2`, and `s.top` points at the remaining node holding `1`.

3. A stack only ever inserts and removes at the same end, so a single pointer, `top`, is enough to name both the insertion point and the removal point simultaneously. A queue inserts at one end and removes from the other; a single pointer can only mark one location, so tracking both ends independently — `head` for removal, `tail` for insertion — is necessary for `enqueue` to reach the far end without walking the whole list every time, exactly the cost the wrong-model box contrasts with `Linked lists`' original tail-walking `push_back`.

4. `head` is `2` at that point (after two dequeues from index `0`), and `count` is `4` (two remained, two were added back). The value `3` sits at index `2` (unchanged since it was written), `4` at index `3`, `5` was written at `(2 + 2) % 4 = 0`, and `6` at `(2 + 3) % 4 = 1` — so physically, index `0` holds `5`, index `1` holds `6`, index `2` holds `3`, index `3` holds `4`, while logically dequeuing proceeds `3, 4, 5, 6` starting from `head = 2` and wrapping around.

5. `r->head` is a valid array index, `0` through `CAPACITY - 1`, whether or not the ring is empty — it does not become some special out-of-range value when nothing is left, since `ring_dequeue` never resets it that way. `count` is the only field that directly records how many live elements remain, so it is the only field that can distinguish "empty" from "not empty" without ambiguity; `head` alone cannot, since a full ring and an empty ring can easily share the identical `head` value.

6. The argument does not hold up: section 5 established that a fixed capacity affects how much a structure can grow, not how fast any individual operation within that capacity runs — every one of `ring_t`'s operations is constant-time, exactly like the list-backed version's, and avoids `malloc` and `free` entirely for every operation that fits. Whether the array-backed version is the better choice depends on whether the fixed ceiling is acceptable for the situation, not on speed alone.

7. Section 2's `int_stack_t` has no fixed capacity field and no array to run out of slots in — each `stack_push` requests a fresh block from the heap via `malloc`, and the heap's available memory is not a fixed number baked into the stack's own type the way `CAPACITY` is baked into `ring_t`. `stack_push` can still fail, but only if `malloc` itself returns `NULL` because the system has no more memory to give out at all — a much larger, and much less structurally predictable, ceiling than `ring_t`'s fixed `CAPACITY`.
