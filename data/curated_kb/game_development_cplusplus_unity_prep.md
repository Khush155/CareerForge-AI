# Game Development (C++ & Unity) Placement Preparation Guide

## Summary
Game development combines real-time systems programming, high-performance computing, interactive graphics rendering, and deterministic physics simulation. Whether building custom AAA game engines in modern C++ or shipping multiplatform titles in Unity (C#) and Unreal Engine, game developers operate under strict 16.6ms frame budgets (60 FPS) where latency, cache misses, and garbage collection pauses directly degrade user experience.

During placement evaluations for game studios and simulation engineering teams, candidates are examined on manual memory management, cache-coherent data layout (Data-Oriented Design / ECS), game loop orchestration, mathematical foundations (quaternions, linear algebra, vector math), and GPU rendering pipelines (vertex/fragment shaders, draw call batching).

Understanding the differences between Object-Oriented design and Data-Oriented cache hierarchies allows developers to optimize memory bandwidth and scale scenes to thousands of dynamic entities without frame rate stutter.

## Key Concepts
- **Deterministic Game Loop & Fixed Timestep**: Decoupling render frame rates (`Update`) from deterministic physics simulations (`FixedUpdate`). Accumulator patterns for interpolation, preventing physics tunneling, and managing clock drift across varying display refresh rates.
- **Modern C++ Memory Management & Optimization**: Stack vs. heap allocations, RAII, smart pointers (`std::unique_ptr`, `std::shared_ptr`), custom memory arenas, pool allocators, and avoiding runtime heap allocations in critical render/update paths.
- **Data-Oriented Design & Entity Component System (ECS)**: Contrast between OOP polymorphism (virtual method tables, pointer chasing, high cache miss rates) and Data-Oriented memory layouts (Structure of Arrays vs. Array of Structures, contiguous component buffers, SIMD vectorization).
- **Graphics Pipeline & Shaders**: Programmable graphics pipeline stages (Vertex, Geometry, Rasterization, Fragment/Pixel), draw call reduction via static/dynamic batching, GPU instancing, texture atlasing, and depth-buffer (Z-buffer) overdraw prevention.

## Worked Example: High-Performance Object Pool Allocator in C++
```cpp
// High-performance cache-friendly Object Pool Allocator in Modern C++ (C++17/20)
// Eliminates runtime heap allocation/deallocation overhead in frame loops.

#include <iostream>
#include <vector>
#include <memory>
#include <cassert>

struct Transform {
    float x{0.0f}, y{0.0f}, z{0.0f};
};

class Projectile {
public:
    Transform position;
    float velocity{100.0f};
    bool active{false};

    void spawn(float startX, float startY, float startZ) {
        position = {startX, startY, startZ};
        active = true;
    }

    void update(float deltaTime) {
        if (!active) return;
        position.z += velocity * deltaTime;
        // Deactivate when out of bounds
        if (position.z > 500.0f) {
            active = false;
        }
    }
};

template <typename T, size_t Capacity>
class ObjectPool {
private:
    std::vector<T> pool;
    std::vector<size_t> availableIndices;

public:
    ObjectPool() {
        pool.resize(Capacity);
        availableIndices.reserve(Capacity);
        for (size_t i = 0; i < Capacity; ++i) {
            availableIndices.push_back(i);
        }
    }

    T* acquire() {
        if (availableIndices.empty()) {
            return nullptr; // Pre-allocated capacity exhausted, prevents frame hitching
        }
        size_t index = availableIndices.back();
        availableIndices.pop_back();
        return &pool[index];
    }

    void release(T* object) {
        ptrdiff_t index = object - pool.data();
        assert(index >= 0 && static_cast<size_t>(index) < Capacity && "Pointer outside pool bounds");
        availableIndices.push_back(static_cast<size_t>(index));
    }

    size_t activeCount() const {
        return Capacity - availableIndices.size();
    }
};

int main() {
    constexpr size_t POOL_SIZE = 1000;
    ObjectPool<Projectile, POOL_SIZE> projectilePool;

    // Acquire and spawn bullet during frame update
    Projectile* bullet = projectilePool.acquire();
    if (bullet) {
        bullet->spawn(0.0f, 1.5f, 10.0f);
        std::cout << "[+] Bullet acquired from pool. Active entities: " << projectilePool.activeCount() << "\n";
        bullet->update(0.016f); // 60 FPS delta time
        projectilePool.release(bullet);
        std::cout << "[+] Bullet returned to pool. Active entities: " << projectilePool.activeCount() << "\n";
    }
    return 0;
}
```

## Common Interview Questions
1. *Why is `FixedUpdate` preferred over `Update` for physics calculations in game engines?* (`Update` runs once per rendered frame with variable delta time, which would cause non-deterministic physics, jitter, and collision pass-through; `FixedUpdate` executes at fixed, deterministic time intervals independent of frame rate fluctuations).
2. *Explain the performance downside of virtual function calls inside an entity update loop.* (Virtual calls require dereferencing the object's vtable pointer and dynamic dispatch, causing instruction pipeline stalls and CPU cache invalidations when iterating through large heterogenous collections of game entities).
3. *What is Quaternion SLERP and why are Quaternions used over Euler angles for rotations?* (Euler angles suffer from Gimbal Lock where loss of one degree of freedom occurs when two axes align. Quaternions represent 3D orientations in 4D hypercomplex space avoiding gimbal lock and enabling Spherical Linear Interpolation (SLERP) for smooth rotational animation).

## Documentation & Official Resources
- [Unity Official Documentation & Manual](https://docs.unity3d.com/Manual/index.html)
- [CppReference Modern C++ Standard](https://en.cppreference.com/w/)
- [Game Programming Patterns by Robert Nystrom](https://gameprogrammingpatterns.com/)
