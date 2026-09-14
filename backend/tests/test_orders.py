from fastapi.testclient import TestClient

from app import create_app


def register(client: TestClient, email: str, name: str) -> None:
    response = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "safe-password-123",
        "display_name": name,
        "career_stage": "student",
        "timezone": "Asia/Kolkata",
    })
    assert response.status_code == 201, response.text


def login(client: TestClient, email: str) -> None:
    response = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "safe-password-123",
    })
    assert response.status_code == 200, response.text
    client.headers["X-CSRF-Token"] = client.cookies.get("sh_csrf", "")


def test_project_order_becomes_one_proof_record_after_repeated_completion() -> None:
    """Removing the completed-state guard would create duplicate proof records."""
    app = create_app(testing=True)
    with TestClient(app) as client:
        register(client, "client@skillhigh-demo.com", "Asha Client")
        client.headers["X-CSRF-Token"] = client.cookies.get("sh_csrf", "")
        client.post("/api/v1/auth/logout")
        register(client, "worker@skillhigh-demo.com", "Ravi Worker")
        client.post("/api/v1/skills", json={"name": "Poster design"})
        client.post("/api/v1/auth/logout")
        login(client, "client@skillhigh-demo.com")
        project = client.post("/api/v1/projects", json={
            "title": "Campus event poster",
            "description": "Create one poster for our cultural festival.",
            "amount_minor": 250000,
            "currency": "INR",
            "scale": "micro",
            "estimated_hours": 3,
            "required_skills": ["Poster design"],
        }).json()
        client.post("/api/v1/auth/logout")
        login(client, "worker@skillhigh-demo.com")
        application = client.post(f"/api/v1/projects/{project['id']}/applications").json()
        client.post("/api/v1/auth/logout")
        login(client, "client@skillhigh-demo.com")
        order = client.post(f"/api/v1/applications/{application['id']}/accept").json()
        client.post("/api/v1/auth/logout")
        login(client, "worker@skillhigh-demo.com")
        delivery = client.post(f"/api/v1/orders/{order['id']}/deliveries", json={
            "message": "First draft is ready.", "submission_url": "https://example.test/draft"
        }).json()
        client.post("/api/v1/auth/logout")
        login(client, "client@skillhigh-demo.com")
        completed = client.post(f"/api/v1/orders/{order['id']}/complete", json={"delivery_id": delivery["id"]})
        assert completed.status_code == 200, completed.text
        repeat = client.post(f"/api/v1/orders/{order['id']}/complete", json={"delivery_id": delivery["id"]})
        assert repeat.status_code == 409
        first_payment = client.post(f"/api/v1/payments/simulate/{order['id']}?event_id=payment-once&outcome=success")
        assert first_payment.status_code == 200
        duplicate_payment = client.post(f"/api/v1/payments/simulate/{order['id']}?event_id=payment-once&outcome=success")
        assert duplicate_payment.json()["duplicate"] is True
        first_review = client.post(f"/api/v1/orders/{order['id']}/reviews", json={"rating": 5, "body": "Clear brief and quick approval."})
        assert first_review.status_code == 201
        duplicate_review = client.post(f"/api/v1/orders/{order['id']}/reviews", json={"rating": 5, "body": "Duplicate review."})
        assert duplicate_review.status_code == 409
        client.post("/api/v1/auth/logout")
        login(client, "worker@skillhigh-demo.com")
        proof = client.get("/api/v1/me/proof").json()
        assert len(proof) == 1
        assert proof[0]["order_id"] == order["id"]


