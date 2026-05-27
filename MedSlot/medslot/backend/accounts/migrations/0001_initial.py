"""
Initial migration for the accounts app.

Creates four tables:
  - accounts_user        (CustomUser — phone-based, UUID PK)
  - accounts_specialty   (Specialty — fixed 13-item taxonomy)
  - accounts_patient_profile  (PatientProfile — extends CustomUser)
  - accounts_doctor_profile   (DoctorProfile — extends CustomUser)

Depends on auth app initial migration for AbstractBaseUser + PermissionsMixin
group/permission M2M tables.
"""
import uuid

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models

import accounts.managers


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("auth", "0001_initial"),
    ]

    operations = [
        # ── accounts_user ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name="CustomUser",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text="UUID primary key — avoids sequential ID enumeration.",
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                (
                    "last_login",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="last login"
                    ),
                ),
                (
                    "is_superuser",
                    models.BooleanField(
                        default=False,
                        help_text=(
                            "Designates that this user has all permissions without "
                            "explicitly assigning them."
                        ),
                        verbose_name="superuser status",
                    ),
                ),
                (
                    "phone",
                    models.CharField(
                        db_index=True,
                        help_text="Indian mobile number in E.164 format, e.g. +919876543210.",
                        max_length=15,
                        unique=True,
                    ),
                ),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("patient", "Patient"),
                            ("doctor", "Doctor"),
                            ("admin", "Admin"),
                        ],
                        db_index=True,
                        default="patient",
                        help_text="Determines which profile type and permission class applies.",
                        max_length=10,
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text="Inactive users cannot log in. Set to False instead of deleting.",
                    ),
                ),
                (
                    "is_staff",
                    models.BooleanField(
                        default=False,
                        help_text="Grants Django admin panel access. Only for admin role users.",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        default=django.utils.timezone.now, editable=False
                    ),
                ),
                (
                    "groups",
                    models.ManyToManyField(
                        blank=True,
                        help_text=(
                            "The groups this user belongs to. A user will get all permissions "
                            "granted to each of their groups."
                        ),
                        related_name="+",
                        to="auth.group",
                        verbose_name="groups",
                    ),
                ),
                (
                    "user_permissions",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Specific permissions for this user.",
                        related_name="+",
                        to="auth.permission",
                        verbose_name="user permissions",
                    ),
                ),
            ],
            options={
                "verbose_name": "User",
                "verbose_name_plural": "Users",
                "db_table": "accounts_user",
                "ordering": ["-created_at"],
            },
            managers=[
                ("objects", accounts.managers.CustomUserManager()),
            ],
        ),
        # ── accounts_specialty ─────────────────────────────────────────────────
        migrations.CreateModel(
            name="Specialty",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("name", models.CharField(max_length=100, unique=True)),
                ("slug", models.SlugField(max_length=100, unique=True)),
            ],
            options={
                "verbose_name": "Specialty",
                "verbose_name_plural": "Specialties",
                "db_table": "accounts_specialty",
                "ordering": ["name"],
            },
        ),
        # ── accounts_patient_profile ───────────────────────────────────────────
        migrations.CreateModel(
            name="PatientProfile",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        limit_choices_to={"role": "patient"},
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="patient_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ("full_name", models.CharField(max_length=255)),
                ("date_of_birth", models.DateField()),
                (
                    "gender",
                    models.CharField(
                        choices=[
                            ("male", "Male"),
                            ("female", "Female"),
                            ("other", "Other"),
                        ],
                        max_length=10,
                    ),
                ),
                ("email", models.EmailField(max_length=254)),
                (
                    "created_at",
                    models.DateTimeField(
                        default=django.utils.timezone.now, editable=False
                    ),
                ),
            ],
            options={
                "verbose_name": "Patient Profile",
                "verbose_name_plural": "Patient Profiles",
                "db_table": "accounts_patient_profile",
            },
        ),
        # ── accounts_doctor_profile ────────────────────────────────────────────
        migrations.CreateModel(
            name="DoctorProfile",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        limit_choices_to={"role": "doctor"},
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="doctor_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ("full_name", models.CharField(max_length=255)),
                (
                    "specialty",
                    models.ForeignKey(
                        help_text="Must be one of the 13 seeded specialties.",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="doctors",
                        to="accounts.specialty",
                    ),
                ),
                (
                    "mci_number",
                    models.CharField(
                        db_index=True,
                        help_text="Medical Council of India registration number.",
                        max_length=50,
                    ),
                ),
                ("clinic_name", models.CharField(max_length=255)),
                ("clinic_area", models.CharField(max_length=255)),
                ("clinic_city", models.CharField(db_index=True, max_length=100)),
                (
                    "credential_document_s3_key",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text="S3 key of uploaded credential document (PDF/JPEG).",
                        max_length=500,
                    ),
                ),
                (
                    "account_status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending Review"),
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                            ("suspended", "Suspended"),
                        ],
                        db_index=True,
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("approved_at", models.DateTimeField(blank=True, null=True)),
                (
                    "created_at",
                    models.DateTimeField(
                        default=django.utils.timezone.now, editable=False
                    ),
                ),
            ],
            options={
                "verbose_name": "Doctor Profile",
                "verbose_name_plural": "Doctor Profiles",
                "db_table": "accounts_doctor_profile",
            },
        ),
    ]
