"""
Root pytest configuration for MedSlot backend.

Provides shared fixtures available to all test modules.
pytest-django handles Django setup via pyproject.toml DJANGO_SETTINGS_MODULE.
"""
import pytest
from django.test import RequestFactory


@pytest.fixture
def request_factory() -> RequestFactory:
    """Return a Django RequestFactory for unit-testing views without HTTP."""
    return RequestFactory()
