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
    client.headers["X-CSRF-Token"] = client.cookies.get("sh_csrf", "")


def login(client: TestClient, email: str) -> None:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "safe-password-123"})
    assert response.status_code == 200, response.text
    client.headers["X-CSRF-Token"] = client.cookies.get("sh_csrf", "")


def test_marketplace_discovery_hiring_and_private_reads() -> None:
    with TestClient(create_app(testing=True)) as client:
        register(client, "client-marketplace@skillhigh-demo.com", "Maya Client")
        project = client.post("/api/v1/projects", json={
            "title": "Design a club poster",
            "description": "Create one clear poster for our student club event.",
            "amount_minor": 180000,
            "currency": "INR",
            "scale": "micro",
            "estimated_hours": 3,
            "required_skills": ["Poster design"],
        }).json()
        client.post("/api/v1/auth/logout")

        register(client, "worker-marketplace@skillhigh-demo.com", "Ravi Worker")
        client.post("/api/v1/skills", json={"name": "Poster design", "level": "strong"})
        service = client.post("/api/v1/services", json={
            "title": "Campus poster design",
            "description": "One finished event poster for digital sharing.",
            "amount_minor": 180000,
            "currency": "INR",
            "estimated_hours": 3,
            "skills": ["Poster design"],
        }).json()
        public_service = client.get(f"/api/v1/services/{service['id']}").json()
        assert public_service["provider"]["display_name"] == "Ravi Worker"
        assert "email" not in public_service["provider"]
        assert public_service["seller_rating"] is None
        assert public_service["seller_review_count"] == 0
        assert public_service["skills"] == ["Poster design"]

        application = client.post(f"/api/v1/projects/{project['id']}/applications").json()
        client.post("/api/v1/auth/logout")

        register(client, "stranger-marketplace@skillhigh-demo.com", "Other Worker")
        assert client.get(f"/api/v1/projects/{project['id']}/applications").status_code == 403
        client.post("/api/v1/auth/logout")

        login(client, "client-marketplace@skillhigh-demo.com")
        applicants = client.get(f"/api/v1/projects/{project['id']}/applications").json()
        assert applicants[0]["worker"]["display_name"] == "Ravi Worker"
        own_projects = client.get("/api/v1/me/projects").json()
        assert own_projects[0]["application_count"] == 1
        order = client.post(f"/api/v1/applications/{application['id']}/accept").json()
        assert order["status"] == "active"
        client.post("/api/v1/auth/logout")

        login(client, "worker-marketplace@skillhigh-demo.com")
        worker_applications = client.get("/api/v1/me/applications").json()
        assert worker_applications[0]["order_id"] == order["id"]
        invalid = client.post(f"/api/v1/orders/{order['id']}/deliveries", json={"message": "Draft", "submission_url": "javascript:alert(1)"})
        assert invalid.status_code == 422
        delivery = client.post(f"/api/v1/orders/{order['id']}/deliveries", json={"message": "Final", "submission_url": " https://example.test/final "}).json()
        client.post("/api/v1/auth/logout")

        login(client, "stranger-marketplace@skillhigh-demo.com")
        assert client.get(f"/api/v1/orders/{order['id']}").status_code == 403
        client.post("/api/v1/auth/logout")
        login(client, "client-marketplace@skillhigh-demo.com")
        read_order = client.get(f"/api/v1/orders/{order['id']}").json()
        assert read_order["deliveries"][-1]["submission_url"] == "https://example.test/final"
        assert read_order["client"]["display_name"] == "Maya Client"
        completed = client.post(f"/api/v1/orders/{order['id']}/complete", json={"delivery_id": delivery["id"]})
        assert completed.status_code == 200, completed.text
        assert client.post(f"/api/v1/orders/{order['id']}/reviews", json={"rating": 5, "body": "Clear scope and useful handoff."}).status_code == 201
        client.post("/api/v1/auth/logout")
        login(client, "worker-marketplace@skillhigh-demo.com")
        assert client.post(f"/api/v1/orders/{order['id']}/reviews", json={"rating": 2, "body": "Worker view of the client."}).status_code == 201
        reviewed_service = client.get(f"/api/v1/services/{service['id']}").json()
        assert reviewed_service["seller_rating"] == 5.0
        assert reviewed_service["seller_review_count"] == 1
