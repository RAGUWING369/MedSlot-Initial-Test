"""
Base Django settings for MedSlot.

All environment-specific settings (DEBUG, DATABASE_URL, etc.) are loaded
from environment variables using python-decouple. No sensitive values
are hardcoded here.

Usage:
    DJANGO_SETTINGS_MODULE=medslot.settings.local   (development)
    DJANGO_SETTINGS_MODULE=medslot.settings.production  (production)
"""
from pathlib import Path
from decouple import config, Csv  # noqa: F401
from datetime import timedelta

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ── Security ───────────────────────────────────────────────────────────────────
SECRET_KEY = config('SECRET_KEY')

# ── Application definition ─────────────────────────────────────────────────────
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_spectacular',
    'django_redis',
    'corsheaders',
    'django_celery_beat',
]

LOCAL_APPS = [
    'accounts',
    'appointments',
    'prescriptions',
    'records',
    'notifications',
    'subscriptions',
    'analytics',
    'audit',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    # CorsMiddleware must appear BEFORE CommonMiddleware per django-cors-headers docs.
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'medslot.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'medslot.wsgi.application'

# ── Auth ───────────────────────────────────────────────────────────────────────
# CustomUser model defined in TASK-010 (accounts app).
AUTH_USER_MODEL = 'accounts.CustomUser'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── Database ───────────────────────────────────────────────────────────────────
# Populated per-environment in local.py / production.py.
DATABASES = {}

# Persistent connections — reduces connection overhead on each request.
CONN_MAX_AGE = 60

# ── Cache (Redis) ──────────────────────────────────────────────────────────────
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
    }
}

SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# ── Celery ─────────────────────────────────────────────────────────────────────
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Kolkata'

# ── Internationalisation ───────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# ── Static files ───────────────────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Django REST Framework ──────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
}

# ── Simple JWT ─────────────────────────────────────────────────────────────────
# Access tokens last 24 hours per ADR-004.
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': config('JWT_SECRET', default=config('SECRET_KEY')),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# ── drf-spectacular (OpenAPI) ──────────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    'TITLE': 'MedSlot API',
    'DESCRIPTION': 'Healthcare appointment and consultation management platform',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# ── AWS / S3 ───────────────────────────────────────────────────────────────────
AWS_REGION = config('AWS_REGION', default='ap-south-1')
AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default='')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default='')
S3_RECORDS_BUCKET = config('S3_RECORDS_BUCKET', default='')
S3_PRESCRIPTIONS_BUCKET = config('S3_PRESCRIPTIONS_BUCKET', default='')
S3_CREDENTIALS_BUCKET = config('S3_CREDENTIALS_BUCKET', default='')

# ── External Services ──────────────────────────────────────────────────────────
MSG91_API_KEY = config('MSG91_API_KEY', default='')
MSG91_TEMPLATE_ID = config('MSG91_TEMPLATE_ID', default='')
SENDGRID_API_KEY = config('SENDGRID_API_KEY', default='')
SENDGRID_FROM_EMAIL = config('SENDGRID_FROM_EMAIL', default='noreply@medslot.in')
RAZORPAY_KEY_ID = config('RAZORPAY_KEY_ID', default='')
RAZORPAY_KEY_SECRET = config('RAZORPAY_KEY_SECRET', default='')
RAZORPAY_WEBHOOK_SECRET = config('RAZORPAY_WEBHOOK_SECRET', default='')

# ── OTP Security ──────────────────────────────────────────────────────────────
# PEPPER added to OTP before SHA-256 hashing — never logged, never exposed in
# responses, never written to application logs. See ADR-004.
OTP_PEPPER = config('OTP_PEPPER', default='')

# ── Logging ────────────────────────────────────────────────────────────────────
# Structured JSON logging via python-json-logger.
# IMPORTANT: PHI (diagnosis, prescription content, health record metadata)
# must NEVER appear in log messages. Log request IDs and user IDs only.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'medslot': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
