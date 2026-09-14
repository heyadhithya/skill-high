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
