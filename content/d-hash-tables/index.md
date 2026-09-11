---
id: d-hash-tables
title: "Hash tables"
track: ds
---

# Hash tables

`Arrays and contiguous memory` gave you constant-time access by index — `a[i]` computes an address directly, with no searching. A **hash table** extends that guarantee to keys that are not already small integers: strings, arbitrary numbers, anything at all, by computing an index *from* the key itself, so that looking a key up still means going straight to a slot rather than searching for it.

## 1. Mapping keys to indices

```c file=maptoindex.c run
#include <stdio.h>

int main(void)
{
    int capacity = 10;
    int keys[4] = {17, 42, 101, 256};

    for (int i = 0; i < 4; i++)
        printf("%d -> index %d\n", keys[i], keys[i] % capacity);

    return 0;
}
```

```output
17 -> index 7
42 -> index 2
101 -> index 1
256 -> index 6
```

A **hash function** turns a key into an integer, and taking that integer modulo the table's capacity turns it into a valid array index — `%` guarantees the result always lands in `0` through `capacity - 1`, exactly the range `Arrays and contiguous memory`'s indexing needs. For plain integer keys already small enough to use directly, the identity function serves as the hash: `17 % 10 = 7` places `17` at index `7`. Inserting, searching, and deleting all follow the same first step — compute the index from the key — which is what makes a hash table's typical cost independent of how many keys it already holds, unlike a scan through a list of stored entries one at a time, which has to compare against everything already present.

## 2. Hash functions for integers and strings

```c file=hashfuncs.c run
#include <stdio.h>

unsigned long hash_string(const char *s)
{
    unsigned long h = 5381;
    while (*s) {
        h = h * 33 + (unsigned char)(*s);
        s++;
    }
    return h;
}

int main(void)
{
    int capacity = 10;

    const char *keys[3] = {"cat", "dog", "bird"};
    for (int i = 0; i < 3; i++)
        printf("\"%s\" -> hash %lu -> index %lu\n", keys[i], hash_string(keys[i]), hash_string(keys[i]) % capacity);

    return 0;
}
```

```output
"cat" -> hash 193488125 -> index 5
"dog" -> hash 193489663 -> index 3
"bird" -> hash 6385080934 -> index 4
```

A string has no single number to reduce modulo the capacity, so `hash_string` builds one, one byte at a time — `Strings as char arrays`'s own `\0`-terminated scan — folding each byte into a running total via multiplication and addition, so that the final value depends on every character and its position, not just the string's length or its first byte. `h * 33 + (unsigned char)(*s)` is a specific, well-tested choice (djb2), not an arbitrary one: the multiplier spreads small differences between strings — `"cat"` and `"bat"`, differing in one byte — across a wide range of possible outputs, rather than producing nearby hash values for nearby strings.

## 3. Collisions

```c file=collision.c run
#include <stdio.h>

int main(void)
{
    int capacity = 10;
    printf("17 -> index %d\n", 17 % capacity);
    printf("27 -> index %d\n", 27 % capacity);
    return 0;
}
```

```output
17 -> index 7
27 -> index 7
```

A **collision** is two distinct keys hashing to the same index — here, `17` and `27` both land at index `7`, since `%capacity` can only ever produce `capacity` distinct outputs, while the number of possible keys is far larger. Collisions are not a bug in a hash function; `Sets and functions`'s own pigeonhole reasoning (section 8's injective/surjective discussion) makes them unavoidable in general — a function from a larger set to a smaller one cannot be injective — and every hash table design has to include a plan for what happens when two keys land on the same slot.

## 4. Separate chaining

```c file=chaining.c run
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct entry {
    char *key;
    int value;
    struct entry *next;
} entry_t;

typedef struct {
    entry_t **buckets;
    int capacity;
    int count;
} hashtable_t;

unsigned long hash_string(const char *s)
{
    unsigned long h = 5381;
    while (*s) {
        h = h * 33 + (unsigned char)(*s);
        s++;
    }
    return h;
}

void ht_init(hashtable_t *t, int capacity)
{
    t->buckets = malloc(sizeof(entry_t *) * capacity);
    for (int i = 0; i < capacity; i++)
        t->buckets[i] = NULL;
    t->capacity = capacity;
    t->count = 0;
}

void ht_insert(hashtable_t *t, const char *key, int value)
{
    unsigned long index = hash_string(key) % t->capacity;
    for (entry_t *e = t->buckets[index]; e != NULL; e = e->next) {
        if (strcmp(e->key, key) == 0) {
            e->value = value;
            return;
        }
    }
    entry_t *e = malloc(sizeof(entry_t));
    e->key = malloc(strlen(key) + 1);
    strcpy(e->key, key);
    e->value = value;
    e->next = t->buckets[index];
    t->buckets[index] = e;
    t->count++;
}

int ht_get(hashtable_t *t, const char *key, int *out)
{
    unsigned long index = hash_string(key) % t->capacity;
    for (entry_t *e = t->buckets[index]; e != NULL; e = e->next) {
        if (strcmp(e->key, key) == 0) {
            *out = e->value;
            return 1;
        }
    }
    return 0;
}

int main(void)
{
    hashtable_t t;
    ht_init(&t, 8);

    ht_insert(&t, "cat", 1);
    ht_insert(&t, "dog", 2);
    ht_insert(&t, "bird", 3);
    ht_insert(&t, "cat", 100);

    int value;
    if (ht_get(&t, "cat", &value))
        printf("cat -> %d\n", value);
    printf("fish: %s\n", ht_get(&t, "fish", &value) ? "found" : "not found");
    printf("count: %d\n", t.count);

    return 0;
}
```

