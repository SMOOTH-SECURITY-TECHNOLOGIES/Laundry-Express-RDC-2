import os
from celery import Celery
from app.core.config import settings

# Configuration Celery
celery_app = Celery(
    "laundry_express",
    broker=settings.WORKER_BROKER_URL,
    backend=settings.WORKER_RESULT_BACKEND,
    include=["app.workers.tasks"]
)

# Configuration Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Kinshasa",
    enable_utc=True,
    worker_concurrency=settings.WORKER_CONCURRENCY,
    worker_max_tasks_per_child=settings.WORKER_MAX_TASKS_PER_CHILD,
    task_routes={
        "app.workers.tasks.*": {"queue": "default"},
        "app.workers.tasks.send_email": {"queue": "email"},
        "app.workers.tasks.process_image": {"queue": "image_processing"},
    },
    task_queues={
        "default": {
            "exchange": "default",
            "exchange_type": "direct",
            "routing_key": "default",
        },
        "email": {
            "exchange": "email",
            "exchange_type": "direct",
            "routing_key": "email",
        },
        "image_processing": {
            "exchange": "image_processing",
            "exchange_type": "direct",
            "routing_key": "image_processing",
        },
    }
)

if __name__ == "__main__":
    celery_app.start()