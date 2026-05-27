"""
Unit tests for accounts models.

Tests cover model creation, field validation, property methods,
and manager behaviour. No PHI is logged in any test output.

Coverage target: >= 90% of accounts/models.py and accounts/managers.py
"""
import uuid

import pytest
from django.db import IntegrityError
from django.utils.text import slugify

from accounts.models import (
    CustomUser,
    DoctorAccountStatus,
    DoctorProfile,
    PatientProfile,
    Specialty,
    UserRole,
)


# ── CustomUser ─────────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestCustomUser:
    """Tests for CustomUser model and manager."""

    def test_create_patient_user(self) -> None:
        """create_user with role=patient creates an active patient user."""
        user = CustomUser.objects.create_user(phone="+919876543210", role="patient")
        assert user.phone == "+919876543210"
        assert user.role == UserRole.PATIENT
        assert user.is_active is True
        assert user.is_staff is False
        assert not user.has_usable_password()

    def test_create_doctor_user(self) -> None:
        """create_user with role=doctor creates an active doctor user."""
        user = CustomUser.objects.create_user(phone="+919876543211", role="doctor")
        assert user.role == UserRole.DOCTOR
        assert user.is_active is True

    def test_create_user_default_role_is_patient(self) -> None:
        """create_user defaults role to 'patient' when not specified."""
        user = CustomUser.objects.create_user(phone="+919876543299")
        assert user.role == UserRole.PATIENT

    def test_create_user_requires_phone(self) -> None:
        """create_user raises ValueError when phone is empty."""
        with pytest.raises(ValueError, match="Phone number is required"):
            CustomUser.objects.create_user(phone="")

    def test_uuid_primary_key(self) -> None:
        """CustomUser primary key is a UUID, not an integer."""
        user = CustomUser.objects.create_user(phone="+919876543212")
        assert isinstance(user.id, uuid.UUID)

    def test_phone_is_unique(self) -> None:
        """Duplicate phone raises IntegrityError."""
        CustomUser.objects.create_user(phone="+919876543213")
        with pytest.raises(IntegrityError):
            CustomUser.objects.create_user(phone="+919876543213")

    def test_is_patient_property_true_for_patient(self) -> None:
        """is_patient returns True only for patient role."""
        patient = CustomUser.objects.create_user(phone="+919876543214", role="patient")
        assert patient.is_patient is True

    def test_is_patient_property_false_for_doctor(self) -> None:
        """is_patient returns False for doctor role."""
        doctor = CustomUser.objects.create_user(phone="+919876543215", role="doctor")
        assert doctor.is_patient is False

    def test_is_doctor_property_true_for_doctor(self) -> None:
        """is_doctor returns True only for doctor role."""
        doctor = CustomUser.objects.create_user(phone="+919876543216", role="doctor")
        assert doctor.is_doctor is True

    def test_is_doctor_property_false_for_patient(self) -> None:
        """is_doctor returns False for patient role."""
        patient = CustomUser.objects.create_user(phone="+919876543298", role="patient")
        assert patient.is_doctor is False

    def test_is_admin_user_property(self) -> None:
        """is_admin_user returns True only for admin role."""
        admin = CustomUser.objects.create_user(phone="+919876543217", role="admin")
        assert admin.is_admin_user is True

    def test_is_admin_user_false_for_patient(self) -> None:
        """is_admin_user returns False for patient role."""
        patient = CustomUser.objects.create_user(phone="+919876543297", role="patient")
        assert patient.is_admin_user is False

    def test_str_representation(self) -> None:
        """__str__ returns phone and role."""
        user = CustomUser.objects.create_user(phone="+919876543218", role="patient")
        assert "+919876543218" in str(user)
        assert "patient" in str(user)

    def test_create_superuser(self) -> None:
        """create_superuser sets is_staff and is_superuser to True."""
        superuser = CustomUser.objects.create_superuser(
            phone="+919876543219", password="test_admin_pass"
        )
        assert superuser.is_staff is True
        assert superuser.is_superuser is True
        assert superuser.role == "admin"
        assert superuser.is_active is True

    def test_create_superuser_without_password(self) -> None:
        """create_superuser without password sets unusable password."""
        superuser = CustomUser.objects.create_superuser(phone="+919876543296")
        assert superuser.is_staff is True
        assert superuser.is_superuser is True
        assert not superuser.has_usable_password()

    def test_create_superuser_requires_is_staff_true(self) -> None:
        """create_superuser raises ValueError if is_staff=False."""
        with pytest.raises(ValueError, match="is_staff=True"):
            CustomUser.objects.create_superuser(
                phone="+919876543220", is_staff=False
            )

    def test_create_superuser_requires_is_superuser_true(self) -> None:
        """create_superuser raises ValueError if is_superuser=False."""
        with pytest.raises(ValueError, match="is_superuser=True"):
            CustomUser.objects.create_superuser(
                phone="+919876543221", is_superuser=False
            )

    def test_username_field_is_phone(self) -> None:
        """USERNAME_FIELD must be 'phone' for JWT lookup."""
        assert CustomUser.USERNAME_FIELD == "phone"

    def test_required_fields_is_empty(self) -> None:
        """REQUIRED_FIELDS must be empty — phone is the username field."""
        assert CustomUser.REQUIRED_FIELDS == []


