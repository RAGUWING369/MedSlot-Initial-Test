"""
Enumerations for the accounts app.

Centralised enum definitions avoid magic strings in service and view layers.
"""

from enum import Enum


class OTPResult(Enum):
    """
    Result of an OTP verification attempt.

    Returned by OTPService.verify_otp() — callers must handle all variants.

    Variants:
        VALID        — OTP matched; proceed with login/registration.
        INVALID      — OTP did not match; failure counter incremented.
        EXPIRED      — OTP TTL elapsed before verification.
        LOCKED       — 3 consecutive failures within 10 min; account locked 15 min.
        RATE_LIMITED — More than 5 OTP requests within 60 min from this phone.
    """

    VALID = "valid"
    INVALID = "invalid"
    EXPIRED = "expired"
    LOCKED = "locked"
    RATE_LIMITED = "rate_limited"
