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


def test_active_order_cancellation_blocks_simulated_payout() -> None:
    """A cancelled order must not remain eligible for a simulated payout."""
    with TestClient(create_app(testing=True)) as client:
        register(client, "buyer@skillhigh-cancel.com", "Buyer")
        client.post("/api/v1/auth/logout")
        register(client, "maker@skillhigh-cancel.com", "Maker")
        service = client.post("/api/v1/services", json={
            "title": "Design a clear campus poster", "description": "One poster sized for digital campus screens.",
            "amount_minor": 12000, "estimated_hours": 2, "currency": "INR", "skills": ["Design"],
        }).json()
        client.post("/api/v1/auth/logout")
        login(client, "buyer@skillhigh-cancel.com")
        order = client.post(f"/api/v1/services/{service['id']}/orders").json()
        client.post("/api/v1/auth/logout")
        login(client, "maker@skillhigh-cancel.com")
        client.post(f"/api/v1/orders/{order['id']}/accept")
        cancelled = client.post(f"/api/v1/orders/{order['id']}/cancel")
        assert cancelled.status_code == 200, cancelled.text
        assert cancelled.json()["status"] == "cancelled"
        client.post("/api/v1/auth/logout")
        login(client, "buyer@skillhigh-cancel.com")
        payout = client.post(f"/api/v1/payments/simulate/{order['id']}?event_id=cancelled-payout&outcome=payout")
        assert payout.status_code == 409
