# Sample Data and Test Cases

## Seed data

Run `uv run python backend/seed.py` after migrations. It is repeatable: it creates missing records and leaves existing matching seed records intact. It refuses to run when `APP_ENV=production`.

| Role          | Name        | Email                        | Password             |
| ------------- | ----------- | ---------------------------- | -------------------- |
| Administrator | Aarav Admin | `admin@skillhigh-campus.com` | `skillhigh-demo-123` |
| Worker        | Ravi Mehta  | `ravi@skillhigh-campus.com`  | `skillhigh-demo-123` |
| Client        | Maya Kapoor | `maya@skillhigh-campus.com`  | `skillhigh-demo-123` |

The seed also creates these fictional records:

| Resource | Owner       | Details                                                        |
| -------- | ----------- | -------------------------------------------------------------- |
| Skill    | Ravi Mehta  | Poster design (strong), Frontend development (working)         |
| Service  | Ravi Mehta  | Campus event poster, ₹1,800.00, estimated 3 hours              |
| Project  | Maya Kapoor | Landing page polish, ₹3,500.00, small scale, estimated 8 hours |

No seed account, password, or payment activity is for production use.

## Automated integration tests

Run the suite with:

```bash
uv run pytest backend/tests -q
```

The test app creates or uses `skillhigh_test` and resets only that database. It will refuse a test URL that points at the development database.

| Test                                                                                           | Scenario                                                                                              | Expected result                                                                                                     |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `test_account_and_access.py::test_profile_can_be_updated_without_changing_admin_access`        | A signed-in member submits a profile update containing `is_admin`.                                    | Profile fields change; administrator access remains false.                                                          |
| `test_account_and_access.py::test_non_participant_cannot_read_another_users_order`             | A third user requests an order belonging to a client and worker.                                      | HTTP 403.                                                                                                           |
| `test_orders.py::test_project_order_becomes_one_proof_record_after_repeated_completion`        | A client accepts an application, accepts delivery twice, sends duplicate payment and review requests. | First completion succeeds; repeat completion and review fail; one proof record and idempotent payment event remain. |
| `test_cancellation.py::test_active_order_cancellation_blocks_simulated_payout`                 | A provider accepts and cancels a service order; the client requests a payout.                         | Order becomes cancelled and payout returns HTTP 409.                                                                |
| `test_password_reset.py::test_password_reset_uses_local_mail_sink_without_returning_the_token` | A user requests a reset and uses the local-mail token.                                                | API response does not expose the token; reset and new-password login work.                                          |
| `test_database_isolation.py::test_testing_database_never_defaults_to_the_development_database` | Test database URL is omitted.                                                                         | Test URL derives to `skillhigh_test`, not `skillhigh_dev`.                                                          |

## Manual acceptance path

Use a private/incognito window or sign out between roles.

1. Sign in as Maya, create a project, then sign out.
2. Sign in as Ravi, add the required skill if needed, and apply to Maya's project.
3. Sign back in as Maya and accept Ravi's application. The project becomes assigned and an active order appears.
4. Sign in as Ravi, send a message and submit a delivery URL.
5. Sign in as Maya, request a revision. Verify the order returns to active.
6. Sign in as Ravi and submit a revised delivery. Sign in as Maya and accept that delivery.
7. Verify Ravi has one Proof-of-Work record, then leave a review from Maya.
8. For the dispute path, open a dispute before completion, verify completion is blocked, then resolve it as Aarav Admin and complete the order.
9. For the payment path, use a unique event ID with the local simulator. Reusing it must return `duplicate: true` without changing financial state again.

## Smoke checks

```bash
curl http://127.0.0.1:8000/api/v1/health
bun run build
```

The health response is `{"status":"ok"}`. The production build validates the Next.js TypeScript application.