```output
cat -> 100
fish: not found
count: 3
```

**Separate chaining** resolves a collision by letting each bucket hold not one entry but a small linked list of them — `Linked lists`'s own `push_front`, reused directly for `ht_insert`'s new-entry case. `ht_get` walks whichever bucket's list the key hashes to, comparing each entry's key with `strcmp` until a match is found or the list ends; two colliding keys simply coexist in the same bucket's list, distinguished by the comparison, not by the index alone. Inserting `"cat"` a second time updates the existing entry in place rather than adding a duplicate — `count` stays `3` — because `ht_insert` walks the bucket first, exactly as `ht_get` does, before deciding whether to allocate a new node at all.

## 5. Load factor and rehashing

```c file=rehash.c run
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct entry {
    char *key;
    int value;
    struct entry *next;
} entry_t;

typedef struct {
    entry_t **buckets;
    int capacity;
    int count;
} hashtable_t;

unsigned long hash_string(const char *s)
{
    unsigned long h = 5381;
    while (*s) {
        h = h * 33 + (unsigned char)(*s);
        s++;
    }
    return h;
}

void ht_init(hashtable_t *t, int capacity)
{
    t->buckets = malloc(sizeof(entry_t *) * capacity);
    for (int i = 0; i < capacity; i++)
        t->buckets[i] = NULL;
    t->capacity = capacity;
    t->count = 0;
}

void ht_insert(hashtable_t *t, const char *key, int value);

void ht_rehash(hashtable_t *t, int new_capacity)
{
    entry_t **old_buckets = t->buckets;
    int old_capacity = t->capacity;

    ht_init(t, new_capacity);

    for (int i = 0; i < old_capacity; i++) {
        entry_t *e = old_buckets[i];
        while (e != NULL) {
            entry_t *next = e->next;
            unsigned long index = hash_string(e->key) % t->capacity;
            e->next = t->buckets[index];
            t->buckets[index] = e;
            t->count++;
            e = next;
        }
    }
    free(old_buckets);
}

void ht_insert(hashtable_t *t, const char *key, int value)
{
    unsigned long index = hash_string(key) % t->capacity;
    for (entry_t *e = t->buckets[index]; e != NULL; e = e->next) {
        if (strcmp(e->key, key) == 0) {
            e->value = value;
            return;
        }
    }

    double load_factor = (double)(t->count + 1) / t->capacity;
    if (load_factor > 0.75) {
        ht_rehash(t, t->capacity * 2);
        index = hash_string(key) % t->capacity;
    }

    entry_t *e = malloc(sizeof(entry_t));
    e->key = malloc(strlen(key) + 1);
    strcpy(e->key, key);
    e->value = value;
    e->next = t->buckets[index];
    t->buckets[index] = e;
    t->count++;
}

int main(void)
{
    hashtable_t t;
    ht_init(&t, 4);

    const char *keys[6] = {"a", "b", "c", "d", "e", "f"};
    for (int i = 0; i < 6; i++) {
        ht_insert(&t, keys[i], i);
        printf("after inserting \"%s\": count=%d, capacity=%d\n", keys[i], t.count, t.capacity);
    }

    return 0;
}
```

```output
after inserting "a": count=1, capacity=4
after inserting "b": count=2, capacity=4
after inserting "c": count=3, capacity=4
after inserting "d": count=4, capacity=8
after inserting "e": count=5, capacity=8
after inserting "f": count=6, capacity=8
```

**Load factor**, $\alpha = \text{count} / \text{capacity}$, measures how full the table is — the average number of entries per bucket, if collisions were spread perfectly evenly. As $\alpha$ grows, chains grow with it, and section 4's constant-time-per-bucket assumption erodes. **Rehashing** keeps $\alpha$ bounded: once inserting would push it past a fixed threshold (`0.75` here), `ht_rehash` allocates a larger table and reinserts every existing entry into it, recomputing each one's index against the *new* capacity — a hash value's own numeric meaning does not change, but `% capacity`'s result does the moment `capacity` does. The table above doubles from `4` to `8` exactly when inserting `"d"` would have pushed $\alpha$ to $1.0$, past the threshold — confirmed directly by the printed capacities, not merely asserted.