# ── Specialty ──────────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestSpecialty:
    """Tests for Specialty model."""

    def test_specialty_creation(self) -> None:
        """Specialty can be created with name and slug."""
        specialty = Specialty.objects.create(
            name="Cardiologist",
            slug="cardiologist",
        )
        assert specialty.name == "Cardiologist"
        assert specialty.slug == "cardiologist"

    def test_specialty_uuid_pk(self) -> None:
        """Specialty primary key is a UUID."""
        specialty = Specialty.objects.create(name="Dermatologist", slug="dermatologist")
        assert isinstance(specialty.id, uuid.UUID)

    def test_specialty_str(self) -> None:
        """__str__ returns the specialty name."""
        specialty = Specialty.objects.create(name="Pediatrician", slug="pediatrician")
        assert str(specialty) == "Pediatrician"

    def test_specialty_name_unique(self) -> None:
        """Duplicate specialty name raises IntegrityError."""
        Specialty.objects.create(name="Neurologist", slug="neurologist")
        with pytest.raises(IntegrityError):
            Specialty.objects.create(name="Neurologist", slug="neurologist-2")

    def test_specialty_slug_unique(self) -> None:
        """Duplicate specialty slug raises IntegrityError."""
        Specialty.objects.create(name="Urologist", slug="urologist")
        with pytest.raises(IntegrityError):
            Specialty.objects.create(name="Urologist 2", slug="urologist")

    def test_seed_migration_creates_13_specialties(self) -> None:
        """After data migration, exactly 13 specialties exist."""
        # Seed migration 0002 runs automatically in test DB setup via --reuse-db
        assert Specialty.objects.count() == 13

    def test_seeded_specialty_slugs_valid(self) -> None:
        """All seeded specialties have non-empty slugs matching their name."""
        for specialty in Specialty.objects.all():
            assert specialty.slug != ""
            assert specialty.slug == slugify(specialty.name)


