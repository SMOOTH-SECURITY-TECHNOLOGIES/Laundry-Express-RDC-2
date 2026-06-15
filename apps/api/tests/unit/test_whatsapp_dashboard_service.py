from app.services.whatsapp_dashboard_service import WhatsappDashboardService


def test_whatsapp_dashboard_seed_and_kpis(db_session):
    svc = WhatsappDashboardService(db_session)
    dash = svc.get_dashboard()
    assert dash.source == "backend"
    assert dash.kpis.open_conversations == 1284
    assert dash.kpis.messages_today == 12450
    assert len(dash.conversations) >= 1
    assert len(dash.templates) >= 1
    assert dash.live_monitor.active_conversations == 124
    assert dash.quality.quality_rating == "high"
    assert dash.ai_metrics.ai_conversations_pct == 72.0
