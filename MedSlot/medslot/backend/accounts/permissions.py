"""
DRF permission classes for MedSlot role-based access control.

Architecture (ADR-004): Every protected endpoint must use a role-specific
permission class — never the generic IsAuthenticated. This enforces the
strict patient/doctor separation required by the platform's trust model.

Permission class hierarchy:
    IsPatient               — role == 'patient'
    IsApprovedDoctor        — role == 'doctor' AND account_status == 'approved'
    IsAdmin                 — role == 'admin'
    IsApprovedOrTrialDoctor — role == 'doctor' AND (approved OR within trial period)

Usage in views:
    permission_classes = [IsPatient]
    permission_classes = [IsApprovedDoctor]
    permission_classes = [IsApprovedOrTrialDoctor]  # for dashboard access during trial
"""
import logging
from datetime import timedelta

from django.utils import timezone
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from .models import DoctorAccountStatus, UserRole

logger = logging.getLogger(__name__)

# Trial period duration — doctors can access dashboard for 30 days after registration
DOCTOR_TRIAL_DAYS = 30


class IsPatient(BasePermission):
    """
    Grants access only to authenticated users with role='patient'.

    Returns 403 (not 401) when the user is authenticated but has the wrong role —
    this prevents role enumeration by distinguishing auth failure from authz failure.
    """

    message = "Access restricted to patient accounts."

    def has_permission(self, request: Request, view: APIView) -> bool:
        """Return True if the request is from an authenticated patient."""
        return (
            bool(request.user and request.user.is_authenticated)
            and request.user.role == UserRole.PATIENT
        )


class IsApprovedDoctor(BasePermission):
    """
    Grants access only to doctors with account_status='approved'.

    Pending, rejected, and suspended doctors are denied with 403.
    Doctors whose subscription has lapsed but account is approved are still
    permitted here — subscription enforcement is handled by IsApprovedOrTrialDoctor.
    """

    message = "Access restricted to approved doctor accounts."

    def has_permission(self, request: Request, view: APIView) -> bool:
        """Return True if the request is from an approved doctor."""
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role != UserRole.DOCTOR:
            return False
        try:
            return (
                request.user.doctor_profile.account_status == DoctorAccountStatus.APPROVED
            )
        except Exception:
            # doctor_profile does not exist yet (registration incomplete)
            logger.warning(
                "IsApprovedDoctor: doctor_profile missing",
                extra={"action": "permission_check_no_profile"},
            )
            return False


class IsAdmin(BasePermission):
    """
    Grants access only to authenticated admin users.

    Admin role is assigned manually — never via OTP registration flow.
    """

    message = "Access restricted to admin accounts."

    def has_permission(self, request: Request, view: APIView) -> bool:
        """Return True if the request is from an authenticated admin."""
        return (
            bool(request.user and request.user.is_authenticated)
            and request.user.role == UserRole.ADMIN
        )


class IsApprovedOrTrialDoctor(BasePermission):
    """
    Grants dashboard access to doctors who are approved OR within their 30-day trial.

    Trial period: 30 days from CustomUser.created_at.
    Used for: doctor dashboard, appointment management, consultation workflow.

    Subscription enforcement (Active vs. expired) is handled at the subscription
    layer (TASK-089) — this permission only gates the trial window.

    Access matrix:
        Approved + trial active     -> ALLOW
        Approved + trial expired    -> ALLOW (subscription takes over)
        Pending / any status        -> DENY
        Rejected / Suspended        -> DENY
    """

    message = "Access restricted to approved doctors or doctors within their trial period."

    def has_permission(self, request: Request, view: APIView) -> bool:
        """Return True if the request is from an approved or trial-period doctor."""
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role != UserRole.DOCTOR:
            return False

        try:
            profile = request.user.doctor_profile
        except Exception:
            logger.warning(
                "IsApprovedOrTrialDoctor: doctor_profile missing",
                extra={"action": "permission_check_no_profile"},
            )
            return False

        if profile.account_status == DoctorAccountStatus.APPROVED:
            return True

        # Trial period check — only for pending accounts (not rejected/suspended)
        if profile.account_status == DoctorAccountStatus.PENDING:
            trial_end = request.user.created_at + timedelta(days=DOCTOR_TRIAL_DAYS)
            return timezone.now() <= trial_end

        return False
