# RESTful API Design & Best Practices

## Summary
RESTful APIs provide structured, stateless communication between client applications and server backends following HTTP semantics, resource naming conventions, and predictable error payloads.

## Key Concepts
- **HTTP Verbs & Idempotency**: `GET` (safe, idempotent), `POST` (unsafe, non-idempotent), `PUT` (unsafe, idempotent replacement), `PATCH` (unsafe, partial update), `DELETE` (unsafe, idempotent).
- **Status Codes**: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 500 Internal Error.
- **Pagination & Filtering**: Cursor-based vs Offset-based pagination, rate-limiting headers (`RateLimit-Limit`, `RateLimit-Remaining`, `Retry-After`).
- **Security & Versioning**: URI versioning (`/api/v1/`), CORS headers, OAuth 2.0 Bearer tokens, and input sanitization against injection.

## Worked Example: Standardized Error & Response Envelopes
```json
// Consistent API Error Response (HTTP 422)
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid student proficiency rating.",
    "details": [
      {
        "field": "proficiency",
        "issue": "Input should be less than or equal to 5.0"
      }
    ]
  }
}
```

## Common Interview Questions
1. *What is the difference between `PUT` and `PATCH`?* (`PUT` replaces the entire target resource with the new representation; `PATCH` applies partial modifications to specific fields).
2. *Why is cursor-based pagination preferred over offset-based pagination in large datasets?* (Offset pagination degrades to O(N) as offset increases because the database must scan and skip previous rows; cursor pagination uses index seeks O(log N) based on unique sort keys).
3. *What makes an HTTP method 'Idempotent'?* (An operation is idempotent if executing it multiple times produces the exact same server state as executing it once).

## Documentation & Official Resources
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)
- [RFC 7231 - HTTP/1.1 Semantics and Content](https://datatracker.ietf.org/doc/html/rfc7231)
