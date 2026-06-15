from sqlalchemy.orm import Session

from app.models.whatsapp_ops import (
    WhatsappAiMetrics, WhatsappAutomation, WhatsappCampaign, WhatsappConversation,
    WhatsappCostSnapshot, WhatsappNotification, WhatsappQuality, WhatsappSegment,
    WhatsappTemplate, WhatsappWebhook,
)
from app.schemas.whatsapp_dashboard import (
    AiMetricsResponse, AnalyticsPoint, AnalyticsSeries, CampaignItem, ConversationDetail,
    ConversationItem, CostResponse, LiveMonitorResponse, NotificationItem, QualityResponse,
    SegmentItem, SlaResponse, TemplateItem, WebhookItem, WhatsappDashboardResponse,
    WhatsappKpiResponse, AutomationItem,
)
from app.services.whatsapp_ops_service import WhatsappOpsService


class WhatsappDashboardService:
    def __init__(self, db: Session):
        self.db = db
        WhatsappOpsService(db).seed_if_empty()

    def get_dashboard(self) -> WhatsappDashboardResponse:
        convs = self.db.query(WhatsappConversation).order_by(WhatsappConversation.created_at.desc()).limit(30).all()
        templates = self.db.query(WhatsappTemplate).order_by(WhatsappTemplate.usage_count.desc()).all()
        campaigns = self.db.query(WhatsappCampaign).all()
        automations = self.db.query(WhatsappAutomation).all()
        notifications = self.db.query(WhatsappNotification).order_by(WhatsappNotification.created_at.desc()).limit(20).all()
        webhooks = self.db.query(WhatsappWebhook).all()
        quality = self.db.query(WhatsappQuality).first()
        costs = self.db.query(WhatsappCostSnapshot).filter(WhatsappCostSnapshot.period == "current").first()
        ai = self.db.query(WhatsappAiMetrics).first()
        segments = self.db.query(WhatsappSegment).all()

        kpis = WhatsappKpiResponse(
            open_conversations=1284, open_conversations_change=12.5, open_conversations_sparkline=[1100, 1150, 1180, 1200, 1240, 1260, 1284],
            messages_today=12450, messages_today_change=18.7, messages_today_sparkline=[9800, 10200, 10800, 11200, 11800, 12100, 12450],
            response_rate=94.6, response_rate_change=4.2, response_rate_sparkline=[90, 91, 92, 93, 94, 94.2, 94.6],
            avg_response_time="2 min 14 sec", avg_response_time_change="-15 sec", avg_response_time_sparkline=[180, 170, 160, 150, 140, 136, 134],
            active_templates=36, active_templates_change=3.0, active_templates_sparkline=[30, 31, 32, 33, 34, 35, 36],
            cost_today=costs.total_today if costs else 42.80, cost_today_change=5.3, cost_today_sparkline=[28, 30, 32, 35, 38, 40, 42.8],
            ai_conversations_pct=ai.ai_conversations_pct if ai else 72.0, ai_conversations_change=8.0, ai_conversations_sparkline=[58, 60, 63, 65, 68, 70, 72],
            satisfaction=4.8, satisfaction_change=0.2, satisfaction_sparkline=[4.4, 4.5, 4.6, 4.6, 4.7, 4.7, 4.8],
        )

        live = LiveMonitorResponse(
            active_conversations=124, waiting_conversations=18, sla_breached=7, escalations=5,
            available_agents=["Sophie M.", "Marc D.", "Julie K.", "IA Assistant"],
            ai_active_pct=ai.ai_conversations_pct if ai else 72.0, support_backlog=18,
        )

        analytics = [
            AnalyticsSeries(key="messages", title="Messages envoyés", data=[AnalyticsPoint(label=d, value=v) for d, v in zip(["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], [10200, 10800, 11200, 11800, 12400, 9800, 8600])]),
            AnalyticsSeries(key="conversations", title="Conversations", data=[AnalyticsPoint(label=d, value=v) for d, v in zip(["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], [180, 195, 210, 220, 240, 160, 140])]),
            AnalyticsSeries(key="responses", title="Réponses", data=[AnalyticsPoint(label=d, value=v) for d, v in zip(["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], [92, 93, 94, 94, 95, 93, 91])]),
            AnalyticsSeries(key="satisfaction", title="Satisfaction", data=[AnalyticsPoint(label=d, value=v) for d, v in zip(["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], [4.5, 4.6, 4.6, 4.7, 4.8, 4.7, 4.8])]),
            AnalyticsSeries(key="costs", title="Coûts", data=[AnalyticsPoint(label=d, value=v) for d, v in zip(["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], [28, 30, 32, 35, 42, 38, 36])]),
        ]

        sla = SlaResponse(
            first_response_avg="2 min 14 sec", resolution_avg="18 min 42 sec",
            open_conversations=1284, sla_breached=7,
            first_response_status="green", resolution_status="green", open_status="orange", breached_status="red",
        )

        return WhatsappDashboardResponse(
            kpis=kpis,
            conversations=[self._conv(c) for c in convs],
            live_monitor=live,
            templates=[self._template(t) for t in templates],
            notifications=[self._notif(n) for n in notifications],
            campaigns=[self._campaign(c) for c in campaigns],
            automations=[self._automation(a) for a in automations],
            webhooks=[self._webhook(w) for w in webhooks],
            quality=self._quality(quality),
            ai_metrics=self._ai(ai),
            costs=self._costs(costs),
            analytics=analytics,
            segments=[self._segment(s) for s in segments],
            sla=sla,
            source="backend",
        )

    def get_conversation(self, conv_id: str) -> ConversationDetail | None:
        c = self.db.query(WhatsappConversation).filter(WhatsappConversation.id == conv_id).first()
        if not c:
            return None
        base = self._conv(c)
        return ConversationDetail(
            **base.model_dump(),
            messages=c.messages_json or [],
            linked_orders=c.linked_orders or [],
            linked_tickets=c.linked_tickets or [],
            internal_notes=c.internal_notes or [],
            ai_suggestions=c.ai_suggestions or [],
        )

    def _conv(self, c: WhatsappConversation) -> ConversationItem:
        return ConversationItem(
            id=str(c.id), client_name=c.client_name, phone=c.phone, last_message=c.last_message,
            channel=c.channel, assigned_to=c.assigned_to, status=c.status,
            status_label=WhatsappOpsService.conv_status_label(c.status),
            wait_time_sec=c.wait_time_sec, wait_time_label=WhatsappOpsService.wait_label(c.wait_time_sec),
            created_at=c.created_at.isoformat() if c.created_at else None,
        )

    def _template(self, t: WhatsappTemplate) -> TemplateItem:
        return TemplateItem(
            id=str(t.id), name=t.name, category=t.category,
            category_label=WhatsappOpsService.category_label(t.category),
            language=t.language, meta_status=t.meta_status,
            meta_status_label=WhatsappOpsService.meta_status_label(t.meta_status),
            usage_count=t.usage_count, delivery_rate=t.delivery_rate,
        )

    def _notif(self, n: WhatsappNotification) -> NotificationItem:
        return NotificationItem(
            id=str(n.id), event_type=n.event_type,
            event_label=WhatsappOpsService.event_label(n.event_type),
            template_name=n.template_name, recipient=n.recipient, status=n.status,
            status_label=WhatsappOpsService.notif_status_label(n.status),
            created_at=n.created_at.isoformat() if n.created_at else None,
        )

    def _campaign(self, c: WhatsappCampaign) -> CampaignItem:
        return CampaignItem(
            id=str(c.id), name=c.name, campaign_type=c.campaign_type,
            type_label=WhatsappOpsService.camp_type_label(c.campaign_type),
            template_name=c.template_name, audience=c.audience, status=c.status,
            sent=c.sent, delivered=c.delivered, opened=c.opened, replies=c.replies,
            clicks=c.clicks, conversions=c.conversions,
        )

    def _automation(self, a: WhatsappAutomation) -> AutomationItem:
        return AutomationItem(
            id=str(a.id), name=a.name, trigger_type=a.trigger_type,
            trigger_label=a.trigger_type.replace("_", " ").title(),
            status=a.status, runs_count=a.runs_count, success_rate=a.success_rate,
        )

    def _webhook(self, w: WhatsappWebhook) -> WebhookItem:
        return WebhookItem(
            id=str(w.id), endpoint=w.endpoint, secret_masked=w.secret_masked,
            last_call_at=w.last_call_at, success_count=w.success_count,
            error_count=w.error_count, retry_count=w.retry_count,
            events=w.events or [],
        )

    def _quality(self, q: WhatsappQuality | None) -> QualityResponse:
        if not q:
            return QualityResponse(quality_rating="high", quality_label="High", messaging_limit="1000/jour", phone_status="connected", phone_status_label="Connected", verification_status="verified", verification_label="Verified")
        return QualityResponse(
            quality_rating=q.quality_rating, quality_label=WhatsappOpsService.quality_label(q.quality_rating),
            messaging_limit=q.messaging_limit, phone_status=q.phone_status, phone_status_label=q.phone_status.title(),
            verification_status=q.verification_status, verification_label=q.verification_status.title(),
            alerts=q.alerts_json or [],
        )

    def _ai(self, a: WhatsappAiMetrics | None) -> AiMetricsResponse:
        if not a:
            return AiMetricsResponse(ai_conversations_pct=72, human_escalations=0, ai_confidence=87, resolution_rate=68, resolved_without_human=0, cost_saved=0, satisfaction=4.6)
        return AiMetricsResponse(
            ai_conversations_pct=a.ai_conversations_pct, human_escalations=a.human_escalations,
            ai_confidence=a.ai_confidence, resolution_rate=a.resolution_rate,
            resolved_without_human=a.resolved_without_human, cost_saved=a.cost_saved, satisfaction=a.satisfaction,
        )

    def _costs(self, c: WhatsappCostSnapshot | None) -> CostResponse:
        dp = (c.data_points or {}) if c else {}
        return CostResponse(
            total_today=c.total_today if c else 42.80, total_week=c.total_week if c else 285.40,
            total_month=c.total_month if c else 1240.0, marketing_cost=c.marketing_cost if c else 18.2,
            utility_cost=c.utility_cost if c else 19.4, auth_cost=c.auth_cost if c else 5.2,
            cost_per_conversation=c.cost_per_conversation if c else 0.033,
            trend=c.trend if c else 5.3, forecast=c.forecast if c else 1350.0,
            sparkline_day=dp.get("day", []), sparkline_week=dp.get("week", []), sparkline_month=dp.get("month", []),
        )

    def _segment(self, s: WhatsappSegment) -> SegmentItem:
        return SegmentItem(id=str(s.id), slug=s.slug, name=s.name, size=s.size, engagement=s.engagement, conversion=s.conversion)
