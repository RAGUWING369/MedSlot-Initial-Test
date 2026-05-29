"""
Account models for MedSlot.

Implements phone-based OTP authentication via a custom AbstractBaseUser.
Two profile types extend the base user: PatientProfile and DoctorProfile.

PHI Policy: Fields marked '# PHI' contain personally identifiable health
information. These fields must never appear in application logs.
See SECURITY-ARCHITECTURE.md § PHI handling.
"""
import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import CustomUserManager


class UserRole(models.TextChoices):
    """Valid roles for CustomUser. Determines API permissions and dashboard routing."""

    PATIENT = "patient", "Patient"
    DOCTOR = "doctor", "Doctor"
    ADMIN = "admin", "Admin"


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    MedSlot's primary user model. Replaces Django's default User.

    Authentication is phone + OTP — no password for patients/doctors.
    USERNAME_FIELD = 'phone' enables DRF JWT to look up users by phone.

    One CustomUser has exactly one profile: PatientProfile or DoctorProfile,
    determined by the role field.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="UUID primary key — avoids sequential ID enumeration.",
    )
    phone = models.CharField(
        max_length=15,
        unique=True,
        db_index=True,
        help_text="Indian mobile number in E.164 format, e.g. +919876543210.",
    )
    role = models.CharField(
        max_length=10,
        choices=UserRole.choices,
        default=UserRole.PATIENT,
        db_index=True,
        help_text="Determines which profile type and permission class applies.",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive users cannot log in. Set to False instead of deleting.",
    )
    is_staff = models.BooleanField(
        default=False,
        help_text="Grants Django admin panel access. Only for admin role users.",
    )
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = []  # phone is already the username field

    class Meta:
        db_table = "accounts_user"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.phone} ({self.role})"

    @property
    def is_patient(self) -> bool:
        """True if this user is a patient."""
        return self.role == UserRole.PATIENT

    @property
    def is_doctor(self) -> bool:
        """True if this user is a doctor."""
        return self.role == UserRole.DOCTOR

    @property
    def is_admin_user(self) -> bool:
        """True if this user is a platform admin."""
        return self.role == UserRole.ADMIN


class Specialty(models.Model):
    """
    Medical specialty taxonomy — fixed list of 13 specialties.

    Per BR (confirmed Phase 2): specialty is a fixed 13-item list managed
    as a database seed. Free-text specialty entry is not permitted.
    Seeded by migration 0002_seed_specialties.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        db_table = "accounts_specialty"
        verbose_name = "Specialty"
        verbose_name_plural = "Specialties"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class PatientProfile(models.Model):
    """
    Extended profile for patient users.

    All fields except user FK are PHI — must never appear in logs.
    Created via POST /api/v1/patient/profile/ after first OTP login.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="patient_profile",
        limit_choices_to={"role": UserRole.PATIENT},
    )
    full_name = models.CharField(max_length=255)  # PHI
    date_of_birth = models.DateField()  # PHI
    gender = models.CharField(
        max_length=10,
        choices=[("male", "Male"), ("female", "Female"), ("other", "Other")],
    )
    email = models.EmailField(max_length=254)  # PHI
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        db_table = "accounts_patient_profile"
        verbose_name = "Patient Profile"
        verbose_name_plural = "Patient Profiles"

    def __str__(self) -> str:
        # PHI — not logged; safe to display in admin only
        return f"PatientProfile({self.user_id})"


class DoctorAccountStatus(models.TextChoices):
    """Approval lifecycle for doctor accounts. Immutable once Approved."""

    PENDING = "pending", "Pending Review"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"
    SUSPENDED = "suspended", "Suspended"


class DoctorProfile(models.Model):
    """
    Extended profile for doctor users.

    Doctors must be manually approved by an admin before going live.
    account_status drives the IsApprovedDoctor permission check.

    PHI fields: mci_number, credential_document_s3_key
    (contains identity document reference).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="doctor_profile",
        limit_choices_to={"role": UserRole.DOCTOR},
    )
    full_name = models.CharField(max_length=255)
    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.PROTECT,
        related_name="doctors",
        help_text="Must be one of the 13 seeded specialties.",
    )
    mci_number = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Medical Council of India registration number.",  # PHI
    )
    clinic_name = models.CharField(max_length=255)
    clinic_area = models.CharField(max_length=255)
    clinic_city = models.CharField(max_length=100, db_index=True)
    credential_document_s3_key = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="S3 key of uploaded credential document (PDF/JPEG).",  # PHI
    )
    account_status = models.CharField(
        max_length=20,
        choices=DoctorAccountStatus.choices,
        default=DoctorAccountStatus.PENDING,
        db_index=True,
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        db_table = "accounts_doctor_profile"
        verbose_name = "Doctor Profile"
        verbose_name_plural = "Doctor Profiles"

    def __str__(self) -> str:
        # PHI-SAFE: returns only the primary key — full_name and specialty are PHI
        # and must never appear in application logs via str(instance) interpolation.
        # Matches the pattern used by PatientProfile.__str__.
        return f"DoctorProfile(id={self.pk})"

    @property
    def is_approved(self) -> bool:
        """True if the doctor has been approved by an admin."""
        return self.account_status == DoctorAccountStatus.APPROVED
