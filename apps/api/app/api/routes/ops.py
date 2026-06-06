from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy import func, or_, and_, desc
from sqlalchemy.orm import Session

from app.api.dependencies import get_sync_db
from app.models.order import Order, OrderStatusHistory
from app.models.operational import OperationalProof, OperationalTimeline
from app.models.payment import PaymentIntent, PaymentTransaction, PaymentProviderEvent
from app.models.logistics import DeliveryTask
from app.schemas.ops import (
    TruthTimelineResponse,
    TimelineEventResponse,
    ProofResponse,
    CorridorHealthResponse,
    CorridorHealthItem,
    AnomalyListResponse,
    AnomalyResponse,
    InvestigationResult,
    AnomalyType,
    CorridorType,
    CorridorHealthStatus,
)

router = APIRouter(prefix="/ops", tags=["ops"])


# Simple sync auth check for ops routes
from app.core.config import settings
from jose import ExpiredSignatureError, JWTError, jwt

ADMIN_ROLES = {"admin", "superadmin"}

def verify_admin_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant")
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        role = payload.get("role")
        if role not in ADMIN_ROLES:
            raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")
    return True


@router.get("/orders/{order_id}/truth-timeline", response_model=TruthTimelineResponse)
def get_order_truth_timeline(
    order_id: UUID,
    db: Session = Depends(get_sync_db),
    _: bool = Depends(verify_admin_token),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    timeline_events = (
        db.query(OperationalTimeline)
        .filter(OperationalTimeline.order_id == order_id)
        .order_by(OperationalTimeline.occurred_at.asc())
        .all()
    )

    proofs = (
        db.query(OperationalProof)
        .filter(OperationalProof.order_id == order_id)
        .order_by(OperationalProof.recorded_at.asc())
        .all()
    )

    timeline_responses = [
        TimelineEventResponse(
            id=e.id,
            order_id=e.order_id,
            task_id=e.task_id,
            event_type=e.event_type,
            event_subtype=e.event_subtype,
            from_status=e.from_status,
            to_status=e.to_status,
            payload=e.payload or {},
            occurred_at=e.occurred_at,
            source=e.source,
            correlation_id=e.correlation_id,
            created_at=e.created_at,
        )
        for e in timeline_events
    ]

    proof_responses = [
        ProofResponse(
            id=p.id,
            order_id=p.order_id,
            task_id=p.task_id,
            proof_type=p.proof_type,
            proof_data=p.proof_data or {},
            actor_type=p.actor_type,
            actor_id=p.actor_id,
            actor_name=p.actor_name,
            recorded_at=p.recorded_at,
            verified_at=p.verified_at,
            location_lat=p.location_lat,
            location_lng=p.location_lng,
            location_accuracy=p.location_accuracy,
            verification_status=p.verification_status,
            verification_method=p.verification_method,
            verification_notes=p.verification_notes,
            created_at=p.created_at,
        )
        for p in proofs
    ]

    return TruthTimelineResponse(
        order_id=order.id,
        order_number=order.order_number,
        customer_id=order.customer_id,
        partner_id=order.partner_id,
        current_status=order.status.value if order.status else None,
        version=order.version,
        events=timeline_responses,
        proofs=proof_responses,
    )


@router.get("/orders/{order_id}/proofs", response_model=list[ProofResponse])
def get_order_proofs(
    order_id: UUID,
    db: Session = Depends(get_sync_db),
    _: bool = Depends(verify_admin_token),
):
    proofs = (
        db.query(OperationalProof)
        .filter(OperationalProof.order_id == order_id)
        .order_by(OperationalProof.recorded_at.asc())
        .all()
    )

    return [
        ProofResponse(
            id=p.id,
            order_id=p.order_id,
            task_id=p.task_id,
            proof_type=p.proof_type,
            proof_data=p.proof_data or {},
            actor_type=p.actor_type,
            actor_id=p.actor_id,
            actor_name=p.actor_name,
            recorded_at=p.recorded_at,
            verified_at=p.verified_at,
            location_lat=p.location_lat,
            location_lng=p.location_lng,
            location_accuracy=p.location_accuracy,
            verification_status=p.verification_status,
            verification_method=p.verification_method,
            verification_notes=p.verification_notes,
            created_at=p.created_at,
        )
        for p in proofs
    ]


@router.get("/corridors/health", response_model=CorridorHealthResponse)
def get_corridors_health(
    db: Session = Depends(get_sync_db),
    _: bool = Depends(verify_admin_token),
):
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)

    order_last = db.query(func.max(OperationalTimeline.occurred_at)).filter(
        OperationalTimeline.source == CorridorType.ORDER
    ).scalar()

    payment_last = db.query(func.max(OperationalTimeline.occurred_at)).filter(
        OperationalTimeline.source == CorridorType.PAYMENT
    ).scalar()

    logistics_last = db.query(func.max(OperationalTimeline.occurred_at)).filter(
        OperationalTimeline.source == CorridorType.LOGISTICS
    ).scalar()

    order_anomalies = db.query(func.count(OperationalTimeline.id)).filter(
        OperationalTimeline.event_subtype == AnomalyType.TRANSITION_REJECTED,
        OperationalTimeline.occurred_at >= one_hour_ago,
    ).scalar() or 0

    payment_anomalies = db.query(func.count(PaymentProviderEvent.id)).filter(
        PaymentProviderEvent.event_type == "duplicate",
        PaymentProviderEvent.created_at >= one_hour_ago,
    ).scalar() or 0

    logistics_anomalies = db.query(func.count(DeliveryTask.id)).filter(
        DeliveryTask.proof_photo_url.is_(None),
        DeliveryTask.status == "completed",
        DeliveryTask.completed_at >= one_hour_ago,
    ).scalar() or 0

    def risk_for(anomaly_count: int, last_event: Optional[datetime]) -> str:
        if anomaly_count > 5:
            return "high"
        if anomaly_count > 0:
            return "medium"
        if last_event and (now - last_event) > timedelta(hours=2):
            return "medium"
        return "low"

    def status_for(anomaly_count: int) -> str:
        if anomaly_count > 5:
            return CorridorHealthStatus.CRITICAL
        if anomaly_count > 0:
            return CorridorHealthStatus.WARNING
        return CorridorHealthStatus.HEALTHY

    return CorridorHealthResponse(
        corridors=[
            CorridorHealthItem(
                corridor="order",
                status=status_for(order_anomalies),
                open_anomalies=order_anomalies,
                last_event_at=order_last,
                risk_level=risk_for(order_anomalies, order_last),
            ),
            CorridorHealthItem(
                corridor="payment",
                status=status_for(payment_anomalies),
                open_anomalies=payment_anomalies,
                last_event_at=payment_last,
                risk_level=risk_for(payment_anomalies, payment_last),
            ),
            CorridorHealthItem(
                corridor="logistics",
                status=status_for(logistics_anomalies),
                open_anomalies=logistics_anomalies,
                last_event_at=logistics_last,
                risk_level=risk_for(logistics_anomalies, logistics_last),
            ),
        ],
        checked_at=now,
    )


