# Python & Data Structures Interview Preparation

## Summary
Python's expressive syntax, generator pipelines, and standard library collections empower rapid algorithmic problem-solving. Understanding asymptotic time/space complexities and Python internals (GIL, memory allocation) is essential for top engineering roles.

## Key Concepts
- **Python Built-in Complexities**: `list` (O(1) append/pop, O(n) insert/remove), `dict` and `set` (average O(1) hash lookup, worst-case O(n) collisions), `collections.deque` (O(1) append/pop left).
- **Core Algorithmic Paradigms**: Two Pointers, Sliding Window, Monotonic Stack, Binary Search on Answer, Breadth-First Search (BFS), Depth-First Search (DFS), and Dynamic Programming.
- **Pythonic Mechanics**: Generators with `yield`, list comprehensions, decorators, context managers (`__enter__`, `__exit__`), and `dataclasses`.

## Worked Example: Sliding Window Maximum
```python
from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    """Find maximum in each sliding window of size k in O(n) time."""
    result = []
    q = deque()  # stores indices, maintains descending values

    for i, n in enumerate(nums):
        # Remove elements outside current window boundary
        if q and q[0] <= i - k:
            q.popleft()

        # Maintain monotonic descending invariant
        while q and nums[q[-1]] < n:
            q.pop()
        q.append(i)

        # Append window max once window reaches size k
        if i >= k - 1:
            result.append(nums[q[0]])

    return result
```

## Common Interview Questions
1. *How does Python's Global Interpreter Lock (GIL) impact CPU-bound multi-threading?* (Only one thread executes Python bytecode at a time; use `multiprocessing` or native C extensions to achieve multi-core parallelism).
2. *Explain the difference between deep copy and shallow copy.* (Shallow copy duplicates the container structure but references the same child objects; deep copy recursively duplicates all nested objects).
3. *How is hash collision resolved in Python dictionaries?* (Python uses open addressing with quadratic probing and random probing perturbation).

## Documentation & Official Resources
- [Python 3 Official Documentation](https://docs.python.org/3/)
- [TimeComplexity - Python Wiki](https://wiki.python.org/moin/TimeComplexity)
