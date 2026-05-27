# MedSlot Backend Dockerfile
# Shared image for API, Celery worker, and Celery Beat (different CMD per service).
# Full multi-stage build and production config are configured in TASK-002
# (Docker Compose Local Development Environment).

FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Default command: API server (overridden for worker and beat in docker-compose.yml)
CMD ["gunicorn", "medslot.wsgi:application", "--bind", "0.0.0.0:8000"]
