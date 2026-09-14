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
