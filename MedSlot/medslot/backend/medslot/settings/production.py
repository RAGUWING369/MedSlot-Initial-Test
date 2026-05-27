"""
Production settings for MedSlot.

All secrets must be provided via environment variables — injected by ECS
task definitions from AWS Secrets Manager / Parameter Store.
Never commit actual values to source control.
"""
from .base import *  # noqa: F401, F403
from decouple import config

DEBUG = False

ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=lambda v: [s.strip() for s in v.split(',')])

# ── Database ───────────────────────────────────────────────────────────────────
# sslmode=require enforces TLS for all connections to RDS (NFR compliance).
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB'),
        'USER': config('POSTGRES_USER'),
        'PASSWORD': config('POSTGRES_PASSWORD'),
        'HOST': config('POSTGRES_HOST'),
        'PORT': config('POSTGRES_PORT', default='5432'),
        'CONN_MAX_AGE': 60,
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

# ── Security headers ───────────────────────────────────────────────────────────
# HSTS and secure cookie settings required for TLS 1.2+ compliance.
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'

# ── Static files (served via CloudFront CDN in production) ─────────────────────
STATIC_ROOT = '/app/staticfiles'
