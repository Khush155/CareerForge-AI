# SQL & Relational Database Architecture

## Summary
Relational Database Management Systems (PostgreSQL, MySQL) underpin enterprise applications. Mastering query planning, schema normalization, ACID concurrency, and indexing guarantees scalable backend throughput.

## Key Concepts
- **ACID Transactions**: Atomicity, Consistency, Isolation (Read Committed, Repeatable Read, Serializable), Durability via Write-Ahead Logging (WAL).
- **Indexing Architecture**: B-Tree indices, composite index leftmost-prefix rule, partial indices, covered queries, and `EXPLAIN ANALYZE` inspection.
- **Advanced Querying**: Window functions (`ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`, `LEAD()`, `LAG()`), recursive CTEs, and lateral joins.
- **Schema Normalization**: 1NF to 3NF/BCNF normalization tradeoffs vs denormalization for read-heavy reporting.

## Worked Example: High-Performance Windowing & Indexing
```sql
-- Efficient pagination and ranking over partitioned student grades
WITH RankedScores AS (
    SELECT 
        student_id,
        course_id,
        score,
        DENSE_RANK() OVER (PARTITION BY course_id ORDER BY score DESC) as rank_in_course
    FROM exam_submissions
    WHERE submitted_at >= NOW() - INTERVAL '30 days'
)
SELECT student_id, course_id, score, rank_in_course
FROM RankedScores
WHERE rank_in_course <= 3;
```

## Common Interview Questions
1. *What is the difference between `WHERE` and `HAVING` clauses?* (`WHERE` filters individual rows prior to aggregation; `HAVING` filters aggregated groups).
2. *Why does a composite index on `(last_name, first_name)` not accelerate a query filtering solely on `first_name`?* (B-tree indices order keys sequentially; skipping the leading column prevents logarithmic range tree traversal).
3. *What is a phantom read vs non-repeatable read?* (Non-repeatable read: re-reading a row gets updated values; Phantom read: re-executing a range query returns newly inserted rows).

## Documentation & Official Resources
- [PostgreSQL Documentation - Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)
- [Mode Analytics SQL Reference](https://mode.com/sql-tutorial/)
