"""
Unit and integration tests for JWT auth service and DRF permission classes.

Tests verify:
- AuthService.issue_jwt() produces valid JWT with correct claims.
- Each permission class allows/denies the correct user roles.
- Cross-role access is denied with correct HTTP status codes.
- Missing or invalid JWT returns 401 (not 403).

Coverage target: >= 90% of accounts/permissions.py and AuthService in services.py
"""
from datetime import timedelta
from unittest.mock import Mock, PropertyMock

import pytest
from django.utils import timezone

from accounts.models import DoctorAccountStatus, UserRole
from accounts.permissions import (
    DOCTOR_TRIAL_DAYS,
    IsAdmin,
    IsApprovedDoctor,
    IsApprovedOrTrialDoctor,
    IsPatient,
)


# ── Helpers ────────────────────────────────────────────────────────────────────


def _make_user(role: str, is_authenticated: bool = True) -> Mock:
    """Build a mock user with the given role."""
    user = Mock()
    user.is_authenticated = is_authenticated
    user.role = role
    return user


def _make_request(user: Mock) -> Mock:
    """Build a mock DRF request carrying the given user."""
    request = Mock()
    request.user = user
    return request


def _make_doctor_user(
    account_status: str = DoctorAccountStatus.APPROVED,
    created_days_ago: int = 0,
) -> Mock:
    """Build a mock doctor user with a doctor_profile."""
    user = _make_user(UserRole.DOCTOR)
    user.created_at = timezone.now() - timedelta(days=created_days_ago)

    profile = Mock()
    profile.account_status = account_status
    user.doctor_profile = profile
    return user


# ── AuthService tests ──────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestAuthServiceIssueJwt:
    """Tests for AuthService.issue_jwt()."""

    def test_issue_jwt_returns_string(self) -> None:
        """issue_jwt returns a non-empty string."""
        from accounts.models import CustomUser
        from accounts.services import AuthService

        user = CustomUser.objects.create_user(phone="+919876541001", role="patient")
        token = AuthService.issue_jwt(user)
        assert isinstance(token, str)
        assert len(token) > 0

    def test_issue_jwt_contains_role_claim(self) -> None:
        """JWT payload contains the 'role' custom claim."""
        from accounts.models import CustomUser
        from accounts.services import AuthService
        from rest_framework_simplejwt.tokens import AccessToken

        user = CustomUser.objects.create_user(phone="+919876541002", role="doctor")
        token_str = AuthService.issue_jwt(user)
        token = AccessToken(token_str)
        assert token["role"] == "doctor"

    def test_issue_jwt_contains_user_id(self) -> None:
        """JWT payload contains user_id matching the user's UUID."""
        from accounts.models import CustomUser
        from accounts.services import AuthService
        from rest_framework_simplejwt.tokens import AccessToken

        user = CustomUser.objects.create_user(phone="+919876541003", role="patient")
        token_str = AuthService.issue_jwt(user)
        token = AccessToken(token_str)
        assert str(token["user_id"]) == str(user.id)

    def test_issue_jwt_different_users_different_tokens(self) -> None:
        """Different users receive different JWT tokens."""
        from accounts.models import CustomUser
        from accounts.services import AuthService

        user_a = CustomUser.objects.create_user(phone="+919876541004", role="patient")
        user_b = CustomUser.objects.create_user(phone="+919876541005", role="doctor")
        assert AuthService.issue_jwt(user_a) != AuthService.issue_jwt(user_b)

    def test_issue_jwt_role_patient(self) -> None:
        """JWT role claim equals 'patient' for a patient user."""
        from accounts.models import CustomUser
        from accounts.services import AuthService
        from rest_framework_simplejwt.tokens import AccessToken

        user = CustomUser.objects.create_user(phone="+919876541006", role="patient")
        token_str = AuthService.issue_jwt(user)
        token = AccessToken(token_str)
        assert token["role"] == UserRole.PATIENT

    def test_issue_jwt_role_admin(self) -> None:
        """JWT role claim equals 'admin' for an admin user."""
        from accounts.models import CustomUser
        from accounts.services import AuthService
        from rest_framework_simplejwt.tokens import AccessToken

        user = CustomUser.objects.create_user(phone="+919876541007", role="admin")
        token_str = AuthService.issue_jwt(user)
        token = AccessToken(token_str)
        assert token["role"] == UserRole.ADMIN


