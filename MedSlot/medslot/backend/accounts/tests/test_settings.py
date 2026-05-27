"""
Smoke tests for Django settings and base configuration.

Verifies that required apps are installed, cache is configured,
and DRF/JWT settings are correct. These tests guard against
accidental misconfiguration — a wrong INSTALLED_APPS entry or a
missing middleware can silently break authentication or CORS for
all environments.
"""
from datetime import timedelta

import pytest
from django.conf import settings


@pytest.mark.django_db
class TestBaseConfiguration:
    """Verify critical settings are present and correct."""

    def test_required_apps_installed(self) -> None:
        """All 8 MedSlot apps must be in INSTALLED_APPS."""
        required_apps = [
            "accounts",
            "appointments",
            "prescriptions",
            "records",
            "notifications",
            "subscriptions",
            "analytics",
            "audit",
        ]
        for app in required_apps:
            assert app in settings.INSTALLED_APPS, f"'{app}' missing from INSTALLED_APPS"

    def test_drf_installed(self) -> None:
        """Django REST Framework must be installed."""
        assert "rest_framework" in settings.INSTALLED_APPS

    def test_corsheaders_installed(self) -> None:
        """django-cors-headers must be in INSTALLED_APPS."""
        assert "corsheaders" in settings.INSTALLED_APPS

    def test_django_celery_beat_installed(self) -> None:
        """django-celery-beat must be in INSTALLED_APPS for Beat scheduler."""
        assert "django_celery_beat" in settings.INSTALLED_APPS

    def test_custom_user_model(self) -> None:
        """AUTH_USER_MODEL must point to accounts.CustomUser."""
        assert settings.AUTH_USER_MODEL == "accounts.CustomUser"

    def test_jwt_lifetime_24h(self) -> None:
        """JWT access token lifetime must be 24 hours per ADR-004."""
        assert settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"] == timedelta(hours=24)

    def test_jwt_algorithm_hs256(self) -> None:
        """JWT algorithm must be HS256 per ADR-004."""
        assert settings.SIMPLE_JWT["ALGORITHM"] == "HS256"

    def test_drf_default_authentication(self) -> None:
        """DRF must use JWT authentication by default."""
        auth_classes = settings.REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"]
        assert "rest_framework_simplejwt.authentication.JWTAuthentication" in auth_classes

    def test_cache_configured(self) -> None:
        """Redis cache must be configured."""
        assert "default" in settings.CACHES
        assert "RedisCache" in settings.CACHES["default"]["BACKEND"]

    def test_conn_max_age(self) -> None:
        """Database CONN_MAX_AGE must be 60 seconds for persistent connections."""
        assert settings.CONN_MAX_AGE == 60

    def test_cors_middleware_before_common(self) -> None:
        """CorsMiddleware must appear before CommonMiddleware in MIDDLEWARE."""
        middleware = settings.MIDDLEWARE
        cors_idx = next(
            (i for i, m in enumerate(middleware) if "CorsMiddleware" in m), None
        )
        common_idx = next(
            (i for i, m in enumerate(middleware) if "CommonMiddleware" in m), None
        )
        assert cors_idx is not None, "CorsMiddleware not found in MIDDLEWARE"
        assert common_idx is not None, "CommonMiddleware not found in MIDDLEWARE"
        assert cors_idx < common_idx, (
            "CorsMiddleware must appear BEFORE CommonMiddleware "
            f"(found at positions {cors_idx} and {common_idx})"
        )

    def test_celery_broker_url_configured(self) -> None:
        """Celery broker URL must be set (uses REDIS_URL)."""
        assert settings.CELERY_BROKER_URL is not None
        assert settings.CELERY_BROKER_URL != ""

    def test_celery_result_backend_configured(self) -> None:
        """Celery result backend must be set."""
        assert settings.CELERY_RESULT_BACKEND is not None
        assert settings.CELERY_RESULT_BACKEND != ""

    def test_celery_timezone_india(self) -> None:
        """Celery timezone must be Asia/Kolkata for IST scheduling."""
        assert settings.CELERY_TIMEZONE == "Asia/Kolkata"

    def test_logging_uses_json_formatter(self) -> None:
        """Structured JSON logging must be configured via python-json-logger."""
        formatters = settings.LOGGING.get("formatters", {})
        assert "json" in formatters, "JSON log formatter not configured"
        json_formatter = formatters["json"]
        assert "JsonFormatter" in json_formatter.get("()", ""), (
            "JSON formatter must use pythonjsonlogger.jsonlogger.JsonFormatter"
        )

    def test_auth_user_model_in_installed_apps_order(self) -> None:
        """accounts app must appear in INSTALLED_APPS for CustomUser to resolve."""
        # AUTH_USER_MODEL = 'accounts.CustomUser' requires the accounts app to be installed.
        assert "accounts" in settings.INSTALLED_APPS


class TestDRFConfiguration:
    """Verify DRF settings without requiring database access."""

    def test_default_renderer_json(self) -> None:
        """Default renderer must be JSON — no BrowsableAPIRenderer in production."""
        renderers = settings.REST_FRAMEWORK.get("DEFAULT_RENDERER_CLASSES", [])
        assert "rest_framework.renderers.JSONRenderer" in renderers

    def test_browsable_api_renderer_absent(self) -> None:
        """BrowsableAPIRenderer must not be in DEFAULT_RENDERER_CLASSES."""
        renderers = settings.REST_FRAMEWORK.get("DEFAULT_RENDERER_CLASSES", [])
        assert "rest_framework.renderers.BrowsableAPIRenderer" not in renderers

    def test_pagination_configured(self) -> None:
        """Default pagination must be configured."""
        assert settings.REST_FRAMEWORK.get("DEFAULT_PAGINATION_CLASS") is not None

    def test_page_size_20(self) -> None:
        """PAGE_SIZE must be 20."""
        assert settings.REST_FRAMEWORK.get("PAGE_SIZE") == 20

    def test_schema_class_drf_spectacular(self) -> None:
        """DEFAULT_SCHEMA_CLASS must use drf-spectacular for OpenAPI generation."""
        schema_class = settings.REST_FRAMEWORK.get("DEFAULT_SCHEMA_CLASS", "")
        assert "drf_spectacular" in schema_class

    def test_default_permission_is_authenticated(self) -> None:
        """Default permission class must require authentication."""
        perm_classes = settings.REST_FRAMEWORK.get("DEFAULT_PERMISSION_CLASSES", [])
        assert "rest_framework.permissions.IsAuthenticated" in perm_classes
