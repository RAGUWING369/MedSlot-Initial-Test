"""
Integration tests for Auth API endpoints.

Covers:
    POST /api/v1/auth/otp/request/     — OTPRequestView
    POST /api/v1/auth/otp/verify/      — OTPVerifyView
    POST /api/v1/patient/profile/      — PatientProfileView (create)
    GET  /api/v1/patient/profile/      — PatientProfileView (retrieve)

All tests use APIClient via pytest-django.
OTPService and MSG91Adapter are mocked — no live Redis or SMS dependency.
AuthService.issue_jwt is exercised against a real DB user (JWT tokens are
issued deterministically from a known user).

PHI policy: no phone numbers, names, DOBs, or emails appear in log output.
"""

from datetime import date
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from accounts.enums import OTPResult
from accounts.models import (
    CustomUser,
    DoctorAccountStatus,
    DoctorProfile,
    PatientProfile,
    Specialty,
    UserRole,
)
from accounts.services import AuthService

# ── Test data constants ────────────────────────────────────────────────────────

VALID_PHONE = "+919876542001"
VALID_PHONE_2 = "+919876542002"
VALID_OTP = "123456"
INVALID_OTP = "000000"


# ── Shared fixtures ────────────────────────────────────────────────────────────


@pytest.fixture
def api_client():
    """Return a fresh APIClient for each test."""
    return APIClient()


@pytest.fixture
def patient_user(db):
    """Create a patient CustomUser (no PatientProfile attached)."""
    return CustomUser.objects.create_user(
        phone=VALID_PHONE,
        role=UserRole.PATIENT,
    )


@pytest.fixture
def patient_user_with_profile(db):
    """Create a patient CustomUser with a complete PatientProfile."""
    user = CustomUser.objects.create_user(
        phone=VALID_PHONE_2,
        role=UserRole.PATIENT,
    )
    PatientProfile.objects.create(
        user=user,
        full_name="Test Patient",
        date_of_birth=date(1990, 1, 1),
        gender="male",
        email="test@example.com",
    )
    return user


@pytest.fixture
def patient_token(patient_user):
    """JWT token for the patient user (no profile)."""
    return AuthService.issue_jwt(patient_user)


@pytest.fixture
def patient_token_with_profile(patient_user_with_profile):
    """JWT token for the patient user with profile."""
    return AuthService.issue_jwt(patient_user_with_profile)


@pytest.fixture
def auth_client(api_client, patient_token):
    """APIClient pre-authenticated as a patient without a profile."""
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {patient_token}")
    return api_client


@pytest.fixture
def auth_client_with_profile(api_client, patient_token_with_profile):
    """APIClient pre-authenticated as a patient with an existing profile."""
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {patient_token_with_profile}")
    return api_client


@pytest.fixture
def doctor_user(db):
    """Create a doctor CustomUser in pending state."""
    user = CustomUser.objects.create_user(
        phone="+919876542003",
        role=UserRole.DOCTOR,
    )
    specialty = Specialty.objects.first()
    DoctorProfile.objects.create(
        user=user,
        full_name="Dr. Test",
        specialty=specialty,
        mci_number="MCI123",
        clinic_name="Test Clinic",
        clinic_area="Test Area",
        clinic_city="Bengaluru",
        account_status=DoctorAccountStatus.PENDING,
    )
    return user


@pytest.fixture
def approved_doctor_user(db):
    """Create an approved doctor CustomUser."""
    user = CustomUser.objects.create_user(
        phone="+919876542004",
        role=UserRole.DOCTOR,
    )
    specialty = Specialty.objects.first()
    DoctorProfile.objects.create(
        user=user,
        full_name="Dr. Approved",
        specialty=specialty,
        mci_number="MCI456",
        clinic_name="Approved Clinic",
        clinic_area="Test Area",
        clinic_city="Hyderabad",
        account_status=DoctorAccountStatus.APPROVED,
    )
    return user


