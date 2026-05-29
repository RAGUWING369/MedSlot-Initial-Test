# MedSlot Backend Dockerfile
# Shared image for API, Celery worker, and Celery Beat (different CMD per service).
# Stages: base → development (dev server) / production (gunicorn).

# ── Stage 1: base ──────────────────────────────────────────────────────────────
FROM python:3.12-slim AS base

# Prevent Python from writing .pyc files and enable unbuffered stdout/stderr
# so container logs surface immediately without buffering.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System dependencies:
#   libpq-dev + gcc  — required by psycopg2 (PostgreSQL adapter)
#   libpango-* + libharfbuzz + libffi-dev + libcairo2 + libgdk-pixbuf2.0-0
#     + shared-mime-info — WeasyPrint runtime dependencies for PDF generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libffi-dev \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 2: development ───────────────────────────────────────────────────────
FROM base AS development

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy source last so code changes don't invalidate the dependency cache layer.
COPY . .

ENTRYPOINT ["/entrypoint.sh"]
# Default dev command; overridden per-service in docker-compose.yml for worker/beat.
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# ── Stage 3: production ────────────────────────────────────────────────────────
FROM base AS production

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY . .

# Run as a non-root user in production for security.
RUN addgroup --system django && adduser --system --ingroup django django
USER django

ENTRYPOINT ["/entrypoint.sh"]
# 2 gunicorn workers; timeout 120s to accommodate WeasyPrint PDF generation.
CMD ["gunicorn", "medslot.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120"]
