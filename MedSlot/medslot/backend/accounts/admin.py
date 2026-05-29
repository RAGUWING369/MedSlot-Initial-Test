"""
Django admin registration for accounts models.

Minimal registration — provides basic model visibility in the admin panel.
Full admin customisation (list_display, search_fields, filters, inline
profiles, approval workflow) is scoped to TASK-018 (Doctor Admin Panel).
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import CustomUser, DoctorProfile, PatientProfile, Specialty


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    """Admin for CustomUser — overrides BaseUserAdmin field references."""

    list_display = ("phone", "role", "is_active", "is_staff", "created_at")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("phone",)
    ordering = ("-created_at",)

    # Override BaseUserAdmin fieldsets — remove username/email/first_name/last_name
    fieldsets = (
        (None, {"fields": ("phone", "role")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Dates", {"fields": ("created_at", "last_login")}),
    )
    readonly_fields = ("created_at",)
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("phone", "role", "is_active"),
            },
        ),
    )
    # No password field — OTP auth; superuser uses set_password via shell
    filter_horizontal = ("groups", "user_permissions")


@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "gender", "created_at")
    search_fields = ("user__phone",)
    readonly_fields = ("created_at",)


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "specialty", "clinic_city", "account_status", "created_at")
    list_filter = ("account_status", "specialty", "clinic_city")
    search_fields = ("full_name", "mci_number", "user__phone")
    readonly_fields = ("created_at", "approved_at")
