# System Design & Scalable Architecture

## Summary
System design evaluates how engineers architect distributed, fault-tolerant, high-concurrency systems handling millions of daily requests while balancing CAP theorem trade-offs.

## Key Concepts
- **Scalability Principles**: Horizontal vs Vertical scaling, Stateless application tiers, DNS Anycast routing, Load Balancing algorithms (Round Robin, Least Connections, Consistent Hashing).
- **Caching Strategies**: Cache-aside, Read-through, Write-through, Write-back, Cache invalidation techniques, and Redis data structures.
- **Database Partitioning**: Sharding strategies (hash-based, range-based), Read-replica architectures, master-slave replication lag, and connection pooling.
- **Asynchronous Processing**: Message brokers (Kafka, RabbitMQ), Event-driven architecture, Dead Letter Queues (DLQ), and idempotent consumer design.

## Worked Example: Consistent Hashing Node Ring
```python
import hashlib

class ConsistentHashRing:
    """Distributes keys across N nodes with minimal remapping upon node scale."""
    def __init__(self, nodes: list[str] = None, replicas: int = 3):
        self.replicas = replicas
        self.ring: dict[int, str] = {}
        self.sorted_keys: list[int] = []
        for node in (nodes or []):
            self.add_node(node)

    def _hash(self, key: str) -> int:
        return int(hashlib.md5(key.encode('utf-8')).hexdigest(), 16)

    def add_node(self, node: str) -> None:
        for i in range(self.replicas):
            h = self._hash(f"{node}:{i}")
            self.ring[h] = node
            self.sorted_keys.append(h)
        self.sorted_keys.sort()

    def get_node(self, key: str) -> str | None:
        if not self.ring:
            return None
        h = self._hash(key)
        for node_hash in self.sorted_keys:
            if h <= node_hash:
                return self.ring[node_hash]
        return self.ring[self.sorted_keys[0]]  # wrap around ring
```

## Common Interview Questions
1. *Explain the CAP Theorem and practical trade-offs.* (A distributed system can guarantee at most two of Consistency, Availability, and Partition Tolerance. In network partitions, systems must choose between serving potentially stale data (AP) or erroring out (CP)).
2. *How do you prevent Cache Stampede (Thundering Herd)?* (Use distributed mutex locking around cache misses, probabilistically early background recomputation, or pre-warmed cron cache jobs).
3. *What is Database Sharding vs Replication?* (Replication copies identical data across multiple nodes for read throughput and redundancy; Sharding splits distinct rows across nodes to scale write throughput and memory limits).

## Documentation & Official Resources
- [The System Design Primer - GitHub](https://github.com/donnemartin/system-design-primer)
- [Martin Kleppmann - Designing Data-Intensive Applications](https://dataintensive.net/)
