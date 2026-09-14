from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

from fastapi.testclient import TestClient

from app import create_app


def test_competing_acceptances_assign_one_worker_without_deadlock() -> None:
    app = create_app(testing=True)
    # Only this client enters lifespan: the two competing requests share one
    # dedicated test schema but each gets its own API/SQLAlchemy session.
    with TestClient(app) as owner:
        def register(client: TestClient, email: str) -> None:
            response = client.post("/api/v1/auth/register", json={
                "email": email,
                "password": "concurrency-safe-123",
                "display_name": "Concurrency QA",
                "career_stage": "student",
                "timezone": "Asia/Kolkata",
            })
            assert response.status_code == 201, response.text
            client.headers["X-CSRF-Token"] = client.cookies.get("sh_csrf", "")

        register(owner, "race-owner@skillhigh-demo.com")
        project_response = owner.post("/api/v1/projects", json={
            "title": "Concurrent assignment check",
            "description": "One open brief must accept exactly one worker.",
            "amount_minor": 250000,
            "currency": "INR",
            "estimated_hours": 2,
            "scale": "micro",
            "required_skills": ["Poster design"],
        })
        assert project_response.status_code == 201, project_response.text
        project_id = project_response.json()["id"]
        application_ids = []
        for index in (1, 2):
            worker = TestClient(app)
            try:
                register(worker, f"race-worker-{index}@skillhigh-demo.com")
                response = worker.post(f"/api/v1/projects/{project_id}/applications")
                assert response.status_code == 201, response.text
                application_ids.append(response.json()["id"])
            finally:
                worker.close()

        barrier = Barrier(2)

        def accept(application_id: int):
            competitor = TestClient(app)
            try:
                competitor.cookies.update(owner.cookies)
                competitor.headers["X-CSRF-Token"] = owner.headers["X-CSRF-Token"]
                barrier.wait(timeout=5)
                return competitor.post(f"/api/v1/applications/{application_id}/accept")
            finally:
                competitor.close()

        with ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(accept, application_ids))
        assert sorted(response.status_code for response in responses) == [200, 409], [
            (response.status_code, response.text) for response in responses
        ]
        orders = owner.get("/api/v1/orders").json()
        assert len(orders) == 1 and orders[0]["project_id"] == project_id
        applications = owner.get(f"/api/v1/projects/{project_id}/applications").json()
        assert sorted(application["status"] for application in applications) == ["accepted", "not_selected"]