@router.get("/anomalies", response_model=AnomalyListResponse)
def get_anomalies(
    corridor: Optional[str] = Query(None, description="Filtrer par corridor (order, payment, logistics)"),
    severity: Optional[str] = Query(None, description="Filtrer par sévérité"),
    resolved: Optional[bool] = Query(None, description="Filtrer par statut de résolution"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_sync_db),
    _: bool = Depends(verify_admin_token),
):
    now = datetime.utcnow()
    one_day_ago = now - timedelta(days=1)

    anomalies = []

    if corridor is None or corridor == "order":
        rejected = (
            db.query(OperationalTimeline)
            .filter(
                OperationalTimeline.event_subtype == AnomalyType.TRANSITION_REJECTED,
                OperationalTimeline.occurred_at >= one_day_ago,
            )
            .order_by(desc(OperationalTimeline.occurred_at))
            .all()
        )
        for t in rejected:
            anomalies.append(AnomalyResponse(
                id=t.id,
                anomaly_type=AnomalyType.TRANSITION_REJECTED,
                corridor=CorridorType.ORDER,
                order_id=t.order_id,
                payment_intent_id=None,
                task_id=t.task_id,
                description=f"Transition refusée: {t.payload.get('reason', 'Unknown')}",
                severity="medium",
                detected_at=t.occurred_at,
                resolved_at=None,
                payload=t.payload or {},
            ))

    if corridor is None or corridor == "payment":
        duplicates = (
            db.query(PaymentProviderEvent)
            .filter(
                PaymentProviderEvent.event_type == "duplicate",
                PaymentProviderEvent.created_at >= one_day_ago,
            )
            .order_by(desc(PaymentProviderEvent.created_at))
            .all()
        )
        for p in duplicates:
            anomalies.append(AnomalyResponse(
                id=p.id,
                anomaly_type=AnomalyType.WEBHOOK_DUPLICATE,
                corridor=CorridorType.PAYMENT,
                order_id=None,
                payment_intent_id=p.payment_intent_id,
                task_id=None,
                description=f"Webhook duplicate: {p.event_type} de {p.provider}",
                severity="low",
                detected_at=p.created_at,
                resolved_at=None,
                payload={"event_type": p.event_type, "provider": p.provider},
            ))

    if corridor is None or corridor == "logistics":
        missing_proof = (
            db.query(DeliveryTask)
            .filter(
                DeliveryTask.proof_photo_url.is_(None),
                DeliveryTask.proof_note.is_(None),
                DeliveryTask.status == "completed",
                DeliveryTask.completed_at >= one_day_ago,
            )
            .order_by(desc(DeliveryTask.completed_at))
            .all()
        )
        for t in missing_proof:
            anomalies.append(AnomalyResponse(
                id=t.id,
                anomaly_type=AnomalyType.DELIVERED_WITHOUT_PROOF,
                corridor=CorridorType.LOGISTICS,
                order_id=t.order_id,
                payment_intent_id=None,
                task_id=t.id,
                description=f"Tâche {t.task_type} terminée sans preuve",
                severity="high",
                detected_at=t.completed_at or now,
                resolved_at=None,
                payload={"task_type": t.task_type.value if t.task_type else None},
            ))

    anomalies.sort(key=lambda a: a.detected_at, reverse=True)

    if severity:
        anomalies = [a for a in anomalies if a.severity == severity]
    if resolved is not None:
        if resolved:
            anomalies = [a for a in anomalies if a.resolved_at is not None]
        else:
            anomalies = [a for a in anomalies if a.resolved_at is None]

    total = len(anomalies)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = anomalies[start:end]

    return AnomalyListResponse(
        anomalies=paginated,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/investigate", response_model=InvestigationResult)
def investigate(
    order_id: Optional[UUID] = Query(None),
    payment_intent_id: Optional[UUID] = Query(None),
    delivery_task_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_sync_db),
    _: bool = Depends(verify_admin_token),
):
    if not order_id and not payment_intent_id and not delivery_task_id:
        raise HTTPException(
            status_code=400,
            detail="Au moins un paramètre requis: order_id, payment_intent_id, ou delivery_task_id",
        )

    result = InvestigationResult(
        order=None,
        payment_intent=None,
        delivery_tasks=[],
        timelines=[],
        proofs=[],
        status_history=[],
        anomalies=[],
        summary={},
    )

    resolved_order_id = order_id

    if payment_intent_id and not resolved_order_id:
        pi = db.query(PaymentIntent).filter(PaymentIntent.id == payment_intent_id).first()
        if pi:
            resolved_order_id = pi.order_id

    if delivery_task_id and not resolved_order_id:
        task = db.query(DeliveryTask).filter(DeliveryTask.id == delivery_task_id).first()
        if task:
            resolved_order_id = task.order_id

    if resolved_order_id:
        order = db.query(Order).filter(Order.id == resolved_order_id).first()
        if order:
            result.order = {
                "id": str(order.id),
                "order_number": order.order_number,
                "status": order.status.value if order.status else None,
                "payment_status": order.payment_status.value if order.payment_status else None,
                "total_amount": str(order.total_amount),
                "amount_paid": str(order.amount_paid),
                "version": order.version,
                "created_at": order.created_at.isoformat() if order.created_at else None,
                "confirmed_at": order.confirmed_at.isoformat() if order.confirmed_at else None,
                "completed_at": order.completed_at.isoformat() if order.completed_at else None,
            }

            status_hist = (
                db.query(OrderStatusHistory)
                .filter(OrderStatusHistory.order_id == order.id)
                .order_by(OrderStatusHistory.created_at.asc())
                .all()
            )
            result.status_history = [
                {
                    "id": str(h.id),
                    "old_status": h.old_status,
                    "new_status": h.new_status,
                    "changed_by_user_id": str(h.changed_by_user_id) if h.changed_by_user_id else None,
                    "change_reason": h.change_reason,
                    "created_at": h.created_at.isoformat() if h.created_at else None,
                }
                for h in status_hist
            ]

            timelines = (
                db.query(OperationalTimeline)
                .filter(OperationalTimeline.order_id == order.id)
                .order_by(OperationalTimeline.occurred_at.asc())
                .all()
            )
            result.timelines = [
                TimelineEventResponse(
                    id=t.id,
                    order_id=t.order_id,
                    task_id=t.task_id,
                    event_type=t.event_type,
                    event_subtype=t.event_subtype,
                    from_status=t.from_status,
                    to_status=t.to_status,
                    payload=t.payload or {},
                    occurred_at=t.occurred_at,
                    source=t.source,
                    correlation_id=t.correlation_id,
                    created_at=t.created_at,
                )
                for t in timelines
            ]

            proofs = (
                db.query(OperationalProof)
                .filter(OperationalProof.order_id == order.id)
                .order_by(OperationalProof.recorded_at.asc())
                .all()
            )
            result.proofs = [
                ProofResponse(
                    id=p.id,
                    order_id=p.order_id,
                    task_id=p.task_id,
                    proof_type=p.proof_type,
                    proof_data=p.proof_data or {},
                    actor_type=p.actor_type,
                    actor_id=p.actor_id,
                    actor_name=p.actor_name,
                    recorded_at=p.recorded_at,
                    verified_at=p.verified_at,
                    location_lat=p.location_lat,
                    location_lng=p.location_lng,
                    location_accuracy=p.location_accuracy,
                    verification_status=p.verification_status,
                    verification_method=p.verification_method,
                    verification_notes=p.verification_notes,
                    created_at=p.created_at,
                )
                for p in proofs
            ]

            tasks = (
                db.query(DeliveryTask)
                .filter(DeliveryTask.order_id == order.id)
                .order_by(DeliveryTask.created_at.asc())
                .all()
            )
            result.delivery_tasks = [
                {
                    "id": str(t.id),
                    "task_type": t.task_type.value if t.task_type else None,
                    "status": t.status.value if t.status else None,
                    "driver_id": str(t.driver_id) if t.driver_id else None,
                    "proof_photo_url": t.proof_photo_url,
                    "proof_note": t.proof_note,
                    "failure_reason": t.failure_reason,
                    "created_at": t.created_at.isoformat() if t.created_at else None,
                    "completed_at": t.completed_at.isoformat() if t.completed_at else None,
                }
                for t in tasks
            ]

            payment_intent = db.query(PaymentIntent).filter(PaymentIntent.order_id == order.id).first()
            if payment_intent:
                result.payment_intent = {
                    "id": str(payment_intent.id),
                    "payment_method": payment_intent.payment_method,
                    "provider": payment_intent.provider,
                    "amount": str(payment_intent.amount),
                    "amount_paid": str(payment_intent.amount_paid),
                    "status": payment_intent.status,
                    "provider_reference": payment_intent.provider_reference,
                    "created_at": payment_intent.created_at.isoformat() if payment_intent.created_at else None,
                    "paid_at": payment_intent.paid_at.isoformat() if payment_intent.paid_at else None,
                }

            result.summary = {
                "order_number": order.order_number,
                "current_status": order.status.value if order.status else None,
                "total_events": len(timelines),
                "total_proofs": len(proofs),
                "total_tasks": len(tasks),
                "has_payment": result.payment_intent is not None,
                "timeline_complete": len(timelines) > 0,
            }

            # Populate anomalies for this order
            rejected = (
                db.query(OperationalTimeline)
                .filter(
                    OperationalTimeline.order_id == order.id,
                    OperationalTimeline.event_subtype == AnomalyType.TRANSITION_REJECTED,
                )
                .order_by(desc(OperationalTimeline.occurred_at))
                .all()
            )
            for t in rejected:
                result.anomalies.append(AnomalyResponse(
                    id=t.id,
                    anomaly_type=AnomalyType.TRANSITION_REJECTED,
                    corridor=CorridorType.ORDER,
                    order_id=t.order_id,
                    payment_intent_id=None,
                    task_id=t.task_id,
                    description=f"Transition refusée: {t.payload.get('reason', 'Unknown')}",
                    severity="medium",
                    detected_at=t.occurred_at,
                    resolved_at=None,
                    payload=t.payload or {},
                ))

            if payment_intent:
                duplicates = (
                    db.query(PaymentProviderEvent)
                    .filter(
                        PaymentProviderEvent.payment_intent_id == payment_intent.id,
                        PaymentProviderEvent.event_type == "duplicate",
                    )
                    .order_by(desc(PaymentProviderEvent.created_at))
                    .all()
                )
                for p in duplicates:
                    result.anomalies.append(AnomalyResponse(
                        id=p.id,
                        anomaly_type=AnomalyType.WEBHOOK_DUPLICATE,
                        corridor=CorridorType.PAYMENT,
                        order_id=None,
                        payment_intent_id=p.payment_intent_id,
                        task_id=None,
                        description=f"Webhook duplicate: {p.event_type} de {p.provider}",
                        severity="low",
                        detected_at=p.created_at,
                        resolved_at=None,
                        payload={"event_type": p.event_type, "provider": p.provider},
                    ))

            missing_proof = (
                db.query(DeliveryTask)
                .filter(
                    DeliveryTask.order_id == order.id,
                    DeliveryTask.proof_photo_url.is_(None),
                    DeliveryTask.proof_note.is_(None),
                    DeliveryTask.status == "completed",
                )
                .order_by(desc(DeliveryTask.completed_at))
                .all()
            )
            for t in missing_proof:
                result.anomalies.append(AnomalyResponse(
                    id=t.id,
                    anomaly_type=AnomalyType.DELIVERED_WITHOUT_PROOF,
                    corridor=CorridorType.LOGISTICS,
                    order_id=t.order_id,
                    payment_intent_id=None,
                    task_id=t.id,
                    description=f"Tâche {t.task_type} terminée sans preuve",
                    severity="high",
                    detected_at=t.completed_at or datetime.utcnow(),
                    resolved_at=None,
                    payload={"task_type": t.task_type.value if t.task_type else None},
                ))

            result.anomalies.sort(key=lambda a: a.detected_at, reverse=True)

    return result
