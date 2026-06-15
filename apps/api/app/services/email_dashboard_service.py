from sqlalchemy.orm import Session

from app.models.email_ops import (
    EmailAlert, EmailAutomation, EmailBounce, EmailCampaign, EmailDeliverability,
    EmailInvoiceLog, EmailMessage, EmailSettings, EmailTemplate, EmailUnsubscribe, EmailWebhook,
)
from app.schemas.email_dashboard import (
    AlertItem, AnalyticsPoint, AnalyticsSeries, BounceItem, DeliverabilityItem,
    DomainPerformanceItem, EmailAutomationItem, EmailCampaignItem, EmailDashboardResponse,
    EmailKpiResponse, EmailMessageItem, EmailSettingsResponse, EmailTemplateItem,
    InvoiceLogItem, InvoiceSummary, SegmentItem, TypeDistributionItem,
    UnsubscribeItem, UnsubscribeSummary, WebhookItem,
)
from app.services.email_ops_service import EmailOpsService

TYPE_COLORS = {"Transactionnel": "#3B82F6", "Marketing": "#8B5CF6", "Facture": "#F59E0B", "Support": "#22C55E", "Notification": "#06B6D4", "Sécurité": "#EF4444"}


class EmailDashboardService:
    def __init__(self, db: Session):
        self.db = db
        EmailOpsService(db).seed_if_empty()

    def get_dashboard(self) -> EmailDashboardResponse:
        messages = self.db.query(EmailMessage).order_by(EmailMessage.created_at.desc()).limit(30).all()
        templates = self.db.query(EmailTemplate).order_by(EmailTemplate.usage_count.desc()).all()
        campaigns = self.db.query(EmailCampaign).all()
        automations = self.db.query(EmailAutomation).all()
        deliverability = self.db.query(EmailDeliverability).all()
        bounces = self.db.query(EmailBounce).all()
        unsubscribes = self.db.query(EmailUnsubscribe).all()
        invoices = self.db.query(EmailInvoiceLog).all()
        webhooks = self.db.query(EmailWebhook).all()
        alerts = self.db.query(EmailAlert).all()
        settings_row = self.db.query(EmailSettings).filter(EmailSettings.key == "global").first()
        sj = (settings_row.value_json or {}) if settings_row else {}

        kpis = EmailKpiResponse(
            sent_today=18420, sent_today_change=15.8, sent_today_sparkline=[14000, 15000, 16000, 16800, 17500, 18000, 18420],
            delivery_rate=99.1, delivery_rate_change=0.4, delivery_rate_sparkline=[98.2, 98.5, 98.8, 99.0, 99.0, 99.1, 99.1],
            open_rate=38.4, open_rate_change=2.1, open_rate_sparkline=[34, 35, 36, 37, 37.5, 38, 38.4],
            click_rate=9.2, click_rate_change=1.4, click_rate_sparkline=[7.5, 8.0, 8.4, 8.8, 9.0, 9.1, 9.2],
            bounces=214, bounces_change=-12.0, bounces_sparkline=[280, 260, 240, 230, 220, 215, 214],
            unsubscribes=86, unsubscribes_change=3.2, unsubscribes_sparkline=[70, 72, 75, 78, 80, 84, 86],
            active_templates=42, active_templates_change=2.0, active_templates_sparkline=[38, 39, 40, 40, 41, 41, 42],
            attributed_revenue=12850.0, attributed_revenue_change=18.5, attributed_revenue_sparkline=[9000, 9800, 10500, 11200, 11800, 12400, 12850],
        )

        type_dist = [
            TypeDistributionItem(label="Transactionnel", count=332000, percent=61.3, color=TYPE_COLORS["Transactionnel"]),
            TypeDistributionItem(label="Marketing", count=128400, percent=23.7, color=TYPE_COLORS["Marketing"]),
            TypeDistributionItem(label="Facture", count=46600, percent=8.6, color=TYPE_COLORS["Facture"]),
            TypeDistributionItem(label="Notification", count=21600, percent=4.0, color=TYPE_COLORS["Notification"]),
            TypeDistributionItem(label="Support", count=10800, percent=2.0, color=TYPE_COLORS["Support"]),
            TypeDistributionItem(label="Sécurité", count=2780, percent=0.4, color=TYPE_COLORS["Sécurité"]),
        ]

        return EmailDashboardResponse(
            kpis=kpis,
            messages=[self._msg(m) for m in messages],
            templates=[self._tpl(t) for t in templates],
            campaigns=[self._camp(c) for c in campaigns],
            automations=[self._auto(a) for a in automations],
            type_distribution=type_dist,
            domain_performance=[
                DomainPerformanceItem(domain="gmail.com", delivery_rate=99.4, open_rate=42.1, click_rate=10.2, bounce_rate=0.6),
                DomainPerformanceItem(domain="yahoo.com", delivery_rate=98.8, open_rate=35.4, click_rate=8.4, bounce_rate=1.1),
                DomainPerformanceItem(domain="outlook.com", delivery_rate=99.0, open_rate=38.2, click_rate=9.1, bounce_rate=0.9),
                DomainPerformanceItem(domain="hotmail.com", delivery_rate=98.2, open_rate=32.8, click_rate=7.6, bounce_rate=1.4),
            ],
            deliverability=[self._deliv(d) for d in deliverability],
            bounces=[self._bounce(b) for b in bounces],
            unsubscribe_summary=UnsubscribeSummary(total=86, campaign=24, marketing=62, preferences_count=142),
            unsubscribes=[self._unsub(u) for u in unsubscribes],
            invoice_summary=InvoiceSummary(sent=12400, opened=8840, downloaded=6200, reminders=420, failures=18),
            invoices=[self._inv(i) for i in invoices],
            webhooks=[self._webhook(w) for w in webhooks],
            alerts=[self._alert(a) for a in alerts],
            analytics=[
                AnalyticsSeries(key="emails_day", title="Emails par jour", data=[AnalyticsPoint(label=d, value=v) for d, v in zip(["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], [15200, 16800, 17200, 17800, 18420, 12400, 9800])]),
                AnalyticsSeries(key="open_rate", title="Taux ouverture", data=[AnalyticsPoint(label=d, value=v) for d, v in zip(["S1", "S2", "S3", "S4"], [36, 37, 38, 38.4])]),
                AnalyticsSeries(key="click_rate", title="Taux clic", data=[AnalyticsPoint(label=d, value=v) for d, v in zip(["S1", "S2", "S3", "S4"], [8.2, 8.6, 9.0, 9.2])]),
                AnalyticsSeries(key="revenue", title="Revenus attribués", data=[AnalyticsPoint(label=m, value=v) for m, v in zip(["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"], [8200, 9100, 10200, 11200, 12100, 12850])]),
            ],
            segments=[
                SegmentItem(slug="all_clients", name="Tous les clients", size=28400),
                SegmentItem(slug="active", name="Clients actifs", size=12800),
                SegmentItem(slug="inactive", name="Clients inactifs", size=6400),
                SegmentItem(slug="vip", name="VIP", size=840),
                SegmentItem(slug="partners", name="Partenaires", size=320),
                SegmentItem(slug="drivers", name="Chauffeurs", size=180),
                SegmentItem(slug="support", name="Support", size=420),
                SegmentItem(slug="unverified", name="Non vérifiés", size=1240),
            ],
            settings=EmailSettingsResponse(
                provider=sj.get("provider", "resend"),
                from_email=sj.get("from_email", "noreply@laundryexpress.cd"),
                reply_to=sj.get("reply_to", "support@laundryexpress.cd"),
                marketing_opt_out_required=sj.get("marketing_opt_out_required", True),
            ),
            source="backend",
        )

    def get_message(self, msg_id: str) -> EmailMessageItem | None:
        m = self.db.query(EmailMessage).filter(EmailMessage.id == msg_id).first()
        return self._msg(m) if m else None

    def _msg(self, m: EmailMessage) -> EmailMessageItem:
        return EmailMessageItem(
            id=str(m.id), reference=m.reference, recipient_email=m.recipient_email, recipient_name=m.recipient_name,
            subject=m.subject, message_type=m.message_type, message_type_label=EmailOpsService.type_label(m.message_type),
            template_name=m.template_name, status=m.status, status_label=EmailOpsService.status_label(m.status),
            open_rate=m.open_rate, click_rate=m.click_rate, sent_at=m.sent_at,
        )

    def _tpl(self, t: EmailTemplate) -> EmailTemplateItem:
        return EmailTemplateItem(
            id=str(t.id), name=t.name, template_type=t.template_type,
            type_label=EmailOpsService.template_type_label(t.template_type),
            language=t.language, subject=t.subject, status=t.status,
            usage_count=t.usage_count, open_rate=t.open_rate, click_rate=t.click_rate, version=t.version,
        )

    def _camp(self, c: EmailCampaign) -> EmailCampaignItem:
        return EmailCampaignItem(
            id=str(c.id), name=c.name, audience=c.audience, status=c.status,
            status_label=EmailOpsService.camp_status_label(c.status),
            sent_count=c.sent_count, opened_count=c.opened_count, clicked_count=c.clicked_count,
            conversions=c.conversions, revenue=c.revenue, roi=c.roi,
        )

    def _auto(self, a: EmailAutomation) -> EmailAutomationItem:
        return EmailAutomationItem(
            id=str(a.id), name=a.name, trigger_key=a.trigger_key,
            trigger_label=a.trigger_key.replace("_", " ").title(),
            template_name=a.template_name, status=a.status, last_run_at=a.last_run_at,
            volume_30d=a.volume_30d, open_rate=a.open_rate, click_rate=a.click_rate,
        )

    def _deliv(self, d: EmailDeliverability) -> DeliverabilityItem:
        return DeliverabilityItem(
            domain=d.domain, health_status=d.health_status, health_label=EmailOpsService.health_label(d.health_status),
            spf=d.spf, dkim=d.dkim, dmarc=d.dmarc, bounce_rate=d.bounce_rate,
            spam_complaints=d.spam_complaints, reputation_score=d.reputation_score,
        )

    def _bounce(self, b: EmailBounce) -> BounceItem:
        return BounceItem(
            id=str(b.id), email=b.email, bounce_type=b.bounce_type,
            bounce_type_label=EmailOpsService.bounce_type_label(b.bounce_type),
            reason=b.reason, provider_code=b.provider_code, occurred_at=b.occurred_at,
        )

    def _unsub(self, u: EmailUnsubscribe) -> UnsubscribeItem:
        return UnsubscribeItem(
            id=str(u.id), email=u.email, unsubscribe_type=u.unsubscribe_type,
            type_label=EmailOpsService.unsub_type_label(u.unsubscribe_type), reason=u.reason,
        )

    def _inv(self, i: EmailInvoiceLog) -> InvoiceLogItem:
        return InvoiceLogItem(
            id=str(i.id), invoice_ref=i.invoice_ref, recipient_email=i.recipient_email,
            status=i.status, opened=i.opened, downloaded=i.downloaded, reminder_count=i.reminder_count,
        )

    def _alert(self, a: EmailAlert) -> AlertItem:
        return AlertItem(id=str(a.id), alert_type=a.alert_type, title=a.title, severity=a.severity, count=a.count)

    def _webhook(self, w: EmailWebhook) -> WebhookItem:
        return WebhookItem(
            id=str(w.id), endpoint=w.endpoint, secret_masked=w.secret_masked,
            last_call_at=w.last_call_at, success_count=w.success_count, error_count=w.error_count,
            events=w.events or [],
        )
