"""
API views for the accounts app.

Endpoints:
    POST /api/v1/auth/otp/request/     — request OTP (patient or doctor)
    POST /api/v1/auth/otp/verify/      — verify OTP, receive JWT
    POST /api/v1/patient/profile/      — create patient profile (authenticated)
    GET  /api/v1/patient/profile/      — retrieve patient profile (authenticated)

Security:
    - OTP endpoints are public (AllowAny) — rate limiting is enforced in OTPService.
    - Patient profile endpoints require IsPatient permission.
    - PHI fields (name, DOB, email) are never logged.
    - Phone numbers are never logged in plaintext.
"""

import logging

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .enums import OTPResult
from .models import CustomUser, PatientProfile, UserRole
from .permissions import IsPatient
from .serializers import (
    OTPRequestSerializer,
    OTPVerifySerializer,
    PatientProfileSerializer,
)
from .services import AuthService, MSG91Adapter, OTPService

logger = logging.getLogger(__name__)


class OTPRequestView(APIView):
    """
    POST /api/v1/auth/otp/request/

    Request an OTP for phone-based authentication.

    Accepts: { phone, role }
    Returns: 200 { message } on success
             429 { error }  on rate limit or lockout
             400 { field errors } on validation failure

    Rate limiting is enforced by OTPService (5 requests per 60 min per phone).
    The OTP is delivered via MSG91 — delivery failures are logged but do not
    return an error to the client (prevents OTP existence probing).
    """

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = OTPRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data["phone"]
        role = serializer.validated_data["role"]

        # Check lockout before rate limit — locked takes priority
        if OTPService.is_locked(phone):
            logger.info(
                "OTP request blocked — account locked",
                extra={"action": "otp_request_locked"},
            )
            return Response(
                {"error": "Account temporarily locked. Try again after 15 minutes."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Check rate limit before generating OTP
        if OTPService.check_rate_limit(phone):
            logger.info(
                "OTP request rate limited",
                extra={"action": "otp_request_rate_limited"},
            )
            return Response(
                {"error": "Too many OTP requests. Please try again after 60 minutes."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        otp_code = OTPService.generate_otp(phone)

        # Deliver OTP via MSG91 — failure logged, not surfaced to client
        delivered = MSG91Adapter.send_otp(phone, otp_code)
        if not delivered:
            logger.error(
                "OTP delivery failed — proceeding silently",
                extra={"action": "otp_delivery_failed_silent"},
            )

        logger.info("OTP requested", extra={"action": "otp_requested", "role": role})
        return Response(
            {"message": "OTP sent successfully."},
            status=status.HTTP_200_OK,
        )


class OTPVerifyView(APIView):
    """
    POST /api/v1/auth/otp/verify/

    Verify a submitted OTP and issue a JWT on success.

    Accepts: { phone, otp_code }
    Returns: 200 { token, is_new_user } on VALID
             403 { error }              on LOCKED / doctor pending
             429 { error }              on RATE_LIMITED
             400 { error }              on INVALID / EXPIRED or validation failure

    New users created via OTP verify are always patients.
    Doctors register separately (TASK-016) and cannot receive a JWT here
    until admin-approved.
    """

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = OTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data["phone"]
        otp_code = serializer.validated_data["otp_code"]

        result = OTPService.verify_otp(phone, otp_code)

        if result == OTPResult.LOCKED:
            return Response(
                {
                    "error": (
                        "Account temporarily locked after too many failed attempts. "
                        "Try again in 15 minutes."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if result == OTPResult.RATE_LIMITED:
            return Response(
                {"error": "Too many OTP requests. Please wait before trying again."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if result == OTPResult.EXPIRED:
            return Response(
                {"error": "OTP has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if result == OTPResult.INVALID:
            return Response(
                {"error": "Invalid OTP. Please check and try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # OTPResult.VALID — get or create user
        # New users from OTP verify are always patients; doctors register separately.
        user, _created = CustomUser.objects.get_or_create(
            phone=phone,
            defaults={"role": UserRole.PATIENT, "is_active": True},
        )

        # Pending doctor — cannot issue JWT until approved
        if user.role == UserRole.DOCTOR:
            try:
                if user.doctor_profile.account_status != "approved":
                    return Response(
                        {
                            "error": (
                                "Your doctor account is pending admin approval. "
                                "You will be notified once approved."
                            )
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except Exception:
                # doctor_profile does not exist — registration incomplete
                return Response(
                    {
                        "error": (
                            "Doctor registration incomplete. "
                            "Please complete your profile."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        token = AuthService.issue_jwt(user)

        # Determine if patient needs to complete profile
        is_new_user = False
        if user.role == UserRole.PATIENT:
            is_new_user = not PatientProfile.objects.filter(user=user).exists()

        logger.info(
            "OTP verified — JWT issued",
            extra={"action": "otp_verified", "role": user.role, "is_new": is_new_user},
        )

        return Response(
            {"token": token, "is_new_user": is_new_user},
            status=status.HTTP_200_OK,
        )


class PatientProfileView(APIView):
    """
    POST /api/v1/patient/profile/ — Create patient profile
    GET  /api/v1/patient/profile/ — Retrieve patient profile

    Both methods require IsPatient permission (authenticated patient JWT).

    POST: Creates PatientProfile for the authenticated user.
          Returns 409 if profile already exists.
    GET:  Returns the authenticated patient's profile.
          Returns 404 if profile not yet created.

    PHI fields (full_name, date_of_birth, email) are never logged.
    """

    permission_classes = [IsPatient]

    def post(self, request: Request) -> Response:
        """Create a new patient profile for the authenticated user."""
        # Prevent duplicate profiles — 409 is semantically correct (resource conflict)
        if PatientProfile.objects.filter(user=request.user).exists():
            return Response(
                {"error": "Profile already exists. Use PATCH to update."},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = PatientProfileSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # user FK injected from authenticated request — never from client input
        serializer.save(user=request.user)
        logger.info(
            "Patient profile created", extra={"action": "patient_profile_created"}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request: Request) -> Response:
        """Retrieve the authenticated patient's profile."""
        try:
            profile = PatientProfile.objects.get(user=request.user)
        except PatientProfile.DoesNotExist:
            return Response(
                {"error": "Profile not found. Please complete your registration."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = PatientProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
