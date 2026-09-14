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


def test_owner_listing_lifecycle_preserves_orders_and_application_history() -> None:
    with TestClient(create_app(testing=True)) as client:
        register(client, "owner-listing@skillhigh-demo.com", "Owner Listing")
        service = client.post("/api/v1/services", json={
            "title": "Original service terms", "description": "A clear service with original terms.",
            "amount_minor": 10000, "estimated_hours": 2, "currency": "INR", "skills": ["Design"],
        }).json()
        client.post("/api/v1/auth/logout")
        register(client, "buyer-listing@skillhigh-demo.com", "Buyer Listing")
        order = client.post(f"/api/v1/services/{service['id']}/orders").json()
        client.post("/api/v1/auth/logout")
        login(client, "owner-listing@skillhigh-demo.com")
        paused = client.patch(f"/api/v1/services/{service['id']}/visibility", json={"is_active": False})
        assert paused.status_code == 200 and paused.json()["is_active"] is False
        assert client.get("/api/v1/services").json() == []
        assert client.post(f"/api/v1/services/{service['id']}/orders").status_code == 404
        private = client.get("/api/v1/me/services").json()[0]
        assert private["is_active"] is False
        client.put(f"/api/v1/services/{service['id']}", json={
            "title": "Updated service terms", "description": "Updated terms for future orders.",
            "amount_minor": 15000, "estimated_hours": 3, "currency": "INR", "skills": ["Design", "Writing"],
        })
        client.patch(f"/api/v1/services/{service['id']}/visibility", json={"is_active": True})
        client.post("/api/v1/auth/logout")
        login(client, "buyer-listing@skillhigh-demo.com")
        old = client.get(f"/api/v1/orders/{order['id']}").json()
        assert old["title"] == "Original service terms" and old["amount_minor"] == 10000
        client.post("/api/v1/auth/logout")
        login(client, "owner-listing@skillhigh-demo.com")
        client.post("/api/v1/auth/logout")
        login(client, "owner-listing@skillhigh-demo.com")
        project = client.post("/api/v1/projects", json={
            "title": "Open project brief", "description": "A project that can be edited before applying.",
            "amount_minor": 20000, "estimated_hours": 4, "currency": "INR", "scale": "small",
            "required_skills": ["Design"],
        }).json()
        client.post("/api/v1/auth/logout")
        register(client, "worker-listing@skillhigh-demo.com", "Worker Listing")
        applied = client.post(f"/api/v1/projects/{project['id']}/applications").json()
        assert client.post(f"/api/v1/applications/{applied['id']}/withdraw").status_code == 200
        reapplied = client.post(f"/api/v1/projects/{project['id']}/applications").json()
        assert reapplied["id"] == applied["id"] and reapplied["status"] == "pending"
        client.post("/api/v1/auth/logout")
        login(client, "owner-listing@skillhigh-demo.com")
        assert client.put(f"/api/v1/projects/{project['id']}", json={
            "title": "Edited open brief", "description": "Edited scope before any application is accepted.",
            "amount_minor": 21000, "estimated_hours": 5, "currency": "INR", "scale": "small", "required_skills": ["Design"],
        }).status_code == 409
        assert client.post(f"/api/v1/projects/{project['id']}/close").status_code == 200
        assert client.get("/api/v1/projects").json() == []
