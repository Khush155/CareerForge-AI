# DSA Core Patterns & Problem-Solving Strategies

## Summary
Technical coding interviews evaluate pattern recognition across recurring algorithmic templates. Mastering core templates (Two Pointers, BFS/DFS, Top-K Heap, DP) allows solving novel LeetCode problems predictably.

## Key Concepts
- **Two Pointers & Sliding Window**: Sorted array search, container with most water, longest substring without repeating characters.
- **Fast & Slow Pointers (Floyd's Cycle Finding)**: Linked list cycle detection, finding middle node, duplicate number detection.
- **Tree & Graph Traversals**: Level-order BFS (queue), Depth-First Pre/In/Post-order (stack/recursion), Topological Sort (Kahn's algorithm).
- **Dynamic Programming Top-Down vs Bottom-Up**: Memoization vs Tabulation, 0/1 Knapsack, Longest Common Subsequence (LCS), Edit Distance.

## Worked Example: Topological Sort (Kahn's Algorithm)
```python
from collections import deque

def topological_sort(num_courses: int, prerequisites: list[list[int]]) -> list[int]:
    """Determine topological dependency ordering for course prerequisites."""
    in_degree = [0] * num_courses
    adj = [[] for _ in range(num_courses)]

    for dest, src in prerequisites:
        adj[src].append(dest)
        in_degree[dest] += 1

    q = deque([i for i in range(num_courses) if in_degree[i] == 0])
    order = []

    while q:
        curr = q.popleft()
        order.append(curr)
        for neighbor in adj[curr]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                q.append(neighbor)

    return order if len(order) == num_courses else []  # Empty if cycle detected
```

## Common Interview Questions
1. *When should you use BFS instead of DFS on a graph?* (Use BFS when finding the shortest path on unweighted graphs or searching level-by-level; use DFS for topological sorting, cycle detection, or exhaustive branch backtracking).
2. *What is the difference between Memoization and Tabulation?* (Memoization is top-down recursion saving subproblem results on the call stack; Tabulation is bottom-up iterative filling of a DP table, avoiding recursion stack overflow).
3. *How do you detect a cycle in a directed graph?* (Use Kahn's algorithm in-degree counting or DFS with 3-state node coloring: unvisited (0), visiting in recursion stack (1), completely processed (2)).

## Documentation & Official Resources
- [LeetCode Explore - Top Interview Questions](https://leetcode.com/explore/)
