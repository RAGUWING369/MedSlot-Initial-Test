"""
Root URL configuration for the MedSlot project.

App-level routers are included under /api/v1/ as each epic's endpoints are
built out. OpenAPI schema and Swagger UI endpoints are available in all
environments — restrict via SPECTACULAR_SETTINGS['SERVE_PERMISSIONS'] in
production if needed.
"""

from django.contrib import admin
from django.urls import include, path

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    # API v1 — app routers included per epic as they are implemented
    path(
        "api/v1/",
        include(
            [
                # EPIC-002: Authentication & User Identity (TASK-013)
                path("", include("accounts.urls")),
            ]
        ),
    ),
    # OpenAPI schema — raw schema JSON/YAML download
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    # Swagger UI — interactive API browser
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]
