Analyze the real API contract of this repository.

Compare:
- SQLAlchemy models
- Pydantic schemas
- FastAPI routes
- integration test payloads
- frontend request/response handling

For each mismatch, output:
- entity
- expected shape
- actual conflicting usage
- severity
- recommended fix

Focus first on:
- auth
- users/profile
- orders
- payments
- disputes/refunds
