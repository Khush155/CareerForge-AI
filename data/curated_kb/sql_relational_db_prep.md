# SQL & Relational Databases Interview Preparation Guide

## Overview
Relational database management systems (RDBMS) such as PostgreSQL and MySQL form the data backbone of modern web applications.

## Core Topics
1. **Relational Schemas & Normalization**:
   - 1NF, 2NF, 3NF, and BCNF: eliminating redundancy, maintaining referential integrity.
   - Primary Keys, Foreign Keys, Unique Constraints, and Cascading rules.

2. **Querying & Joins**:
   - Inner Join vs Left/Right/Full Outer Joins.
   - Window Functions: `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`, `LEAD()`, `LAG()`.
   - Aggregations and `HAVING` vs `WHERE` clauses.

3. **Performance, Indexing & Optimization**:
   - B-Tree Indexing mechanics: single-column vs composite indices, left-most prefix rule.
   - Query execution plans: `EXPLAIN ANALYZE`, table scans vs index scans.
   - ACID Properties: Atomicity, Consistency, Isolation levels (Read Committed, Repeatable Read, Serializable), and Durability.

## Practice Resources
- PostgreSQL Official Documentation: [Indexes](https://www.postgresql.org/docs/current/indexes.html)
- LeetCode Database Problem Set (Top 50 SQL)
- Mode Analytics SQL Tutorial for Data Analysis