# ── PatientProfile ─────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestPatientProfile:
    """Tests for PatientProfile model."""

    @pytest.fixture
    def patient_user(self) -> CustomUser:
        return CustomUser.objects.create_user(phone="+919876540001", role="patient")

    def test_patient_profile_creation(self, patient_user: CustomUser) -> None:
        """PatientProfile can be created and linked to a patient user."""
        profile = PatientProfile.objects.create(
            user=patient_user,
            full_name="Test Patient",  # PHI — test data only
            date_of_birth="1990-01-01",  # PHI — test data only
            gender="male",
            email="test@example.com",  # PHI — test data only
        )
        assert profile.user == patient_user
        assert profile.gender == "male"

    def test_patient_profile_uuid_pk(self, patient_user: CustomUser) -> None:
        """PatientProfile primary key is a UUID."""
        profile = PatientProfile.objects.create(
            user=patient_user,
            full_name="UUID Test",  # PHI
            date_of_birth="1990-01-01",  # PHI
            gender="female",
            email="uuid@example.com",  # PHI
        )
        assert isinstance(profile.id, uuid.UUID)

    def test_one_to_one_constraint(self, patient_user: CustomUser) -> None:
        """Cannot create two profiles for the same user."""
        PatientProfile.objects.create(
            user=patient_user,
            full_name="Test",  # PHI
            date_of_birth="1990-01-01",  # PHI
            gender="female",
            email="a@a.com",  # PHI
        )
        with pytest.raises(IntegrityError):
            PatientProfile.objects.create(
                user=patient_user,
                full_name="Duplicate",  # PHI
                date_of_birth="1991-01-01",  # PHI
                gender="female",
                email="b@b.com",  # PHI
            )

    def test_str_does_not_expose_phi(self, patient_user: CustomUser) -> None:
        """__str__ must not include PHI fields (name, DOB, email)."""
        profile = PatientProfile.objects.create(
            user=patient_user,
            full_name="John Doe",  # PHI
            date_of_birth="1990-01-01",  # PHI
            gender="male",
            email="john@example.com",  # PHI
        )
        str_repr = str(profile)
        assert "John Doe" not in str_repr  # PHI must not leak
        assert "john@example.com" not in str_repr  # PHI must not leak

    def test_reverse_relation_from_user(self, patient_user: CustomUser) -> None:
        """CustomUser.patient_profile reverse relation resolves correctly."""
        profile = PatientProfile.objects.create(
            user=patient_user,
            full_name="Reverse Test",  # PHI
            date_of_birth="1985-06-15",  # PHI
            gender="other",
            email="rev@example.com",  # PHI
        )
        assert patient_user.patient_profile == profile