def test_only_latest_delivery_can_be_accepted_after_revision() -> None:
    with TestClient(create_app(testing=True)) as client:
        register(client, "client-latest@skillhigh-demo.com", "Client Latest")
        client.post("/api/v1/auth/logout")
        register(client, "worker-latest@skillhigh-demo.com", "Worker Latest")
        client.post("/api/v1/skills", json={"name": "Poster design"})
        client.post("/api/v1/auth/logout")
        login(client, "client-latest@skillhigh-demo.com")
        project = client.post("/api/v1/projects", json={
            "title": "Latest delivery test", "description": "Create one poster and revise it once.",
            "amount_minor": 10000, "currency": "INR", "scale": "micro", "estimated_hours": 2,
            "required_skills": ["Poster design"],
        }).json()
        client.post("/api/v1/auth/logout")
        login(client, "worker-latest@skillhigh-demo.com")
        application = client.post(f"/api/v1/projects/{project['id']}/applications").json()
        client.post("/api/v1/auth/logout")
        login(client, "client-latest@skillhigh-demo.com")
        order = client.post(f"/api/v1/applications/{application['id']}/accept").json()
        client.post("/api/v1/auth/logout")
        login(client, "worker-latest@skillhigh-demo.com")
        first = client.post(f"/api/v1/orders/{order['id']}/deliveries", json={"message": "First", "submission_url": "https://example.test/first"}).json()
        client.post("/api/v1/auth/logout")
        login(client, "client-latest@skillhigh-demo.com")
        assert client.post(f"/api/v1/orders/{order['id']}/request-revision").status_code == 200
        client.post("/api/v1/auth/logout")
        login(client, "worker-latest@skillhigh-demo.com")
        second = client.post(f"/api/v1/orders/{order['id']}/deliveries", json={"message": "Second", "submission_url": "https://example.test/second"}).json()
        client.post("/api/v1/auth/logout")
        login(client, "client-latest@skillhigh-demo.com")
        old = client.post(f"/api/v1/orders/{order['id']}/complete", json={"delivery_id": first["id"]})
        assert old.status_code == 422
        accepted = client.post(f"/api/v1/orders/{order['id']}/complete", json={"delivery_id": second["id"]})
        assert accepted.status_code == 200, accepted.text
        detail = client.get(f"/api/v1/orders/{order['id']}").json()
        assert detail["deliveries"][-1]["id"] == second["id"]


def test_simulator_requires_funding_and_cannot_overwrite_settlement() -> None:
    with TestClient(create_app(testing=True)) as client:
        register(client, "fund-buyer@skillhigh-demo.com", "Fund Buyer")
        client.post("/api/v1/auth/logout")
        register(client, "fund-worker@skillhigh-demo.com", "Fund Worker")
        client.headers["X-CSRF-Token"] = client.cookies.get("sh_csrf", "")
        service = client.post("/api/v1/services", json={
            "title": "Funded service", "description": "A service for payment state checks.",
            "amount_minor": 12000, "estimated_hours": 2, "currency": "INR", "skills": ["Writing"],
        }).json()
        client.post("/api/v1/auth/logout")
        login(client, "fund-buyer@skillhigh-demo.com")
        order = client.post(f"/api/v1/services/{service['id']}/orders").json()
        assert client.post(f"/api/v1/payments/simulate/{order['id']}?event_id=before-payout&outcome=payout").status_code == 409
        client.post("/api/v1/auth/logout")
        login(client, "fund-worker@skillhigh-demo.com")
        assert client.post(f"/api/v1/orders/{order['id']}/accept").status_code == 200
        delivery = client.post(f"/api/v1/orders/{order['id']}/deliveries", json={"message": "Final work", "submission_url": "https://example.test/final"}).json()
        client.post("/api/v1/auth/logout")
        login(client, "fund-buyer@skillhigh-demo.com")
        assert client.post(f"/api/v1/orders/{order['id']}/complete", json={"delivery_id": delivery["id"]}).status_code == 200
        assert client.post(f"/api/v1/payments/simulate/{order['id']}?event_id=settle&outcome=payout").status_code == 409
        assert client.post(f"/api/v1/payments/simulate/{order['id']}?event_id=fund&outcome=success").status_code == 200
        assert client.post(f"/api/v1/payments/simulate/{order['id']}?event_id=settle&outcome=payout").status_code == 200
        duplicate = client.post(f"/api/v1/payments/simulate/{order['id']}?event_id=settle&outcome=payout")
        assert duplicate.status_code == 200 and duplicate.json()["duplicate"] is True
        assert client.post(f"/api/v1/payments/simulate/{order['id']}?event_id=settle&outcome=refund").status_code == 409
        assert client.post(f"/api/v1/payments/simulate/{order['id']}?event_id=late-failure&outcome=failure").status_code == 409
