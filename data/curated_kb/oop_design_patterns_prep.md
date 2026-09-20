# Object-Oriented Design & GoF Patterns

## Summary
Clean software engineering applies SOLID design principles and proven Gang of Four (GoF) design patterns to create maintainable, testable, and loosely-coupled codebases.

## Key Concepts
- **SOLID Principles**: Single Responsibility, Open/Closed (open for extension, closed for modification), Liskov Substitution, Interface Segregation, Dependency Inversion.
- **Creational Patterns**: Factory Method, Abstract Factory, Builder, Singleton (with thread safety).
- **Structural Patterns**: Adapter (translating incompatible interfaces), Decorator (dynamic feature wrapping), Composite, Proxy.
- **Behavioral Patterns**: Strategy (interchangeable algorithms), Observer (pub/sub events), Command, State.

## Worked Example: Strategy Pattern in Python
```python
from abc import ABC, abstractmethod

class PricingStrategy(ABC):
    @abstractmethod
    def calculate_price(self, base_price: float) -> float:
        pass

class RegularPricing(PricingStrategy):
    def calculate_price(self, base_price: float) -> float:
        return base_price

class StudentDiscountPricing(PricingStrategy):
    def calculate_price(self, base_price: float) -> float:
        return base_price * 0.75  # 25% discount

class CheckoutContext:
    def __init__(self, strategy: PricingStrategy):
        self.strategy = strategy

    def execute_payment(self, base_price: float) -> float:
        return self.strategy.calculate_price(base_price)
```

## Common Interview Questions
1. *Explain the Open/Closed Principle with a practical example.* (Classes should allow new functionality without altering existing tested source code; accomplished using interfaces or abstract base classes rather than long `if/elif` chains).
2. *What is the difference between Composition and Inheritance?* (Inheritance creates tight compile-time coupling ("is-a"); Composition achieves flexibility by wrapping independent components ("has-a") and swapping behaviors at runtime).
3. *Why is the Singleton pattern often considered an anti-pattern in modern applications?* (Introduces global mutable state, tightly couples classes, and hinders parallel unit testing without dependency injection frameworks).

## Documentation & Official Resources
- [Refactoring.Guru - Design Patterns](https://refactoring.guru/design-patterns)
