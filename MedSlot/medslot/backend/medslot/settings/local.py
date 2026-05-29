"""
Local development settings for MedSlot.

Extends base.py with development-friendly overrides.
Never use these settings in production.
"""
from .base import *  # noqa: F401, F403
from decouple import config

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'api']

# ── Database ───────────────────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB', default='medslot'),
        'USER': config('POSTGRES_USER', default='medslot'),
        'PASSWORD': config('POSTGRES_PASSWORD', default='medslot_dev'),
        'HOST': config('POSTGRES_HOST', default='db'),
        'PORT': config('POSTGRES_PORT', default='5432'),
        'CONN_MAX_AGE': 60,
    }
}

# ── Email (console backend for local dev — no real emails sent) ───────────────
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
CORS_ALLOW_CREDENTIALS = True

# ── Debug SQL (optional) ──────────────────────────────────────────────────────
# Uncomment to log all SQL queries during development:
# LOGGING['loggers']['django.db.backends'] = {
#     'handlers': ['console'],
#     'level': 'DEBUG',
#     'propagate': False,
# }
