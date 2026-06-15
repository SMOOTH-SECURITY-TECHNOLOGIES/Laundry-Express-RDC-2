from app.services.sms_dashboard_service import SmsDashboardService


def test_sms_dashboard_seed_and_kpis(db_session):
    svc = SmsDashboardService(db_session)
    dash = svc.get_dashboard()
    assert dash.source == "backend"
    assert dash.kpis.sent_today == 24580
    assert dash.kpis.delivery_rate == 97.8
    assert len(dash.messages) >= 1
    assert len(dash.providers if hasattr(dash, 'providers') else dash.operator_performance) >= 1
    assert len(dash.templates) >= 1
    assert dash.credits.current_credits == 125680