@pytest.fixture
def doctor_token(doctor_user):
    """JWT token for a pending doctor user."""
    return AuthService.issue_jwt(doctor_user)


@pytest.fixture
def doctor_auth_client(api_client, doctor_token):
    """APIClient pre-authenticated as a pending doctor."""
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {doctor_token}")
    return api_client


# ── OTPRequestView tests ───────────────────────────────────────────────────────


@pytest.mark.django_db
class TestOTPRequestView:
    """Integration tests for POST /api/v1/auth/otp/request/."""

    URL = "/api/v1/auth/otp/request/"

    @patch("accounts.views.MSG91Adapter.send_otp", return_value=True)
    @patch("accounts.views.OTPService.generate_otp", return_value=VALID_OTP)
    @patch("accounts.views.OTPService.check_rate_limit", return_value=False)
    @patch("accounts.views.OTPService.is_locked", return_value=False)
    def test_valid_patient_request_returns_200(
        self, mock_locked, mock_rate, mock_gen, mock_sms, api_client
    ):
        """Valid phone + patient role returns 200 with success message."""
        response = api_client.post(
            self.URL, {"phone": VALID_PHONE, "role": UserRole.PATIENT}, format="json"
        )
        assert response.status_code == 200
        assert response.data["message"] == "OTP sent successfully."
        mock_gen.assert_called_once_with(VALID_PHONE)
        mock_sms.assert_called_once_with(VALID_PHONE, VALID_OTP)

    @patch("accounts.views.MSG91Adapter.send_otp", return_value=True)
    @patch("accounts.views.OTPService.generate_otp", return_value=VALID_OTP)
    @patch("accounts.views.OTPService.check_rate_limit", return_value=False)
    @patch("accounts.views.OTPService.is_locked", return_value=False)
    def test_valid_doctor_request_returns_200(
        self, mock_locked, mock_rate, mock_gen, mock_sms, api_client
    ):
        """Valid phone + doctor role returns 200 with success message."""
        response = api_client.post(
            self.URL, {"phone": VALID_PHONE, "role": UserRole.DOCTOR}, format="json"
        )
        assert response.status_code == 200
        assert "message" in response.data

    @patch("accounts.views.OTPService.is_locked", return_value=False)
    def test_invalid_phone_format_returns_400(self, mock_locked, api_client):
        """Non-Indian phone format returns 400 with field-level error."""
        response = api_client.post(
            self.URL, {"phone": "123", "role": UserRole.PATIENT}, format="json"
        )
        assert response.status_code == 400
        assert "phone" in response.data

    @patch("accounts.views.OTPService.is_locked", return_value=False)
    def test_invalid_role_returns_400(self, mock_locked, api_client):
        """Invalid role value returns 400 with field-level error."""
        response = api_client.post(
            self.URL, {"phone": VALID_PHONE, "role": "admin"}, format="json"
        )
        assert response.status_code == 400
        assert "role" in response.data

    @patch("accounts.views.OTPService.is_locked", return_value=False)
    @patch("accounts.views.OTPService.check_rate_limit", return_value=True)
    def test_rate_limited_phone_returns_429(self, mock_rate, mock_locked, api_client):
        """Phone exceeding request rate limit returns 429."""
        response = api_client.post(
            self.URL, {"phone": VALID_PHONE, "role": UserRole.PATIENT}, format="json"
        )
        assert response.status_code == 429
        assert "error" in response.data

    @patch("accounts.views.OTPService.is_locked", return_value=True)
    def test_locked_phone_returns_429(self, mock_locked, api_client):
        """Locked phone (too many failures) returns 429."""
        response = api_client.post(
            self.URL, {"phone": VALID_PHONE, "role": UserRole.PATIENT}, format="json"
        )
        assert response.status_code == 429
        assert "error" in response.data

    def test_missing_phone_returns_400(self, api_client):
        """Missing phone field returns 400 with field-level error."""
        response = api_client.post(self.URL, {"role": UserRole.PATIENT}, format="json")
        assert response.status_code == 400
        assert "phone" in response.data

    def test_missing_role_returns_400(self, api_client):
        """Missing role field returns 400 with field-level error."""
        response = api_client.post(self.URL, {"phone": VALID_PHONE}, format="json")
        assert response.status_code == 400
        assert "role" in response.data

    @patch("accounts.views.MSG91Adapter.send_otp", return_value=True)
    @patch("accounts.views.OTPService.generate_otp", return_value=VALID_OTP)
    @patch("accounts.views.OTPService.check_rate_limit", return_value=False)
    @patch("accounts.views.OTPService.is_locked", return_value=False)
    def test_phone_normalised_to_e164(
        self, mock_locked, mock_rate, mock_gen, mock_sms, api_client
    ):
        """10-digit local format is normalised to E.164 before OTP generation."""
        local_phone = "9876542001"
        response = api_client.post(
            self.URL, {"phone": local_phone, "role": UserRole.PATIENT}, format="json"
        )
        assert response.status_code == 200
        mock_gen.assert_called_once_with("+919876542001")

    @patch("accounts.views.MSG91Adapter.send_otp", return_value=False)
    @patch("accounts.views.OTPService.generate_otp", return_value=VALID_OTP)
    @patch("accounts.views.OTPService.check_rate_limit", return_value=False)
    @patch("accounts.views.OTPService.is_locked", return_value=False)
    def test_sms_delivery_failure_still_returns_200(
        self, mock_locked, mock_rate, mock_gen, mock_sms, api_client
    ):
        """SMS delivery failure does not expose error to client (prevents probing)."""
        response = api_client.post(
            self.URL, {"phone": VALID_PHONE, "role": UserRole.PATIENT}, format="json"
        )
        # Delivery failure is logged but not returned to the client
        assert response.status_code == 200
        assert "message" in response.data


