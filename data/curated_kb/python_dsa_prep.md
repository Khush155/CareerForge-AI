# Python & Data Structures Interview Preparation Guide

## Overview
Python is a primary language for backend systems, data pipelines, and technical coding interviews.
Mastery requires understanding runtime complexity, memory behavior, and idioms.

## Core Topics
1. **Time and Space Complexity**:
   - Lists: $O(1)$ append/pop from end, $O(n)$ search and insert from front.
   - Dictionaries and Sets: $O(1)$ average hash-table lookup, amortized insertion.
   - Deque (`collections.deque`): $O(1)$ append/pop from both left and right.

2. **Essential Algorithms**:
   - Binary Search: $O(\log n)$ search on sorted collections; boundary conditions.
   - Two Pointers & Sliding Window: Array substrings, sums, and target subarray patterns.
   - Graph Traversal: BFS (shortest path in unweighted graphs) and DFS (cycle detection, backtracking).

3. **Python Idioms & Performance**:
   - List comprehensions vs generators: generators conserve memory for large streams.
   - Decorators, context managers (`with` statement), and `asyncio` fundamentals.

## Practice Resources
- LeetCode Top Interview 150 (Array, Hashmap, Two Pointers)
- NeetCode Roadmap: Core Data Structures and Algorithms
- Official Docs: [Python Data Structures](https://docs.python.org/3/tutorial/datastructures.html)