## 6. Open addressing and clustering

```c file=openaddr.c run
#include <stdio.h>

#define CAPACITY 10

int table[CAPACITY];
int occupied[CAPACITY];

void oa_init(void)
{
    for (int i = 0; i < CAPACITY; i++)
        occupied[i] = 0;
}

int oa_insert(int key)
{
    int index = key % CAPACITY;
    int probes = 0;
    while (occupied[index]) {
        index = (index + 1) % CAPACITY;
        probes++;
        if (probes == CAPACITY)
            return -1;
    }
    table[index] = key;
    occupied[index] = 1;
    return index;
}

int main(void)
{
    int keys[5] = {7, 17, 27, 3, 37};
    oa_init();
    for (int i = 0; i < 5; i++) {
        int idx = oa_insert(keys[i]);
        printf("insert %d -> index %d\n", keys[i], idx);
    }
    return 0;
}
```

```output
insert 7 -> index 7
insert 17 -> index 8
insert 27 -> index 9
insert 3 -> index 3
insert 37 -> index 0
```

**Open addressing** resolves a collision without any second structure at all: if a key's own slot is occupied, it **probes** forward — here, **linear probing**, checking `index + 1`, then `index + 2`, and so on, wrapping around with `%` — until an empty slot is found, and stores the key there instead. `7`, `17`, and `27` all hash to index `7`; each in turn finds its natural slot taken and probes onward, landing at `7`, `8`, `9`. `3` hashes directly to its own free slot, `3`. `37` also hashes to `7`, and now has to probe past three already-occupied slots — `7`, `8`, `9` — wrapping around to land at `0`, even though `0` was never `37`'s own natural index at all. This run of consecutive occupied slots is **clustering**: once a few keys share a hash value, every further key that probes through that run gets pushed one slot further along, and every key that merely *passes through* the cluster — like `37`, whose own index was `7` but whose probe sequence had to cross `8` and `9` too — makes the cluster's effective width larger for the next arrival, independent of chaining's separate per-bucket lists entirely.

## 7. Average versus worst case

With a hash function that spreads keys roughly evenly and a load factor kept bounded by rehashing, both chaining and open addressing give $O(1)$ *average* cost per operation — each bucket, or each probe sequence, holds only a small, roughly constant number of entries relative to the table's size. The *worst* case, for either scheme, is every key landing in the same bucket, or the same probe sequence: chaining degrades to walking a single linked list of length up to $n$, and open addressing degrades to probing through up to $n$ occupied slots before finding one free — both $O(n)$, a one-at-a-time scan through every stored key, the exact guarantee a hash table exists to avoid.

## 8. How a poor hash destroys the guarantee

```c file=poorhash.c run
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct entry {
    char *key;
    struct entry *next;
} entry_t;

entry_t *buckets_good[101];
entry_t *buckets_bad[101];

unsigned long hash_good(const char *s)
{
    unsigned long h = 5381;
    while (*s) {
        h = h * 33 + (unsigned char)(*s);
        s++;
    }
    return h;
}

unsigned long hash_bad(const char *s)
{
    (void)s;
    return 0;
}

long comparisons = 0;

int ht_get(entry_t **buckets, int capacity, unsigned long (*hashfn)(const char *), const char *key)
{
    unsigned long index = hashfn(key) % capacity;
    for (entry_t *e = buckets[index]; e != NULL; e = e->next) {
        comparisons++;
        if (strcmp(e->key, key) == 0)
            return 1;
    }
    return 0;
}

void ht_put(entry_t **buckets, int capacity, unsigned long (*hashfn)(const char *), const char *key)
{
    unsigned long index = hashfn(key) % capacity;
    entry_t *e = malloc(sizeof(entry_t));
    e->key = malloc(strlen(key) + 1);
    strcpy(e->key, key);
    e->next = buckets[index];
    buckets[index] = e;
}

int main(void)
{
    for (int i = 0; i < 101; i++) {
        buckets_good[i] = NULL;
        buckets_bad[i] = NULL;
    }

    char keybuf[16];
    for (int i = 0; i < 200; i++) {
        snprintf(keybuf, sizeof keybuf, "key%d", i);
        ht_put(buckets_good, 101, hash_good, keybuf);
        ht_put(buckets_bad, 101, hash_bad, keybuf);
    }

    comparisons = 0;
    ht_get(buckets_good, 101, hash_good, "key0");
    printf("good hash: %ld comparisons to find key0\n", comparisons);

    comparisons = 0;
    ht_get(buckets_bad, 101, hash_bad, "key0");
    printf("bad hash:  %ld comparisons to find key0\n", comparisons);

    return 0;
}
```

