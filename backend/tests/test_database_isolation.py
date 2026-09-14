from app import integration_database_url


def test_testing_database_never_defaults_to_the_development_database(monkeypatch) -> None:
    monkeypatch.delenv("TEST_DATABASE_URL", raising=False)
    assert integration_database_url().endswith("/skillhigh_test")