# ── DoctorProfile ──────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestDoctorProfile:
    """Tests for DoctorProfile model."""

    @pytest.fixture
    def doctor_user(self) -> CustomUser:
        return CustomUser.objects.create_user(phone="+919876540002", role="doctor")

    @pytest.fixture
    def specialty(self) -> Specialty:
        specialty, _ = Specialty.objects.get_or_create(
            slug="general-physician",
            defaults={"name": "General Physician"},
        )
        return specialty

    def test_doctor_profile_default_status_pending(
        self, doctor_user: CustomUser, specialty: Specialty
    ) -> None:
        """New DoctorProfile defaults to pending status."""
        profile = DoctorProfile.objects.create(
            user=doctor_user,
            full_name="Dr. Test",
            specialty=specialty,
            mci_number="MH123456",  # PHI
            clinic_name="Test Clinic",
            clinic_area="Bandra",
            clinic_city="Mumbai",
        )
        assert profile.account_status == DoctorAccountStatus.PENDING
        assert profile.is_approved is False

    def test_doctor_profile_uuid_pk(
        self, doctor_user: CustomUser, specialty: Specialty
    ) -> None:
        """DoctorProfile primary key is a UUID."""
        profile = DoctorProfile.objects.create(
            user=doctor_user,
            full_name="Dr. UUID",
            specialty=specialty,
            mci_number="MH999001",  # PHI
            clinic_name="Clinic",
            clinic_area="Area",
            clinic_city="Mumbai",
        )
        assert isinstance(profile.id, uuid.UUID)

    def test_is_approved_property_false_for_pending(
        self, doctor_user: CustomUser, specialty: Specialty
    ) -> None:
        """is_approved returns False for pending status."""
        profile = DoctorProfile.objects.create(
            user=doctor_user,
            full_name="Dr. Pending",
            specialty=specialty,
            mci_number="MH123457",  # PHI
            clinic_name="Clinic",
            clinic_area="Juhu",
            clinic_city="Mumbai",
        )
        assert profile.is_approved is False

    def test_is_approved_property_true_when_approved(
        self, doctor_user: CustomUser, specialty: Specialty
    ) -> None:
        """is_approved returns True only when account_status is approved."""
        profile = DoctorProfile.objects.create(
            user=doctor_user,
            full_name="Dr. Approved",
            specialty=specialty,
            mci_number="MH123458",  # PHI
            clinic_name="Clinic",
            clinic_area="Juhu",
            clinic_city="Mumbai",
            account_status=DoctorAccountStatus.APPROVED,
        )
        assert profile.is_approved is True

    def test_specialty_protect_on_delete(
        self, doctor_user: CustomUser, specialty: Specialty
    ) -> None:
        """Deleting a Specialty raises ProtectedError if doctors reference it."""
        from django.db.models import ProtectedError

        DoctorProfile.objects.create(
            user=doctor_user,
            full_name="Dr. Protected",
            specialty=specialty,
            mci_number="MH123459",  # PHI
            clinic_name="Clinic",
            clinic_area="Area",
            clinic_city="Mumbai",
        )
        with pytest.raises(ProtectedError):
            specialty.delete()

    def test_str_representation(
        self, doctor_user: CustomUser, specialty: Specialty
    ) -> None:
        """__str__ returns doctor name and specialty."""
        profile = DoctorProfile.objects.create(
            user=doctor_user,
            full_name="Dr. Rajan Mehta",
            specialty=specialty,
            mci_number="MH123460",  # PHI
            clinic_name="Mehta Clinic",
            clinic_area="Andheri",
            clinic_city="Mumbai",
        )
        assert "Dr. Rajan Mehta" in str(profile)

    def test_credential_document_s3_key_defaults_empty(
        self, doctor_user: CustomUser, specialty: Specialty
    ) -> None:
        """credential_document_s3_key defaults to empty string."""
        profile = DoctorProfile.objects.create(
            user=doctor_user,
            full_name="Dr. NoCred",
            specialty=specialty,
            mci_number="MH123461",  # PHI
            clinic_name="Clinic",
            clinic_area="Area",
            clinic_city="Delhi",
        )
        assert profile.credential_document_s3_key == ""

    def test_one_to_one_constraint(
        self, doctor_user: CustomUser, specialty: Specialty
    ) -> None:
        """Cannot create two DoctorProfiles for the same user."""
        DoctorProfile.objects.create(
            user=doctor_user,
            full_name="Dr. First",
            specialty=specialty,
            mci_number="MH123462",  # PHI
            clinic_name="Clinic",
            clinic_area="Area",
            clinic_city="Mumbai",
        )
        with pytest.raises(IntegrityError):
            DoctorProfile.objects.create(
                user=doctor_user,
                full_name="Dr. Second",
                specialty=specialty,
                mci_number="MH123463",  # PHI
                clinic_name="Clinic",
                clinic_area="Area",
                clinic_city="Mumbai",
            )

    def test_reverse_relation_from_user(
        self, doctor_user: CustomUser, specialty: Specialty
    ) -> None:
        """CustomUser.doctor_profile reverse relation resolves correctly."""
        profile = DoctorProfile.objects.create(
            user=doctor_user,
            full_name="Dr. Reverse",
            specialty=specialty,
            mci_number="MH123464",  # PHI
            clinic_name="Clinic",
            clinic_area="Area",
            clinic_city="Chennai",
        )
        assert doctor_user.doctor_profile == profile

    def test_account_status_choices(self) -> None:
        """DoctorAccountStatus has all expected lifecycle choices."""
        choices = [c[0] for c in DoctorAccountStatus.choices]
        assert "pending" in choices
        assert "approved" in choices
        assert "rejected" in choices
        assert "suspended" in choices
