import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "docs" in response.json()


def test_validate_yaml():
    response = client.post(
        "/api/v1/validation",
        json={"content": "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: test"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "valid" in data
    assert data["format"] == "yaml"
