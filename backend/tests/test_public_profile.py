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


def test_public_proof_is_opt_in_and_never_exposes_order_material() -> None:
    with TestClient(create_app(testing=True)) as client:
        register(client, "proof-client@skillhigh-profile.com", "Proof Client")
        client.post("/api/v1/auth/logout")
        register(client, "proof-worker@skillhigh-profile.com", "Proof Worker")
        service = client.post("/api/v1/services", json={
            "title": "Safe proof service", "description": "A private client brief with a safe public title.",
            "amount_minor": 15000, "estimated_hours": 3, "currency": "INR", "skills": ["Poster design"],
        }).json()
        worker_id = client.get("/api/v1/me").json()["id"]
        client.post("/api/v1/auth/logout")
        login(client, "proof-client@skillhigh-profile.com")
        order = client.post(f"/api/v1/services/{service['id']}/orders").json()
        client.post("/api/v1/auth/logout")
        login(client, "proof-worker@skillhigh-profile.com")
        assert client.post(f"/api/v1/orders/{order['id']}/accept").status_code == 200
        assert client.post(f"/api/v1/orders/{order['id']}/messages", json={"body": "Private message"}).status_code == 201
        delivery = client.post(f"/api/v1/orders/{order['id']}/deliveries", json={"message": "Private delivery", "submission_url": "https://example.test/private"}).json()
        client.post("/api/v1/auth/logout")
        login(client, "proof-client@skillhigh-profile.com")
        assert client.post(f"/api/v1/orders/{order['id']}/complete", json={"delivery_id": delivery["id"]}).status_code == 200
        client.post("/api/v1/auth/logout")
        assert client.get(f"/api/v1/people/{worker_id}").json()["proofs"] == []
        login(client, "proof-worker@skillhigh-profile.com")
        proof_id = client.get("/api/v1/me/proof").json()[0]["id"]
        client.post("/api/v1/auth/logout")
        register(client, "proof-stranger@skillhigh-profile.com", "Proof Stranger")
        assert client.patch(f"/api/v1/me/proof/{proof_id}", json={"public": True}).status_code == 403
        client.post("/api/v1/auth/logout")
        login(client, "proof-worker@skillhigh-profile.com")
        assert client.patch(f"/api/v1/me/proof/{proof_id}", json={"public": True}).status_code == 200
        client.post("/api/v1/auth/logout")
        public = client.get(f"/api/v1/people/{worker_id}")
        assert public.status_code == 200
        payload = public.json()
        assert set(payload["proofs"][0]) == {"id", "title", "skills", "created_at"}
        assert "Private message" not in str(payload)
        assert "Private delivery" not in str(payload)
        assert "https://example.test/private" not in str(payload)
        assert "email" not in payload and "order_id" not in payload["proofs"][0]
        login(client, "proof-worker@skillhigh-profile.com")
        assert client.patch(f"/api/v1/me/proof/{proof_id}", json={"public": False}).status_code == 200
        client.post("/api/v1/auth/logout")
        assert client.get(f"/api/v1/people/{worker_id}").json()["proofs"] == []
