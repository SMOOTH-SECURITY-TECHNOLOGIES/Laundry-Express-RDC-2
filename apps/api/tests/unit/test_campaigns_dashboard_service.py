import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.services.campaigns_dashboard_service import CampaignsDashboardService


class TestCampaignsDashboardService(unittest.TestCase):
    @patch.object(CampaignsDashboardService, "_ensure_seed_data")
    @patch.object(CampaignsDashboardService, "_delivery_count", return_value=0)
    def test_get_dashboard_returns_backend_source(self, *_mocks):
        db = MagicMock()
        db.query.return_value.order_by.return_value.all.return_value = []
        db.query.return_value.count.return_value = 0
        db.query.return_value.scalar.return_value = 0
        result = CampaignsDashboardService(db).get_dashboard(days=7)
        self.assertEqual(result.source, "backend")
        self.assertGreaterEqual(result.kpis.active_campaigns, 0)

    def test_build_funnel_has_stages(self):
        svc = CampaignsDashboardService(MagicMock())
        funnel = svc._build_funnel(1000, 500, 200, 50)
        self.assertEqual(len(funnel), 5)
        self.assertEqual(funnel[0].stage, "Envoyés")

    def test_growth_dashboard_aggregates_backend_metrics(self):
        svc = CampaignsDashboardService(MagicMock())
        now = datetime.now(timezone.utc)
        campaign = SimpleNamespace(
            id="campaign-1",
            name="Réactivation 30j",
            messages_sent=100,
            clicks=25,
            conversions=8,
            revenue=240.0,
            budget=60.0,
            roi=4.0,
            segment="inactive",
            channel="whatsapp",
        )
        order = SimpleNamespace(
            customer_id="customer-1",
            total_amount=120.0,
            discount_amount=15.0,
            payment_status="paid",
            completed_at=now,
            created_at=now,
            customer=SimpleNamespace(referred_by_user_id="referrer-1", loyalty_points=100),
        )

        with (
            patch.object(svc, "_campaigns", return_value=[campaign]),
            patch.object(svc, "_orders", return_value=[order]),
            patch.object(svc, "_paid_orders", return_value=[order]),
            patch.object(svc, "_promos", return_value=[]),
            patch.object(svc, "_promo_usages", return_value=[]),
            patch.object(svc, "_customers_with_points", return_value=1),
            patch.object(svc, "_referral_count", return_value=1),
        ):
            result = svc.get_growth_dashboard()

        self.assertEqual(result.source, "backend")
        self.assertEqual(result.acquisition, 100)
        self.assertEqual(result.activation, 25)
        self.assertEqual(result.conversion, 8)
        self.assertGreater(result.revenue, 0)
        self.assertEqual(result.referral, 1)
        self.assertGreater(result.roi.estimated_roi, 0)

    def test_rfm_segments_classify_customers_without_pii(self):
        svc = CampaignsDashboardService(MagicMock())
        now = datetime.now(timezone.utc)
        recent_order = SimpleNamespace(
            customer_id="customer-a",
            total_amount=40.0,
            completed_at=now - timedelta(days=5),
            created_at=now - timedelta(days=5),
        )
        dormant_order = SimpleNamespace(
            customer_id="customer-b",
            total_amount=25.0,
            completed_at=now - timedelta(days=75),
            created_at=now - timedelta(days=75),
        )

        with patch.object(svc, "_paid_orders", return_value=[recent_order, recent_order, recent_order, dormant_order]):
            segments = svc.get_rfm_segments()

        champions = next(s for s in segments if s.segment_key == "champions")
        dormant = next(s for s in segments if s.segment_key == "dormant")
        self.assertEqual(champions.audience_size, 1)
        self.assertEqual(dormant.audience_size, 1)
        self.assertFalse(any(hasattr(segment, "customer_id") for segment in segments))

    def test_promo_fraud_risks_scores_excess_usage(self):
        svc = CampaignsDashboardService(MagicMock())
        promo = SimpleNamespace(
            id="promo-1",
            code="VIP50",
            max_usage=2,
            usage_limit_per_customer=1,
            usage_count=3,
            discount_value=50,
            is_active=False,
        )
        usages = [
            SimpleNamespace(promo_code_id="promo-1", customer_id="customer-1", discount_applied=20),
            SimpleNamespace(promo_code_id="promo-1", customer_id="customer-1", discount_applied=20),
            SimpleNamespace(promo_code_id="promo-1", customer_id="customer-2", discount_applied=20),
        ]

        with (
            patch.object(svc, "_promos", return_value=[promo]),
            patch.object(svc, "_promo_usages", return_value=usages),
        ):
            risks = svc.get_promo_fraud_risks()

        self.assertEqual(risks[0].promo_code, "VIP50")
        self.assertGreaterEqual(risks[0].risk_score, 70)
        self.assertEqual(risks[0].severity, "high")


if __name__ == "__main__":
    unittest.main()