```output
good hash: 2 comparisons to find key0
bad hash:  200 comparisons to find key0
```

`hash_bad` returns `0` for every key, regardless of what the key actually is — every one of the `200` inserted keys lands in the identical bucket, turning that one bucket's chain into a plain linked list of everything ever inserted. `"key0"`, inserted first, sits at the far end of that list, and `ht_get` has to walk past all `199` entries inserted after it — `200` comparisons total — where `hash_good`'s roughly even spread across `101` buckets finds it in `2`. This is section 7's worst case made concrete, and the cause is entirely the hash function, not the table size, the load factor, or anything else about how the table was used: a poor hash function collapses a structure built specifically to avoid a one-at-a-time scan through every stored key back into exactly that scan, however large or well-tuned the table otherwise is.

### Wrong model: A bad outcome for a hash table always means a bug in the insert or lookup code

**What is actually true:** Section 8's `ht_get` and `ht_put` are the identical, correct functions in both the "good" and "bad" columns — the only difference is which function is passed in for `hashfn`. A hash table's entire performance guarantee rests on an assumption that lives outside the table's own insert and lookup logic entirely: that the hash function distributes keys roughly evenly. Violate that one assumption, as `hash_bad` does on purpose, and every other part of the implementation can be completely correct while the table's actual behaviour degrades to section 7's worst case — the guarantee was never a property of the chaining or probing logic alone, it was always conditional on the hash function holding up its end.

## Exercises

1. Using section 1, compute the index for the integer key `53` in a table of capacity `10`, and explain why `%` guarantees the result is always a valid index regardless of the key's value.

2. Using section 2, explain why `hash_string` reads every character of its input rather than, say, just the first and last.

3. Using section 3, explain why collisions are unavoidable in general, referencing `Sets and functions`'s injective/surjective vocabulary directly.

4. Using section 4, trace what `ht_get(&t, "dog", &value)` does after section 4's exact sequence of inserts, listing which bucket it checks and how many entries it compares against.

5. Using section 5, explain why `ht_rehash` has to recompute every entry's index from scratch, rather than simply copying each entry to the same index number in the larger array.

6. Using section 6, explain why `37`'s insertion probing past index `7`, `8`, and `9` makes the *next* colliding key's expected probe count worse, not just `37`'s own.

7. Using section 8, explain precisely what would need to change about `hash_bad` to bring the table's performance back toward section 7's average case, without changing `ht_get` or `ht_put` at all.

## Answers

1. $53 \bmod 10 = 3$. `%`'s result is always in the range `0` to `capacity - 1` by the definition of the remainder operation, regardless of how large or small the original key is, so it is always a valid array index for a `capacity`-sized array.

2. Reading only the first and last character would give identical hash values to many different strings sharing those two characters — `"cat"` and `"cot"` and `"cut"` would all hash identically if only the first and last bytes mattered, colliding far more often than necessary. Reading every character, and folding position into the computation via the running multiplication, makes every character's identity and position affect the final value.

3. `Sets and functions`'s section 8 established that a function cannot be injective if its domain is larger than its codomain — some two inputs must share an output. A hash function's domain (every possible key: every integer, every string) is far larger than its codomain (`0` through `capacity - 1`), so by that same reasoning, some two distinct keys are guaranteed to hash to the same index, no matter how the hash function is designed.

4. `hash_string("dog") % 8` determines the bucket; `ht_get` walks that bucket's list. Computing all three directly at capacity `8`: `"cat"` lands at index `5`, `"dog"` at `7`, `"bird"` at `6` — three different buckets, no collision between them. `"dog"`'s bucket therefore holds only its own single entry, so `ht_get` compares against exactly `1` entry and returns its value, `2`.

5. A hash value's own numeric result does not depend on the table's capacity, but the *index* used to place it, `hash(key) % capacity`, does — the same hash value produces a different remainder against a different capacity. Copying each entry to its old numeric index in the new, larger array would place most entries in the wrong bucket for the new capacity, silently breaking every future lookup for those keys.

6. `37`'s probe sequence extends the run of consecutive occupied slots from `{7,8,9}` to `{7,8,9,0}` — one slot longer. Any future key hashing to `7`, `8`, `9`, or now `0` has to probe past this longer run before finding a free slot, so every insertion into an already-clustered region tends to lengthen that same cluster further, compounding the cost for whichever key arrives next.

7. `hash_bad` would need to actually depend on the key's contents — incorporating every byte the way `hash_good` does, per section 2 — rather than ignoring the key entirely and returning a fixed constant. Nothing about `ht_get` or `ht_put` would need to change at all, since both already only ever call whichever hash function they are given; the guarantee section 7 describes depends entirely on that one function's quality, exactly the wrong-model box's point.
