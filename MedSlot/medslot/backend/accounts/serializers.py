"""
Serializers for the accounts app.

All serializers enforce strict input validation at the API boundary.
PHI fields (full_name, date_of_birth, email) are validated carefully;
they are write-only on input to prevent accidental exposure in error
responses where feasible.

Phone validation: Indian mobile numbers in E.164 format (+91XXXXXXXXXX)
or 10-digit local format (XXXXXXXXXX) — normalised to E.164 on save.
"""

import re
from datetime import date

from rest_framework import serializers

from .models import PatientProfile, UserRole

# ── Phone validation ───────────────────────────────────────────────────────────

INDIAN_PHONE_REGEX = re.compile(r"^(\+91|91)?[6-9]\d{9}$")


def validate_indian_phone(value: str) -> str:
    """
    Validate and normalise an Indian mobile number to E.164 format.

    Accepts:
        +919876543210
        919876543210
        9876543210

    Returns:
        Normalised E.164 string, e.g. '+919876543210'.

    Raises:
        serializers.ValidationError: if the number does not match the pattern.
    """
    cleaned = value.strip().replace(" ", "").replace("-", "")
    if not INDIAN_PHONE_REGEX.match(cleaned):
        raise serializers.ValidationError(
            "Enter a valid Indian mobile number (10 digits starting with 6–9)."
        )
    # Normalise to E.164
    digits = re.sub(r"^\+?91", "", cleaned)
    return f"+91{digits}"


# ── OTP serializers ────────────────────────────────────────────────────────────


class OTPRequestSerializer(serializers.Serializer):
    """
    Input serializer for POST /api/v1/auth/otp/request/.

    Validates phone number format and role value before OTP generation.
    """

    phone = serializers.CharField(max_length=15)
    role = serializers.ChoiceField(choices=[UserRole.PATIENT, UserRole.DOCTOR])

    def validate_phone(self, value: str) -> str:
        """Validate and normalise Indian phone number."""
        return validate_indian_phone(value)


class OTPVerifySerializer(serializers.Serializer):
    """
    Input serializer for POST /api/v1/auth/otp/verify/.

    Validates phone format and OTP format (6 digits).
    """

    phone = serializers.CharField(max_length=15)
    otp_code = serializers.CharField(min_length=6, max_length=6)

    def validate_phone(self, value: str) -> str:
        """Validate and normalise Indian phone number."""
        return validate_indian_phone(value)

    def validate_otp_code(self, value: str) -> str:
        """OTP must be exactly 6 numeric digits."""
        if not value.isdigit():
            raise serializers.ValidationError("OTP must contain only digits.")
        return value


# ── Patient profile serializers ────────────────────────────────────────────────


class PatientProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for PatientProfile create and read.

    PHI fields (full_name, date_of_birth, email) are validated strictly.
    The user FK is injected from the request in the view — not accepted from input.
    """

    class Meta:
        model = PatientProfile
        fields = ["id", "full_name", "date_of_birth", "gender", "email", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_date_of_birth(self, value: date) -> date:
        """Date of birth must be in the past; patient must be at least 1 year old."""
        today = date.today()
        if value >= today:
            raise serializers.ValidationError("Date of birth must be in the past.")
        age_years = (today - value).days / 365.25
        if age_years < 1:
            raise serializers.ValidationError("Patient must be at least 1 year old.")
        if age_years > 120:
            raise serializers.ValidationError("Enter a valid date of birth.")
        return value

    def validate_full_name(self, value: str) -> str:
        """Full name must contain at least two characters and no special characters."""
        stripped = value.strip()
        if len(stripped) < 2:
            raise serializers.ValidationError(
                "Full name must be at least 2 characters."
            )
        if not re.match(r"^[a-zA-Z\s\-'\.]+$", stripped):
            raise serializers.ValidationError(
                "Full name may only contain letters, spaces, hyphens, "
                "apostrophes, and dots."
            )
        return stripped
