# Operating Systems Core Fundamentals

## Summary
Operating systems manage hardware abstractions, process execution, memory protection, and system call scheduling. Understanding OS internals is critical for systems programming and backend debugging.

## Key Concepts
- **Processes vs Threads**: PCB (Process Control Block), address space separation, context switching overhead, kernel threads vs user-level coroutines.
- **Memory Management**: Virtual memory, Paging, Page Tables, TLB (Translation Lookaside Buffer), Page Fault handling, and Demand Paging.
- **Concurrency & Synchronization**: Race conditions, Mutex vs Semaphore, Spinlocks, Deadlock conditions (Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait), and Deadlock prevention.
- **CPU Scheduling**: Preemptive vs Non-preemptive, Round Robin, Multi-Level Feedback Queues (MLFQ), and CFS (Completely Fair Scheduler).

## Worked Example: Producer-Consumer with Semaphore (Python)
```python
import threading
import time
from collections import deque

buffer = deque(maxlen=5)
empty = threading.Semaphore(5)  # Tracks empty slots
full = threading.Semaphore(0)   # Tracks filled slots
mutex = threading.Lock()

def producer(items: list[int]):
    for item in items:
        empty.acquire()
        with mutex:
            buffer.append(item)
        full.release()

def consumer(n_items: int):
    consumed = []
    for _ in range(n_items):
        full.acquire()
        with mutex:
            val = buffer.popleft()
            consumed.append(val)
        empty.release()
    return consumed
```

## Common Interview Questions
1. *What happens during an OS context switch?* (The CPU saves current register state, program counter, and stack pointer to the current PCB/TCB, changes MMU virtual memory mappings, and loads the new process state).
2. *Explain Thrashing in virtual memory.* (When physical memory is exhausted and the OS spends more CPU cycles swapping pages in and out of disk swap space than executing actual user code).
3. *What is a Zombie Process vs Orphan Process?* (Zombie: process has finished execution but parent has not yet read exit status via `wait()`; Orphan: parent process exited before child, adopted by `init` / `systemd`).

## Documentation & Official Resources
- [Operating Systems: Three Easy Pieces (OSTEP)](https://pages.cs.wisc.edu/~remzi/OSTEP/)