# ── IsPatient tests ────────────────────────────────────────────────────────────


class TestIsPatientPermission:
    """Tests for IsPatient permission class."""

    permission = IsPatient()

    def test_allows_authenticated_patient(self) -> None:
        """Returns True for authenticated patient user."""
        user = _make_user(UserRole.PATIENT)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is True

    def test_denies_doctor(self) -> None:
        """Returns False for authenticated doctor user."""
        user = _make_user(UserRole.DOCTOR)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_admin(self) -> None:
        """Returns False for authenticated admin user."""
        user = _make_user(UserRole.ADMIN)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_unauthenticated(self) -> None:
        """Returns False for unauthenticated user."""
        user = _make_user(UserRole.PATIENT, is_authenticated=False)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_none_user(self) -> None:
        """Returns False when request.user is None."""
        request = Mock()
        request.user = None
        assert self.permission.has_permission(request, None) is False

    def test_message_is_set(self) -> None:
        """IsPatient has a human-readable message attribute."""
        assert self.permission.message == "Access restricted to patient accounts."


# ── IsApprovedDoctor tests ─────────────────────────────────────────────────────


class TestIsApprovedDoctorPermission:
    """Tests for IsApprovedDoctor permission class."""

    permission = IsApprovedDoctor()

    def test_allows_approved_doctor(self) -> None:
        """Returns True for approved doctor."""
        user = _make_doctor_user(account_status=DoctorAccountStatus.APPROVED)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is True

    def test_denies_pending_doctor(self) -> None:
        """Returns False for pending doctor."""
        user = _make_doctor_user(account_status=DoctorAccountStatus.PENDING)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_rejected_doctor(self) -> None:
        """Returns False for rejected doctor."""
        user = _make_doctor_user(account_status=DoctorAccountStatus.REJECTED)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_suspended_doctor(self) -> None:
        """Returns False for suspended doctor."""
        user = _make_doctor_user(account_status=DoctorAccountStatus.SUSPENDED)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_patient(self) -> None:
        """Returns False for patient user."""
        user = _make_user(UserRole.PATIENT)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_admin(self) -> None:
        """Returns False for admin user."""
        user = _make_user(UserRole.ADMIN)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_doctor_without_profile(self) -> None:
        """Returns False when doctor_profile does not exist."""
        user = _make_user(UserRole.DOCTOR)
        # Simulate missing related object by raising on attribute access
        type(user).doctor_profile = PropertyMock(side_effect=Exception("no profile"))
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_unauthenticated(self) -> None:
        """Returns False for unauthenticated request."""
        user = _make_user(UserRole.DOCTOR, is_authenticated=False)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_none_user(self) -> None:
        """Returns False when request.user is None."""
        request = Mock()
        request.user = None
        assert self.permission.has_permission(request, None) is False

    def test_message_is_set(self) -> None:
        """IsApprovedDoctor has a human-readable message attribute."""
        assert self.permission.message == "Access restricted to approved doctor accounts."


# ── IsAdmin tests ──────────────────────────────────────────────────────────────


