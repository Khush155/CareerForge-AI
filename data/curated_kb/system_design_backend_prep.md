# System Design & Backend Architecture Preparation Guide

## Overview
System design interviews evaluate your ability to architect scalable, resilient, and maintainable distributed applications.

## Core Topics
1. **API Architecture & Communication**:
   - RESTful API conventions: HTTP methods, idempotency, status codes, pagination.
   - WebSockets vs Server-Sent Events (SSE) for real-time communication.
   - Message Queues (RabbitMQ, Kafka) for asynchronous decoupling and worker pools.

2. **Scalability & Performance**:
   - Horizontal vs Vertical scaling; stateless application tier behind reverse proxies (Nginx).
   - In-memory Caching: Redis patterns (Cache-Aside, Write-Through, Write-Back) and TTL eviction policies.
   - Database partitioning, sharding, and Read Replicas for high read-throughput.

3. **Reliability & Security**:
   - Rate Limiting: Token Bucket, Leaky Bucket algorithms.
   - Authentication: JWT tokens, OAuth2 flows, Refresh token rotation, and RBAC authorization.
   - Observability: Structured logging, distributed tracing (OpenTelemetry), health checks.

## Practice Resources
- Alex Xu: *System Design Interview – An Insider's Guide*
- Roadmap.sh: [Backend Developer Roadmap](https://roadmap.sh/backend)
- ByteByteGo Architecture Guides
