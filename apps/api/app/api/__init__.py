from fastapi import APIRouter

from app.api.routes import auth, users, orders, catalog, pricing, logistics, marketplace, dispatch_settings, payments, refunds, disputes, commissions, admin, support, promotions, content, subscriptions, tracking, notifications, advertisements, loyalty, referral, dashboard, ops

# Crée le router principal de l'API
api_router = APIRouter()

# Inclut les routers des différents modules
api_router.include_router(auth.router)
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(orders.router)
api_router.include_router(catalog.router, tags=["catalog"])
api_router.include_router(pricing.router, tags=["pricing"])
api_router.include_router(logistics.router, tags=["logistics"])
api_router.include_router(marketplace.router, tags=["marketplace"])
api_router.include_router(dispatch_settings.router, tags=["dispatch-settings"])
api_router.include_router(payments.router, tags=["payments"])
api_router.include_router(refunds.router, tags=["refunds"])
api_router.include_router(disputes.router, tags=["disputes"])
api_router.include_router(commissions.router, tags=["commissions"])
api_router.include_router(admin.router, tags=["admin"])
api_router.include_router(support.router, tags=["support"])
api_router.include_router(promotions.router, tags=["promotions"])
api_router.include_router(content.router, tags=["content"])
api_router.include_router(subscriptions.router, tags=["subscriptions"])
api_router.include_router(tracking.router, tags=["tracking"])
api_router.include_router(notifications.router, tags=["notifications"])
api_router.include_router(advertisements.router, tags=["advertisements"])
api_router.include_router(loyalty.router, tags=["loyalty"])
api_router.include_router(referral.router, tags=["referral"])
api_router.include_router(dashboard.router, tags=["partners"])
api_router.include_router(ops.router, tags=["ops"])

# Exporte le router principal
__all__ = ["api_router"]