# ── OTPVerifyView tests ────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestOTPVerifyView:
    """Integration tests for POST /api/v1/auth/otp/verify/."""

    URL = "/api/v1/auth/otp/verify/"

    @patch("accounts.views.OTPService.verify_otp", return_value=OTPResult.VALID)
    def test_valid_otp_new_patient_returns_is_new_user_true(
        self, mock_verify, api_client
    ):
        """Valid OTP for a new user (no PatientProfile) returns is_new_user=True."""
        response = api_client.post(
            self.URL, {"phone": VALID_PHONE, "otp_code": VALID_OTP}, format="json"
        )
        assert response.status_code == 200
        assert "token" in response.data
        assert response.data["is_new_user"] is True
        # Verify user was created in DB
        assert CustomUser.objects.filter(phone=VALID_PHONE).exists()

    @patch("accounts.views.OTPService.verify_otp", return_value=OTPResult.VALID)
    def test_valid_otp_existing_patient_with_profile_returns_is_new_user_false(
        self, mock_verify, api_client, patient_user_with_profile
    ):
        """Valid OTP for existing patient with profile returns is_new_user=False."""
        response = api_client.post(
            self.URL,
            {"phone": patient_user_with_profile.phone, "otp_code": VALID_OTP},
            format="json",
        )
        assert response.status_code == 200
        assert "token" in response.data
        assert response.data["is_new_user"] is False

    @patch("accounts.views.OTPService.verify_otp", return_value=OTPResult.VALID)
    def test_valid_otp_existing_patient_without_profile_returns_is_new_user_true(
        self, mock_verify, api_client, patient_user
    ):
        """Valid OTP for existing patient without profile returns is_new_user=True."""
        response = api_client.post(
            self.URL,
            {"phone": patient_user.phone, "otp_code": VALID_OTP},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["is_new_user"] is True

    @patch("accounts.views.OTPService.verify_otp", return_value=OTPResult.INVALID)
    def test_invalid_otp_returns_400(self, mock_verify, api_client):
        """Invalid OTP returns 400 with error message."""
        response = api_client.post(
            self.URL, {"phone": VALID_PHONE, "otp_code": INVALID_OTP}, format="json"
        )
        assert response.status_code == 400
        assert "error" in response.data

    @patch("accounts.views.OTPService.verify_otp", return_value=OTPResult.EXPIRED)
    def test_expired_otp_returns_400(self, mock_verify, api_client):
        """Expired OTP returns 400 with error message."""
        response = api_client.post(
            self.URL, {"phone": VALID_PHONE, "otp_code": VALID_OTP}, format="json"
        )
        assert response.status_code == 400
        assert "error" in response.data

    @patch("accounts.views.OTPService.verify_otp", return_value=OTPResult.LOCKED)
    def test_locked_account_returns_403(self, mock_verify, api_client):
        """Locked account after too many failures returns 403."""
        response = api_client.post(
            self.URL, {"phone": VALID_PHONE, "otp_code": VALID_OTP}, format="json"
        )
        assert response.status_code == 403
        assert "error" in response.data

    @patch("accounts.views.OTPService.verify_otp", return_value=OTPResult.RATE_LIMITED)
    def test_rate_limited_returns_429(self, mock_verify, api_client):
        """Rate-limited verification attempt returns 429."""
        response = api_client.post(
            self.URL, {"phone": VALID_PHONE, "otp_code": VALID_OTP}, format="json"
        )
        assert response.status_code == 429
        assert "error" in response.data

    @patch("accounts.views.OTPService.verify_otp", return_value=OTPResult.VALID)
    def test_pending_doctor_returns_403(self, mock_verify, api_client, doctor_user):
        """Pending doctor OTP verification returns 403 with approval message."""
        response = api_client.post(
            self.URL,
            {"phone": doctor_user.phone, "otp_code": VALID_OTP},
            format="json",
        )
        assert response.status_code == 403
        assert "error" in response.data
        # Confirm message references approval status
        error_text = response.data["error"].lower()
        assert "pending" in error_text or "approved" in error_text

    @patch("accounts.views.OTPService.verify_otp", return_value=OTPResult.VALID)
    def test_approved_doctor_receives_jwt(
        self, mock_verify, api_client, approved_doctor_user
    ):
        """Approved doctor OTP verification returns 200 with JWT token."""
        response = api_client.post(
            self.URL,
            {"phone": approved_doctor_user.phone, "otp_code": VALID_OTP},
            format="json",
        )
        assert response.status_code == 200
        assert "token" in response.data

    def test_invalid_phone_format_returns_400(self, api_client):
        """Invalid phone format in verify request returns 400 with field-level error."""
        response = api_client.post(
            self.URL, {"phone": "12345", "otp_code": VALID_OTP}, format="json"
        )
        assert response.status_code == 400
        assert "phone" in response.data

    def test_non_digit_otp_returns_400(self, api_client):
        """Non-numeric OTP returns 400 with field-level error."""
        response = api_client.post(
            self.URL, {"phone": VALID_PHONE, "otp_code": "abc123"}, format="json"
        )
        assert response.status_code == 400
        assert "otp_code" in response.data

    def test_otp_too_short_returns_400(self, api_client):
        """OTP shorter than 6 digits returns 400 with field-level error."""
        response = api_client.post(
            self.URL, {"phone": VALID_PHONE, "otp_code": "123"}, format="json"
        )
        assert response.status_code == 400
        assert "otp_code" in response.data

    def test_missing_otp_returns_400(self, api_client):
        """Missing otp_code field returns 400 with field-level error."""
        response = api_client.post(self.URL, {"phone": VALID_PHONE}, format="json")
        assert response.status_code == 400
        assert "otp_code" in response.data


# ── PatientProfileView POST tests ──────────────────────────────────────────────


@pytest.mark.django_db
class TestPatientProfileViewPost:
    """Integration tests for POST /api/v1/patient/profile/."""

    URL = "/api/v1/patient/profile/"

    VALID_PROFILE_DATA = {
        "full_name": "Priya Sharma",
        "date_of_birth": "1990-03-15",
        "gender": "female",
        "email": "priya@example.com",
    }

    def test_valid_data_authenticated_patient_returns_201(self, auth_client):
        """Valid profile data from authenticated patient returns 201 Created."""
        response = auth_client.post(self.URL, self.VALID_PROFILE_DATA, format="json")
        assert response.status_code == 201
        assert "id" in response.data
        assert response.data["full_name"] == "Priya Sharma"
        assert response.data["email"] == "priya@example.com"

    def test_profile_persisted_in_database(self, auth_client, patient_user):
        """Profile creation stores the record in the database correctly."""
        auth_client.post(self.URL, self.VALID_PROFILE_DATA, format="json")
        assert PatientProfile.objects.filter(user=patient_user).exists()
        profile = PatientProfile.objects.get(user=patient_user)
        assert profile.full_name == "Priya Sharma"

    def test_duplicate_profile_returns_409(self, auth_client_with_profile):
        """Second POST when profile already exists returns 409 Conflict."""
        response = auth_client_with_profile.post(
            self.URL, self.VALID_PROFILE_DATA, format="json"
        )
        assert response.status_code == 409
        assert "error" in response.data

    def test_future_date_of_birth_returns_400(self, auth_client):
        """Date of birth in the future returns 400 with field-level error."""
        data = {**self.VALID_PROFILE_DATA, "date_of_birth": "2099-01-01"}
        response = auth_client.post(self.URL, data, format="json")
        assert response.status_code == 400
        assert "date_of_birth" in response.data

    def test_today_date_of_birth_returns_400(self, auth_client):
        """Date of birth equal to today returns 400 — must be in the past."""
        from datetime import date

        data = {**self.VALID_PROFILE_DATA, "date_of_birth": date.today().isoformat()}
        response = auth_client.post(self.URL, data, format="json")
        assert response.status_code == 400
        assert "date_of_birth" in response.data

    def test_special_chars_in_name_returns_400(self, auth_client):
        """Name with forbidden special characters returns 400 with field-level error."""
        data = {**self.VALID_PROFILE_DATA, "full_name": "Test@123!"}
        response = auth_client.post(self.URL, data, format="json")
        assert response.status_code == 400
        assert "full_name" in response.data

    def test_single_char_name_returns_400(self, auth_client):
        """Name shorter than 2 characters returns 400."""
        data = {**self.VALID_PROFILE_DATA, "full_name": "A"}
        response = auth_client.post(self.URL, data, format="json")
        assert response.status_code == 400
        assert "full_name" in response.data

    def test_invalid_email_returns_400(self, auth_client):
        """Invalid email format returns 400 with field-level error."""
        data = {**self.VALID_PROFILE_DATA, "email": "not-an-email"}
        response = auth_client.post(self.URL, data, format="json")
        assert response.status_code == 400
        assert "email" in response.data

    def test_invalid_gender_returns_400(self, auth_client):
        """Invalid gender value returns 400 with field-level error."""
        data = {**self.VALID_PROFILE_DATA, "gender": "unknown"}
        response = auth_client.post(self.URL, data, format="json")
        assert response.status_code == 400
        assert "gender" in response.data

    def test_unauthenticated_request_returns_401(self, api_client):
        """Request without JWT returns 401 Unauthorized."""
        response = api_client.post(self.URL, self.VALID_PROFILE_DATA, format="json")
        assert response.status_code == 401

    def test_doctor_jwt_returns_403(self, doctor_auth_client):
        """Doctor JWT on patient endpoint returns 403 Forbidden."""
        response = doctor_auth_client.post(
            self.URL, self.VALID_PROFILE_DATA, format="json"
        )
        assert response.status_code == 403

    def test_user_fk_injected_from_request_not_input(self, auth_client, patient_user):
        """user field in request body is ignored — only request.user is used."""
        # Even if a malicious client passes a different user_id, the profile is
        # created for the authenticated user, not the supplied user.
        data = {**self.VALID_PROFILE_DATA, "user": str(patient_user.id)}
        response = auth_client.post(self.URL, data, format="json")
        assert response.status_code == 201
        profile = PatientProfile.objects.get(user=patient_user)
        assert str(profile.user_id) == str(patient_user.id)


# ── PatientProfileView GET tests ───────────────────────────────────────────────


@pytest.mark.django_db
class TestPatientProfileViewGet:
    """Integration tests for GET /api/v1/patient/profile/."""

    URL = "/api/v1/patient/profile/"

    def test_authenticated_patient_with_profile_returns_200(
        self, auth_client_with_profile
    ):
        """Authenticated patient with a profile receives 200 with profile data."""
        response = auth_client_with_profile.get(self.URL)
        assert response.status_code == 200
        assert "id" in response.data
        assert "full_name" in response.data
        assert "date_of_birth" in response.data
        assert "email" in response.data

    def test_profile_data_is_correct(
        self, auth_client_with_profile, patient_user_with_profile
    ):
        """Returned profile data matches the database record."""
        response = auth_client_with_profile.get(self.URL)
        profile = PatientProfile.objects.get(user=patient_user_with_profile)
        assert response.data["full_name"] == profile.full_name
        assert str(response.data["id"]) == str(profile.id)

    def test_patient_without_profile_returns_404(self, auth_client):
        """Authenticated patient with no profile yet receives 404."""
        response = auth_client.get(self.URL)
        assert response.status_code == 404
        assert "error" in response.data

    def test_unauthenticated_request_returns_401(self, api_client):
        """Request without JWT returns 401 Unauthorized."""
        response = api_client.get(self.URL)
        assert response.status_code == 401

    def test_doctor_jwt_returns_403(self, doctor_auth_client):
        """Doctor JWT on patient profile GET returns 403 Forbidden."""
        response = doctor_auth_client.get(self.URL)
        assert response.status_code == 403

    def test_response_does_not_expose_phone(self, auth_client_with_profile):
        """GET response must not include the phone number (PHI separation)."""
        response = auth_client_with_profile.get(self.URL)
        # Phone is on CustomUser, not PatientProfile serializer fields
        assert "phone" not in response.data


# ── Phone validation serializer tests ─────────────────────────────────────────


class TestOTPRequestSerializerValidation:
    """Unit tests for phone number normalisation in OTPRequestSerializer."""

    def _validate(self, phone: str):
        from accounts.serializers import validate_indian_phone

        return validate_indian_phone(phone)

    def test_e164_format_accepted(self):
        """E.164 +91 number is accepted and returned unchanged."""
        assert self._validate("+919876543210") == "+919876543210"

    def test_91_prefix_normalised(self):
        """Number with 91 prefix (no +) is normalised to E.164."""
        assert self._validate("919876543210") == "+919876543210"

    def test_10_digit_normalised(self):
        """10-digit local format is normalised to E.164."""
        assert self._validate("9876543210") == "+919876543210"

    def test_number_starting_with_5_rejected(self):
        """Indian mobile numbers must start with 6–9; 5 is invalid."""
        from rest_framework import serializers

        with pytest.raises(serializers.ValidationError):
            self._validate("5876543210")

    def test_too_short_rejected(self):
        """Number shorter than 10 digits is rejected."""
        from rest_framework import serializers

        with pytest.raises(serializers.ValidationError):
            self._validate("+91987654")

    def test_non_numeric_rejected(self):
        """Non-numeric characters (beyond + and country code) are rejected."""
        from rest_framework import serializers

        with pytest.raises(serializers.ValidationError):
            self._validate("+91abcdefghij")
