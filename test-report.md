# Test Report

This report records the available verification evidence for the Car Dealership Inventory System. It does not claim live Supabase or browser E2E success where those checks were not executed.

## Environment

- Repository: Car Dealership Inventory System
- Test date: 2026-10-25
- Node/npm execution environment: Windows workspace
- Real environment files and credential values were not printed or included.

## Executed commands and results

| Command | Result | Evidence |
|---|---|---|
| `npm run lint` | PASS | ESLint completed with no errors or warnings. |
| `npm run lint:backend` | PASS | Backend lint completed successfully. |
| `npm run lint:frontend` | PASS | Frontend lint completed successfully. |
| `npm --workspace backend test` | PASS | 6 test files, 61 tests passed, including checkout, idempotency, ownership, rollback, concurrent final-unit order tests, detailed registration/profile persistence, and vehicle detail lookup. |
| `npm --workspace frontend test` | PASS | 8 test files, 20 tests passed, including detailed registration validation, admin-login role rejection, app-level detail routing, cart quantity/removal behavior, redesigned filters, card links, image fallback, and footer contact links. |
| `npm run build` | PASS | Backend `tsc` passed; frontend `tsc -b` and Vite build passed. |
| Local checkout/order API tests | PASS | Server-priced totals, stock limits, rollback, idempotency, ownership, admin visibility, and concurrent final-unit behavior are covered with an isolated repository test double. |
| Compiled backend startup and `GET /api/health` | PASS | HTTP 200 with service status response. |
| Read-only Supabase vehicle count | PASS | The configured dedicated project responded successfully; current vehicle count is 15 after seeding. |
| Live `GET /api/health` | PASS | HTTP 200 while the local backend was running. |
| Live unauthenticated `GET /api/vehicles` | PASS | HTTP 401, confirming the protected route is reachable. |
| Live frontend HTTP availability | PASS | Vite returned HTTP 200 on `http://localhost:5173`. |
| Demo seed safety guard | PASS | The unconfirmed run stopped before inserts; no records were written without the demo marker. |
| Authorized demo seed | PASS | 15 fixed-ID vehicles inserted; no existing vehicle records were overwritten or deleted. |
| Second demo seed | PASS | 0 inserted, 15 left unchanged, 15 verified. |
| Live Express vehicle listing | PASS | Authenticated request returned HTTP 200 with 15 vehicles, including Nissan Leaf SV Plus at zero stock. |

Backend tests include authentication, vehicle API, inventory operations, validation, authorization, database-error handling, and concurrent final-unit purchase behavior through isolated repository test doubles.

Frontend tests include authentication form behavior, vehicle filters, vehicle card behavior, disabled purchase behavior, loading/error behavior, and admin UI behavior using mocked API responses.

The detail-page tests cover loading by route ID, not-found handling, zero-stock restrictions, the card’s detail URL, add-to-cart separation, and the footer’s mailto/tel links. Browser-level direct refresh and image rendering remain unverified because no browser automation runtime is configured.

Registration tests cover profile persistence, email normalization, phone/password validation, duplicate email handling, Argon2 hashing, and role escalation attempts. Admin-login component tests cover rejecting non-admin sessions and accepting an admin session. Admin dashboard metrics are computed from the fetched vehicle catalog; live Supabase dashboard CRUD remains NOW VERIFIED.

## Known warnings

- Frontend Vitest runs emit Node’s experimental localStorage warning. Tests still pass.
- Expected inventory database-error tests log the generic `Unhandled request error` message from the error handler while asserting the safe HTTP response.

## TDD evidence

The repository preserves meaningful test-first commits for the main backend milestones:

| TDD stage | Commit evidence |
|---|---|
| Authentication tests written first | `b871b33 test: define authentication behavior` |
| Authentication implementation | `8821000 feat: implement database-backed authentication` |
| Vehicle tests written first | `f6657e5 test: define vehicle management behavior` |
| Vehicle implementation | `469a0e6 feat: implement vehicle management API` |
| Inventory tests written first | `465ac47 test: define inventory operations behavior` |
| Inventory implementation | `c1339cd feat: add atomic inventory operations` |

This demonstrates the Red → Green → Refactor sequence through repository history and passing regression tests. The original terminal output from the initial failing Red runs was not captured in Git, so the exact historical failure output cannot be independently reproduced from the repository alone. The current test suite is green after implementation and refactoring.

## Coverage

Measured coverage: **NOT AVAILABLE**. No coverage command or coverage threshold is configured in the repository, so no percentage is reported.

## Not verified

These items require applying the reviewed migration to the dedicated Supabase project and a browser runtime. No order tables or order data were created remotely by this implementation pass.
