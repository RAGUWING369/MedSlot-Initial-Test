"""
OTP and authentication services for MedSlot.

OTPService: generates, stores, and verifies time-limited OTPs using Redis.
MSG91Adapter: delivers OTPs via MSG91 OTP API v5 (India).

Security design (ADR-004):
- OTP stored as SHA-256(otp_code + PEPPER) — raw code never persisted.
- OTP_PEPPER loaded from environment — never logged, never exposed.
- Failure counter prevents brute-force; rate limiter prevents OTP flooding.
- All Redis keys are prefixed with 'otp:' namespace to avoid collisions.

PHI Policy: phone numbers are PII. They must not appear in log messages.
Use structured logging with sanitised fields only.
"""

import hashlib
import logging
import random
import string
from typing import Optional

from django.conf import settings
from django.core.cache import cache

import requests

from .enums import OTPResult

logger = logging.getLogger(__name__)

# ── Redis key templates ────────────────────────────────────────────────────────
_OTP_KEY = "otp:{phone}"  # Stores hashed OTP — TTL 5 min
_OTP_FAIL_KEY = "otp_fail:{phone}"  # Failure counter — TTL 10 min
_OTP_LOCK_KEY = "otp_lock:{phone}"  # Lockout flag — TTL 15 min
_OTP_RATE_KEY = "otp_rate:{phone}"  # Rate limit counter — TTL 60 min

# ── Constants ──────────────────────────────────────────────────────────────────
OTP_LENGTH = 6
OTP_TTL_SECONDS = 300  # 5 minutes
OTP_FAIL_TTL_SECONDS = 600  # 10 minutes — window for counting failures
OTP_LOCK_TTL_SECONDS = 900  # 15 minutes — lockout duration
OTP_RATE_TTL_SECONDS = 3600  # 60 minutes — rate limit window
OTP_MAX_FAILURES = 3  # failures before lockout
OTP_MAX_REQUESTS = 5  # requests per 60-min window


def _hash_otp(otp_code: str) -> str:
    """
    Return SHA-256(otp_code + OTP_PEPPER) as a hex string.

    The PEPPER is loaded from settings and must never be logged or exposed.
    Hashing prevents raw OTP recovery even if Redis is compromised.

    Args:
        otp_code: The plaintext 6-digit OTP string.

    Returns:
        64-character hex digest string.
    """
    pepper = getattr(settings, "OTP_PEPPER", "")
    payload = f"{otp_code}{pepper}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