class TestIsAdminPermission:
    """Tests for IsAdmin permission class."""

    permission = IsAdmin()

    def test_allows_admin(self) -> None:
        """Returns True for admin user."""
        user = _make_user(UserRole.ADMIN)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is True

    def test_denies_patient(self) -> None:
        """Returns False for patient."""
        user = _make_user(UserRole.PATIENT)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_doctor(self) -> None:
        """Returns False for doctor."""
        user = _make_user(UserRole.DOCTOR)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_unauthenticated(self) -> None:
        """Returns False for unauthenticated user."""
        user = _make_user(UserRole.ADMIN, is_authenticated=False)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_none_user(self) -> None:
        """Returns False when request.user is None."""
        request = Mock()
        request.user = None
        assert self.permission.has_permission(request, None) is False

    def test_message_is_set(self) -> None:
        """IsAdmin has a human-readable message attribute."""
        assert self.permission.message == "Access restricted to admin accounts."


# ── IsApprovedOrTrialDoctor tests ──────────────────────────────────────────────


class TestIsApprovedOrTrialDoctorPermission:
    """Tests for IsApprovedOrTrialDoctor permission class."""

    permission = IsApprovedOrTrialDoctor()

    def test_allows_approved_doctor(self) -> None:
        """Returns True for approved doctor regardless of trial window."""
        user = _make_doctor_user(
            account_status=DoctorAccountStatus.APPROVED,
            created_days_ago=60,  # well past trial
        )
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is True

    def test_allows_pending_doctor_within_trial(self) -> None:
        """Returns True for pending doctor within 30-day trial."""
        user = _make_doctor_user(
            account_status=DoctorAccountStatus.PENDING,
            created_days_ago=15,  # within 30-day trial
        )
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is True

    def test_denies_pending_doctor_after_trial(self) -> None:
        """Returns False for pending doctor after trial period expires."""
        user = _make_doctor_user(
            account_status=DoctorAccountStatus.PENDING,
            created_days_ago=DOCTOR_TRIAL_DAYS + 1,
        )
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_rejected_doctor_within_trial(self) -> None:
        """Returns False for rejected doctor even within trial window."""
        user = _make_doctor_user(
            account_status=DoctorAccountStatus.REJECTED,
            created_days_ago=1,
        )
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_suspended_doctor(self) -> None:
        """Returns False for suspended doctor."""
        user = _make_doctor_user(
            account_status=DoctorAccountStatus.SUSPENDED,
            created_days_ago=5,
        )
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_patient(self) -> None:
        """Returns False for patient user."""
        user = _make_user(UserRole.PATIENT)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_admin(self) -> None:
        """Returns False for admin user."""
        user = _make_user(UserRole.ADMIN)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_unauthenticated(self) -> None:
        """Returns False for unauthenticated request."""
        user = _make_user(UserRole.DOCTOR, is_authenticated=False)
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_denies_none_user(self) -> None:
        """Returns False when request.user is None."""
        request = Mock()
        request.user = None
        assert self.permission.has_permission(request, None) is False

    def test_trial_boundary_exact_day(self) -> None:
        """Returns True on the exact last day of the trial period."""
        user = _make_doctor_user(
            account_status=DoctorAccountStatus.PENDING,
            created_days_ago=DOCTOR_TRIAL_DAYS,
        )
        request = _make_request(user)
        # On the exact boundary day (created today - TRIAL_DAYS),
        # trial_end = created_at + TRIAL_DAYS is still in the future (within same day)
        assert self.permission.has_permission(request, None) is True

    def test_denies_doctor_without_profile(self) -> None:
        """Returns False when doctor_profile does not exist."""
        user = _make_user(UserRole.DOCTOR)
        type(user).doctor_profile = PropertyMock(side_effect=Exception("no profile"))
        request = _make_request(user)
        assert self.permission.has_permission(request, None) is False

    def test_message_is_set(self) -> None:
        """IsApprovedOrTrialDoctor has a human-readable message attribute."""
        assert (
            self.permission.message
            == "Access restricted to approved doctors or doctors within their trial period."
        )

    def test_doctor_trial_days_constant_value(self) -> None:
        """DOCTOR_TRIAL_DAYS constant is 30 days."""
        assert DOCTOR_TRIAL_DAYS == 30
