from fastapi.testclient import TestClient

from app import create_app


def test_logout_returns_no_content_clears_cookies_and_revokes_session() -> None:
    with TestClient(create_app(testing=True)) as client:
        registered = client.post("/api/v1/auth/register", json={
            "email": "logout@skillhigh-demo.com",
            "password": "safe-password-123",
            "display_name": "Logout User",
            "career_stage": "student",
            "timezone": "Asia/Kolkata",
        })
        assert registered.status_code == 201, registered.text
        client.headers["X-CSRF-Token"] = client.cookies.get("sh_csrf", "")
        assert client.get("/api/v1/me").status_code == 200

        response = client.post("/api/v1/auth/logout")

        assert response.status_code == 204, response.text
        assert "sh_session=" in response.headers.get("set-cookie", "")
        assert "sh_csrf=" in response.headers.get("set-cookie", "")
        assert client.get("/api/v1/me").status_code == 401
