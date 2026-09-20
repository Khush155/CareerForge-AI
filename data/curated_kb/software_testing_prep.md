# Software Testing, TDD & QA Automation

## Summary
Quality engineering verifies software reliability through automated test pyramids spanning fast unit tests, isolated integration tests, and deterministic end-to-end browser workflows.

## Key Concepts
- **The Test Pyramid**: High volume of fast Unit Tests -> Moderate volume of Integration Tests -> Lean set of critical End-to-End (E2E) regression journeys.
- **Test-Driven Development (TDD)**: Red (write failing test) -> Green (write minimal code to pass) -> Refactor (clean up while tests stay green).
- **Test Doubles**: Dummies, Stubs (fixed response), Spies (record calls), Mocks (assert interaction expectations), and Fakes (in-memory SQLite implementations).
- **Code Coverage**: Statement coverage, Branch coverage, Mutation testing, and avoiding superficial 100% assertion-free coverage traps.

## Worked Example: Pytest Property Test with Boundary Clamping
```python
import pytest

def clamp_proficiency(val: float) -> float:
    return max(0.0, min(5.0, round(val, 1)))

@pytest.mark.parametrize("input_val, expected", [
    (-2.5, 0.0),
    (0.0, 0.0),
    (3.42, 3.4),
    (4.99, 5.0),
    (12.0, 5.0)
])
def test_clamp_proficiency_bounds(input_val, expected):
    assert clamp_proficiency(input_val) == expected
```

## Common Interview Questions
1. *What is the difference between a Mock and a Stub?* (A stub returns pre-canned data when called without validating expectations; a mock records invocations and actively asserts that specific methods were called with specific parameters).
2. *What is Mutation Testing?* (A technique where small code changes/mutations like flipping `<` to `>` are automatically injected into source code to verify that test suites catch the mutations).
3. *Why should unit tests never make external network calls?* (Network calls introduce flakiness, latency, external rate limits, and test order dependencies; external APIs should be replaced with test doubles).

## Documentation & Official Resources
- [Martin Fowler - Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Pytest Official Documentation](https://docs.pytest.org/)
