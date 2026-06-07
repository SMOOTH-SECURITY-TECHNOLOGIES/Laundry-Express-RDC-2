"""Tests d'intégration pour les routes Operational Truth."""

from uuid import uuid4

from fastapi.testclient import TestClient
from jose import jwt
from starlette.requests import Request

from app.api.routes.ops import verify_admin_token
from app.core.config import settings
from app.main import app


client = TestClient(app)


def assert_route_exists(response):
    assert response.status_code not in {404, 405}, response.text


class TestOpsRoutesExist:
    def test_ops_routes_exist(self):
        responses = [
            client.get(f"/api/v1/ops/orders/{uuid4()}/truth-timeline"),
            client.get(f"/api/v1/ops/orders/{uuid4()}/proofs"),
            client.get("/api/v1/ops/corridors/health"),
            client.get("/api/v1/ops/anomalies"),
            client.get(f"/api/v1/ops/investigate?order_id={uuid4()}"),
        ]
        for response in responses:
            assert_route_exists(response)

    def test_ops_admin_auth_accepts_super_admin_role(self):
        token = jwt.encode(
            {"sub": str(uuid4()), "role": "super_admin", "type": "access"},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        request = Request(
            {
                "type": "http",
                "method": "GET",
                "path": "/api/v1/ops/corridors/health",
                "headers": [(b"authorization", f"Bearer {token}".encode())],
            }
        )

        assert verify_admin_token(request) is True
