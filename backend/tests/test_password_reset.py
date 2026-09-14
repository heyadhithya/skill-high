from pathlib import Path

from fastapi.testclient import TestClient

from app import create_app


def test_password_reset_uses_local_mail_sink_without_returning_the_token(tmp_path: Path, monkeypatch) -> None:
    """Returning a reset token in the API response would let callers take over accounts."""
    monkeypatch.setenv("DEV_MAIL_DIR", str(tmp_path))
    with TestClient(create_app(testing=True)) as client:
        created = client.post("/api/v1/auth/register", json={
            "email": "reset@skillhigh-demo.com", "password": "safe-password-123",
            "display_name": "Reset User", "career_stage": "student", "timezone": "Asia/Kolkata",
        })
        assert created.status_code == 201
        response = client.post("/api/v1/auth/request-password-reset", json={"email": "reset@skillhigh-demo.com"})
        assert response.status_code == 202
        assert "token" not in response.text
        mail = next(tmp_path.glob("password-reset-*.txt")).read_text()
        token = mail.rsplit("token=", 1)[1].strip()
        changed = client.post("/api/v1/auth/reset-password", json={"token": token, "password": "new-safe-password-123"})
        assert changed.status_code == 204
        login = client.post("/api/v1/auth/login", json={"email": "reset@skillhigh-demo.com", "password": "new-safe-password-123"})
        assert login.status_code == 200


def test_verification_and_recovery_tokens_are_single_use_and_resend_is_protected(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("DEV_MAIL_DIR", str(tmp_path))
    with TestClient(create_app(testing=True)) as client:
        response = client.post("/api/v1/auth/register", json={
            "email": "verify@skillhigh-demo.com", "password": "safe-password-123",
            "display_name": "Verify User", "career_stage": "student", "timezone": "Asia/Kolkata",
        })
        assert response.status_code == 201 and response.json()["is_verified"] is False
        token = next(tmp_path.glob("verification-*.txt")).read_text().rsplit("token=", 1)[1].strip()
        assert client.post("/api/v1/auth/verify-email", json={"token": token}).status_code == 204
        assert client.post("/api/v1/auth/verify-email", json={"token": token}).status_code == 400
        client.post("/api/v1/auth/logout")
        assert client.post("/api/v1/auth/resend-verification").status_code == 401
        login = client.post("/api/v1/auth/login", json={"email": "verify@skillhigh-demo.com", "password": "safe-password-123"})
        assert login.status_code == 200
        client.headers["X-CSRF-Token"] = client.cookies.get("sh_csrf", "")
        assert client.post("/api/v1/auth/resend-verification").status_code == 202
        assert client.post("/api/v1/auth/request-password-reset", json={"email": "missing@skillhigh-demo.com"}).status_code == 202
        assert "token" not in client.post("/api/v1/auth/request-password-reset", json={"email": "verify@skillhigh-demo.com"}).text
        reset_token = sorted(tmp_path.glob("password-reset-*.txt"))[-1].read_text().rsplit("token=", 1)[1].strip()
        assert client.post("/api/v1/auth/reset-password", json={"token": reset_token, "password": "new-safe-password-123"}).status_code == 204
        assert client.get("/api/v1/me").status_code == 401
        assert client.post("/api/v1/auth/reset-password", json={"token": reset_token, "password": "another-safe-password-123"}).status_code == 400
        assert client.post("/api/v1/auth/login", json={"email": "verify@skillhigh-demo.com", "password": "safe-password-123"}).status_code == 401
        assert client.post("/api/v1/auth/login", json={"email": "verify@skillhigh-demo.com", "password": "new-safe-password-123"}).status_code == 200
