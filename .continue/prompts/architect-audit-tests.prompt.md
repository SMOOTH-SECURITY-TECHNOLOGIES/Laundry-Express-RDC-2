Audit the integration tests in this repository.

Determine:
- which tests reflect the real current contract
- which tests are outdated
- which fixtures are structurally invalid
- which async fixtures are broken or misused
- which critical business flows are missing coverage

Do not just fix syntax.
Explain whether the test suite is a trustworthy safety net or a misleading one.

Then propose:
1. tests to delete or rewrite
2. canonical fixtures/factories to introduce
3. critical coverage gaps
