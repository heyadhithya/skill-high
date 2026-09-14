# Sample Data and Test Cases

## Seed data

Run `uv run python backend/seed.py` after migrations. It is repeatable: it creates missing records and leaves existing matching seed records intact. It refuses to run when `APP_ENV=production`.

| Role          | Name        | Email                        | Password             |
| ------------- | ----------- | ---------------------------- | -------------------- |
| Administrator | Aarav Admin | `admin@skillhigh-campus.com` | `skillhigh-demo-123` |
| Worker        | Ravi Mehta  | `ravi@skillhigh-campus.com`  | `skillhigh-demo-123` |
| Worker        | Nila Shah   | `nila@skillhigh-campus.com`  | `skillhigh-demo-123` |
| Worker        | Ishan Rao   | `ishan@skillhigh-campus.com` | `skillhigh-demo-123` |
| Worker        | Tara Sen    | `tara@skillhigh-campus.com`  | `skillhigh-demo-123` |
| Worker        | Kabir Das   | `kabir@skillhigh-campus.com` | `skillhigh-demo-123` |
| Client        | Maya Kapoor | `maya@skillhigh-campus.com`  | `skillhigh-demo-123` |

The seed also creates these fictional records:

| Resource | Owner       | Details |
| -------- | ----------- | ------- |
| Services | Ravi Mehta  | Campus event poster (₹1,800, 3h), Social media launch kit (₹2,400, 5h) |
| Services | Nila Shah   | Responsive portfolio website (₹6,500, 12h), Website mobile layout review (₹2,200, 4h) |
| Services | Ishan Rao   | Short-form video edit (₹2,800, 5h) |
| Services | Tara Sen    | Clear website copy (₹2,000, 4h), Pitch deck layout (₹3,200, 6h) |
| Service  | Kabir Das   | Product photo cleanup (₹1,600, 3h) |
| Projects | Maya Kapoor | Landing page polish (₹3,500, 8h), Research report proofreading (₹1,500, 3h), Club launch video (₹3,000, 6h), Sponsor presentation refresh (₹2,400, 5h) |

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
| `test_marketplace.py::test_marketplace_discovery_hiring_and_private_reads`                    | A worker publishes a service, applies to a project, and the owner accepts it.                         | Public person fields stay private; applicant/order reads are owner-only; delivery links are HTTP(S)-only; seller review aggregate reflects client reviews only. |
| `test_orders.py::test_only_latest_delivery_can_be_accepted_after_revision`                   | A client requests a revision after a first delivery and tries to accept the obsolete delivery.       | The obsolete delivery returns HTTP 422; only the latest delivery completes the order.                             |

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
