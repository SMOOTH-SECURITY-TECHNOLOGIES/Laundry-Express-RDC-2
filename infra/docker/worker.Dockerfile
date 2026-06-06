FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY apps/api/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy application code
COPY apps/api /app

# Create non-root user
RUN useradd -m -u 1001 worker_user && chown -R worker_user:worker_user /app
USER worker_user

# Default command
CMD ["celery", "-A", "app.workers.main", "worker", "--loglevel=info"]