"""Gate MVP minimal pour vérifier l'existence contractuelle des routes critiques."""

from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def assert_route_exists(response):
    """Une route existe si elle ne répond ni 404 ni 405."""
    assert response.status_code not in {404, 405}, response.text


class TestMvpRoutesExist:
    def test_auth_routes_exist(self):
        responses = [
            client.post("/api/v1/auth/register", json={}),
            client.post("/api/v1/auth/login", json={}),
            client.post("/api/v1/auth/refresh", json={}),
            client.post("/api/v1/auth/logout", json={}),
            client.get("/api/v1/auth/me"),
        ]

        for response in responses:
            assert_route_exists(response)

    def test_pricing_routes_exist(self):
        responses = [
            client.post("/api/v1/pricing/estimate", json={}),
            client.post("/api/v1/pricing/calculate", json={}),
            client.post("/api/v1/pricing/validate", json={}),
        ]

        for response in responses:
            assert_route_exists(response)

    def test_order_routes_exist(self):
        responses = [
            client.post("/api/v1/orders", json={}),
            client.get("/api/v1/orders"),
            client.get(f"/api/v1/orders/{uuid4()}"),
            client.post("/api/v1/orders/estimate", json={}),
            client.post(f"/api/v1/orders/{uuid4()}/cancel", json={}),
        ]

        for response in responses:
            assert_route_exists(response)

    def test_payment_routes_exist(self):
        responses = [
            client.post("/api/v1/payments/intents", json={}),
            client.get(f"/api/v1/payments/intents/{uuid4()}"),
            client.post(f"/api/v1/payments/intents/{uuid4()}/confirm-cash", json={}),
            client.get(f"/api/v1/payments/orders/{uuid4()}/summary"),
        ]

        for response in responses:
            assert_route_exists(response)

    def test_advanced_tms_routes_exist(self):
        responses = [
            client.get("/api/v1/logistics/driver-behavior"),
            client.get("/api/v1/logistics/fuel-usage"),
            client.get("/api/v1/logistics/stock-levels"),
            client.get("/api/v1/logistics/connectivity-health"),
        ]

        for response in responses:
            assert_route_exists(response)

    def test_logistics_live_websocket_route_exists(self):
        with client.websocket_connect("/api/v1/logistics/live?token=invalid") as websocket:
            # Connexion acceptée puis fermée si token invalide
            try:
                websocket.receive_json()
            except Exception:
                pass