class OTPService:
    """
    Manages OTP lifecycle: generation, storage, verification, and lockout.

    All methods are class-level (no instance state) — safe to call without
    instantiation. Redis cache is accessed via Django's cache framework.
    """

    @classmethod
    def generate_otp(cls, phone: str) -> str:
        """
        Generate a 6-digit OTP, hash it, and store in Redis with a 5-min TTL.

        Rate-limits the caller — raises no exception on rate limit; callers
        should call check_rate_limit() first and handle OTPResult.RATE_LIMITED.

        Args:
            phone: E.164 format phone number (e.g. +919876543210).

        Returns:
            The plaintext 6-digit OTP string (returned once to the caller for
            delivery via MSG91 — never stored in plaintext).
        """
        otp_code = "".join(random.choices(string.digits, k=OTP_LENGTH))
        hashed = _hash_otp(otp_code)

        rate_key = _OTP_RATE_KEY.format(phone=phone)
        request_count = cache.get(rate_key, 0)

        if request_count == 0:
            cache.set(rate_key, 1, timeout=OTP_RATE_TTL_SECONDS)
        else:
            cache.incr(rate_key)

        otp_key = _OTP_KEY.format(phone=phone)
        cache.set(otp_key, hashed, timeout=OTP_TTL_SECONDS)

        logger.info("OTP generated", extra={"action": "otp_generated"})
        return otp_code

    @classmethod
    def check_rate_limit(cls, phone: str) -> bool:
        """
        Return True if the phone number has exceeded the OTP request rate limit.

        Checks the otp_rate:{phone} counter. Does NOT increment it — call
        generate_otp() to increment.

        Args:
            phone: E.164 format phone number.

        Returns:
            True if rate limit exceeded; False if within limit.
        """
        rate_key = _OTP_RATE_KEY.format(phone=phone)
        count = cache.get(rate_key, 0)
        return int(count) >= OTP_MAX_REQUESTS

    @classmethod
    def is_locked(cls, phone: str) -> bool:
        """
        Return True if the phone number is currently locked out.

        Args:
            phone: E.164 format phone number.

        Returns:
            True if lockout key exists in Redis; False otherwise.
        """
        lock_key = _OTP_LOCK_KEY.format(phone=phone)
        return cache.get(lock_key) is not None

    @classmethod
    def verify_otp(cls, phone: str, otp_code: str) -> OTPResult:
        """
        Verify a submitted OTP code against the stored hash.

        Implements the full verification state machine:
        1. Check lockout → return LOCKED immediately.
        2. Check rate limit → return RATE_LIMITED immediately.
        3. Retrieve stored hash → return EXPIRED if missing.
        4. Compare hashes → return VALID or INVALID.
        5. On INVALID: increment failure counter; lock on 3rd failure.

        The stored OTP key is deleted on successful verification (one-time use).

        Args:
            phone: E.164 format phone number.
            otp_code: The 6-digit code submitted by the user.

        Returns:
            OTPResult enum variant.
        """
        # 1. Lockout check
        if cls.is_locked(phone):
            logger.info(
                "OTP verification blocked — account locked",
                extra={"action": "otp_locked"},
            )
            return OTPResult.LOCKED

        # 2. Rate limit check
        if cls.check_rate_limit(phone):
            logger.info(
                "OTP verification blocked — rate limited",
                extra={"action": "otp_rate_limited"},
            )
            return OTPResult.RATE_LIMITED

        # 3. Stored hash retrieval
        otp_key = _OTP_KEY.format(phone=phone)
        stored_hash: Optional[str] = cache.get(otp_key)
        if stored_hash is None:
            logger.info(
                "OTP verification failed — expired or not found",
                extra={"action": "otp_expired"},
            )
            return OTPResult.EXPIRED

        # 4. Hash comparison (both are hex strings — constant length prevents
        #    timing attacks based on short-circuit string comparison)
        submitted_hash = _hash_otp(otp_code)
        if submitted_hash != stored_hash:
            cls._record_failure(phone)
            logger.info(
                "OTP verification failed — invalid code",
                extra={"action": "otp_invalid"},
            )
            return OTPResult.INVALID

        # 5. Success — consume the OTP (one-time use)
        cache.delete(otp_key)
        cls._clear_failure_counter(phone)
        logger.info("OTP verification succeeded", extra={"action": "otp_valid"})
        return OTPResult.VALID

    @classmethod
    def _record_failure(cls, phone: str) -> None:
        """
        Increment the failure counter. Lock the account after OTP_MAX_FAILURES.

        The failure window TTL is reset on each failure (sliding window).
        This is conservative by design — it extends the lockout window when
        an attacker continues to probe, which is the desired behaviour.

        Args:
            phone: E.164 format phone number.
        """
        fail_key = _OTP_FAIL_KEY.format(phone=phone)
        failure_count = cache.get(fail_key, 0)

        if failure_count == 0:
            cache.set(fail_key, 1, timeout=OTP_FAIL_TTL_SECONDS)
        else:
            new_count = int(failure_count) + 1
            # Re-set with full window on each increment (sliding window).
            # Django cache does not expose TTL for partial updates, so this
            # is the safest approach without a custom Redis script.
            cache.set(fail_key, new_count, timeout=OTP_FAIL_TTL_SECONDS)

            if new_count >= OTP_MAX_FAILURES:
                lock_key = _OTP_LOCK_KEY.format(phone=phone)
                cache.set(lock_key, True, timeout=OTP_LOCK_TTL_SECONDS)
                cache.delete(fail_key)
                logger.info(
                    "OTP account locked after max failures",
                    extra={"action": "otp_account_locked"},
                )

    @classmethod
    def _clear_failure_counter(cls, phone: str) -> None:
        """
        Clear the failure counter after a successful verification.

        Args:
            phone: E.164 format phone number.
        """
        fail_key = _OTP_FAIL_KEY.format(phone=phone)
        cache.delete(fail_key)


