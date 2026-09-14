from fastapi.testclient import TestClient

from app import create_app


def register(client: TestClient, email: str, name: str) -> None:
    response = client.post("/api/v1/auth/register", json={
        "email": email, "password": "safe-password-123", "display_name": name,
        "career_stage": "student", "timezone": "Asia/Kolkata",
    })
    assert response.status_code == 201, response.text
    client.headers["X-CSRF-Token"] = client.cookies.get("sh_csrf", "")


def login(client: TestClient, email: str) -> None:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "safe-password-123"})
    assert response.status_code == 200, response.text
    client.headers["X-CSRF-Token"] = client.cookies.get("sh_csrf", "")


def test_profile_can_be_updated_without_changing_admin_access() -> None:
    """Allowing arbitrary profile fields would let a user grant themselves admin access."""
    with TestClient(create_app(testing=True)) as client:
        register(client, "member@skillhigh-demo.com", "Nila Member")
        response = client.patch("/api/v1/me", json={
            "display_name": "Nila Das", "bio": "Student designer", "career_stage": "graduate", "is_admin": True,
        })
        assert response.status_code == 200, response.text
        profile = response.json()
        assert profile["display_name"] == "Nila Das"
        assert profile["career_stage"] == "graduate"
        assert profile["is_admin"] is False


def test_non_participant_cannot_read_another_users_order() -> None:
    """Removing participant authorization would expose private project conversations."""
    with TestClient(create_app(testing=True)) as client:
        register(client, "client@skillhigh-access.com", "Client")
        project = client.post("/api/v1/projects", json={
            "title": "Create event poster", "description": "A poster for an event this week.",
            "amount_minor": 10000, "currency": "INR", "scale": "micro", "estimated_hours": 2,
        }).json()
        client.post("/api/v1/auth/logout")
        register(client, "worker@skillhigh-access.com", "Worker")
        application = client.post(f"/api/v1/projects/{project['id']}/applications").json()
        client.post("/api/v1/auth/logout")
        login(client, "client@skillhigh-access.com")
        order = client.post(f"/api/v1/applications/{application['id']}/accept").json()
        client.post("/api/v1/auth/logout")
        register(client, "stranger@skillhigh-access.com", "Stranger")
        response = client.get(f"/api/v1/orders/{order['id']}")
        assert response.status_code == 403


def test_order_summaries_are_private_and_include_only_the_latest_message() -> None:
    with TestClient(create_app(testing=True)) as client:
        register(client, "buyer-summary@skillhigh-access.com", "Buyer Summary")
        client.post("/api/v1/auth/logout")
        register(client, "worker-summary@skillhigh-access.com", "Worker Summary")
        service = client.post("/api/v1/services", json={
            "title": "Summary service", "description": "A service used to test private order summaries.",
            "amount_minor": 12000, "estimated_hours": 2, "currency": "INR", "skills": ["Writing"],
        }).json()
        client.post("/api/v1/auth/logout")
        login(client, "buyer-summary@skillhigh-access.com")
        order = client.post(f"/api/v1/services/{service['id']}/orders").json()
        client.post("/api/v1/auth/logout")
        login(client, "worker-summary@skillhigh-access.com")
        assert client.post(f"/api/v1/orders/{order['id']}/accept").status_code == 200
        assert client.post(f"/api/v1/orders/{order['id']}/messages", json={"body": "Latest private note"}).status_code == 201
        client.post("/api/v1/auth/logout")
        login(client, "buyer-summary@skillhigh-access.com")
        summary = client.get("/api/v1/orders").json()[0]
        assert summary["worker"]["display_name"] == "Worker Summary"
        assert summary["last_message"]["body"] == "Latest private note"
        assert "email" not in summary["worker"]
        client.post("/api/v1/auth/logout")
        register(client, "stranger-summary@skillhigh-access.com", "Stranger Summary")
        assert client.get("/api/v1/orders").json() == []
