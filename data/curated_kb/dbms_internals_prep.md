# DBMS Internals & Transaction Concurrency

## Summary
Database management systems implement sophisticated storage engines, buffer pools, write-ahead logging (WAL), and multi-version concurrency control (MVCC) to ensure durability and high concurrency.

## Key Concepts
- **Storage Engines**: B+ Trees (optimized for range scans, page caching) vs LSM Trees (Log-Structured Merge trees, optimized for high write throughput like Cassandra and RocksDB).
- **WAL & Recovery**: Write-Ahead Logging rule (WAL page must reach disk before dirty data page), ARIES recovery algorithm (Analysis, Redo, Undo).
- **MVCC (Multi-Version Concurrency Control)**: Creating new row versions (`xmin`, `xmax`) on updates to allow non-blocking concurrent reads during writes.
- **Locking Mechanisms**: Shared (S) vs Exclusive (X) locks, Two-Phase Locking (2PL), Deadlock detection through Wait-For graphs.

## Worked Example: Understanding MVCC Isolation
```sql
-- Transaction A
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE user_id = 42; -- returns 1000

-- Transaction B (concurrent)
BEGIN;
UPDATE accounts SET balance = 1500 WHERE user_id = 42;
COMMIT;

-- Transaction A re-executes query
SELECT balance FROM accounts WHERE user_id = 42; -- still returns 1000 (snapshot isolation)
COMMIT;
```

## Common Interview Questions
1. *Why do relational databases use B+ Trees instead of standard Binary Search Trees?* (B+ Trees have high branching factors which minimize slow disk I/O seeks; leaf nodes are linked sequentially for fast range scans).
2. *What is the purpose of VACUUM in PostgreSQL?* (PostgreSQL MVCC leaves dead row tuples on disk after updates/deletes; VACUUM reclaims that storage space and updates statistics).
3. *What is Write-Ahead Logging (WAL) and why is it necessary?* (Modifying in-memory buffer pages without WAL risks data loss on power crash; sequential append-only WAL ensures ACID durability without slow random disk writes).

## Documentation & Official Resources
- [PostgreSQL Documentation - Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html)