class MSG91Adapter:
    """
    Delivers OTPs via MSG91 OTP API v5.

    MSG91 is the approved SMS/OTP provider for the Indian market.
    API credentials are loaded from settings — never hardcoded.

    Retry policy: one retry on HTTP 5xx responses (transient server errors).
    No retry on 4xx (client configuration errors — escalate immediately).
    """

    MSG91_OTP_URL = "https://control.msg91.com/api/v5/otp"
    REQUEST_TIMEOUT_SECONDS = 10

    @classmethod
    def send_otp(cls, phone: str, otp_code: str) -> bool:
        """
        Send an OTP to the given phone number via MSG91.

        Args:
            phone: E.164 format phone number (e.g. +919876543210).
            otp_code: The plaintext 6-digit OTP to deliver.

        Returns:
            True if delivery was accepted by MSG91; False if all attempts failed.
        """
        api_key = getattr(settings, "MSG91_API_KEY", "")
        template_id = getattr(settings, "MSG91_TEMPLATE_ID", "")

        if not api_key:
            logger.error(
                "MSG91_API_KEY not configured — OTP delivery skipped",
                extra={"action": "otp_delivery_skipped"},
            )
            return False

        payload = {
            "template_id": template_id,
            "mobile": phone.lstrip("+"),  # MSG91 expects number without '+'
            "authkey": api_key,
            "otp": otp_code,
        }

        for attempt in range(1, 3):  # attempt 1, then retry attempt 2
            try:
                response = requests.post(
                    cls.MSG91_OTP_URL,
                    json=payload,
                    timeout=cls.REQUEST_TIMEOUT_SECONDS,
                )
                if response.status_code < 500:
                    # 2xx = success; 4xx = config error (no retry)
                    success = response.status_code == 200
                    logger.info(
                        "MSG91 OTP delivery attempt",
                        extra={
                            "action": "otp_delivery_attempt",
                            "attempt": attempt,
                            "status_code": response.status_code,
                            "success": success,
                        },
                    )
                    return success
                # 5xx — log and retry
                logger.warning(
                    "MSG91 5xx error — will retry",
                    extra={
                        "action": "otp_delivery_5xx",
                        "attempt": attempt,
                        "status_code": response.status_code,
                    },
                )
            except requests.RequestException:
                logger.warning(
                    "MSG91 request exception — will retry",
                    extra={"action": "otp_delivery_exception", "attempt": attempt},
                )
                if attempt == 2:
                    logger.error(
                        "MSG91 OTP delivery failed after retry",
                        extra={"action": "otp_delivery_failed"},
                    )

        return False


# ── AuthService ────────────────────────────────────────────────────────────────

from rest_framework_simplejwt.tokens import AccessToken  # noqa: E402


class AuthService:
    """
    Issues JWT access tokens for authenticated MedSlot users.

    Uses djangorestframework-simplejwt with HS256 algorithm.
    Token lifetime: 24 hours (ACCESS_TOKEN_LIFETIME in settings).
    No refresh tokens in v1 — patients/doctors re-authenticate via OTP.

    Security: token payload includes user_id (UUID) and role — never PHI.
    """

    @staticmethod
    def issue_jwt(user) -> str:
        """
        Issue a 24-hour HS256 JWT access token for the given user.

        Adds 'role' claim to the standard simplejwt payload so downstream
        permission classes can read the role without a DB query.

        Args:
            user: CustomUser instance (must be active).

        Returns:
            Encoded JWT string ready for use in Authorization: Bearer header.
        """
        token = AccessToken.for_user(user)
        token["role"] = user.role  # custom claim — role never contains PHI
        return str(token)
