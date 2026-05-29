"""
Unit tests for OTPService and MSG91Adapter.

All Redis interactions are mocked — tests run without a live Redis instance.
All HTTP calls to MSG91 are mocked — tests run without network access.

Coverage target: >= 90% of accounts/services.py and accounts/enums.py
"""

from unittest.mock import MagicMock, Mock, patch

from accounts.enums import OTPResult
from accounts.services import (
    OTP_FAIL_TTL_SECONDS,
    OTP_LOCK_TTL_SECONDS,
    OTP_MAX_FAILURES,
    OTP_MAX_REQUESTS,
    OTP_RATE_TTL_SECONDS,
    OTP_TTL_SECONDS,
    MSG91Adapter,
    OTPService,
    _hash_otp,
)

TEST_PHONE = "+919876543210"
TEST_OTP = "123456"


# ── _hash_otp helper ───────────────────────────────────────────────────────────


class TestHashOtp:
    """Tests for the _hash_otp helper function."""

    def test_returns_hex_string(self) -> None:
        """_hash_otp returns a 64-character hex string."""
        result = _hash_otp(TEST_OTP)
        assert len(result) == 64
        assert all(c in "0123456789abcdef" for c in result)

    def test_same_input_same_output(self) -> None:
        """_hash_otp is deterministic for the same input."""
        assert _hash_otp(TEST_OTP) == _hash_otp(TEST_OTP)

    def test_different_otp_different_hash(self) -> None:
        """Different OTPs produce different hashes."""
        assert _hash_otp("111111") != _hash_otp("222222")

    @patch("accounts.services.settings")
    def test_pepper_is_included_in_hash(self, mock_settings: Mock) -> None:
        """Hash changes when OTP_PEPPER changes — pepper is part of the hash."""
        mock_settings.OTP_PEPPER = "pepper_a"
        hash_a = _hash_otp(TEST_OTP)
        mock_settings.OTP_PEPPER = "pepper_b"
        hash_b = _hash_otp(TEST_OTP)
        assert hash_a != hash_b


# ── OTPService.generate_otp ────────────────────────────────────────────────────


class TestOTPServiceGenerateOtp:
    """Tests for OTPService.generate_otp()."""

    @patch("accounts.services.cache")
    def test_generate_otp_returns_6_digits(self, mock_cache: MagicMock) -> None:
        """generate_otp returns a 6-digit numeric string."""
        mock_cache.get.return_value = 0
        otp = OTPService.generate_otp(TEST_PHONE)
        assert len(otp) == 6
        assert otp.isdigit()

    @patch("accounts.services.cache")
    def test_generate_otp_stores_hash_in_redis(self, mock_cache: MagicMock) -> None:
        """generate_otp stores the hashed OTP in Redis with correct TTL."""
        mock_cache.get.return_value = 0
        otp = OTPService.generate_otp(TEST_PHONE)
        expected_hash = _hash_otp(otp)
        expected_key = f"otp:{TEST_PHONE}"
        mock_cache.set.assert_any_call(
            expected_key, expected_hash, timeout=OTP_TTL_SECONDS
        )

    @patch("accounts.services.cache")
    def test_generate_otp_increments_rate_counter_first_request(
        self, mock_cache: MagicMock
    ) -> None:
        """First OTP request sets rate counter to 1 with 60-min TTL."""
        mock_cache.get.return_value = 0
        OTPService.generate_otp(TEST_PHONE)
        rate_key = f"otp_rate:{TEST_PHONE}"
        mock_cache.set.assert_any_call(rate_key, 1, timeout=OTP_RATE_TTL_SECONDS)

    @patch("accounts.services.cache")
    def test_generate_otp_increments_rate_counter_subsequent_requests(
        self, mock_cache: MagicMock
    ) -> None:
        """Subsequent OTP requests increment the existing rate counter."""
        mock_cache.get.return_value = 2  # already 2 requests
        OTPService.generate_otp(TEST_PHONE)
        mock_cache.incr.assert_called_once_with(f"otp_rate:{TEST_PHONE}")

    @patch("accounts.services.cache")
    def test_generate_otp_returns_different_values(self, mock_cache: MagicMock) -> None:
        """generate_otp produces random (non-deterministic) codes across calls."""
        mock_cache.get.return_value = 0
        results = {OTPService.generate_otp(TEST_PHONE) for _ in range(20)}
        # With 10^6 possibilities, 20 calls should not all be identical
        assert len(results) > 1


# ── OTPService.check_rate_limit ────────────────────────────────────────────────


class TestOTPServiceCheckRateLimit:
    """Tests for OTPService.check_rate_limit()."""

    @patch("accounts.services.cache")
    def test_not_rate_limited_below_max(self, mock_cache: MagicMock) -> None:
        """Returns False when request count is below OTP_MAX_REQUESTS."""
        mock_cache.get.return_value = OTP_MAX_REQUESTS - 1
        assert OTPService.check_rate_limit(TEST_PHONE) is False

    @patch("accounts.services.cache")
    def test_rate_limited_at_max(self, mock_cache: MagicMock) -> None:
        """Returns True when request count equals OTP_MAX_REQUESTS."""
        mock_cache.get.return_value = OTP_MAX_REQUESTS
        assert OTPService.check_rate_limit(TEST_PHONE) is True

    @patch("accounts.services.cache")
    def test_rate_limited_above_max(self, mock_cache: MagicMock) -> None:
        """Returns True when request count exceeds OTP_MAX_REQUESTS."""
        mock_cache.get.return_value = OTP_MAX_REQUESTS + 3
        assert OTPService.check_rate_limit(TEST_PHONE) is True

    @patch("accounts.services.cache")
    def test_not_rate_limited_when_no_key(self, mock_cache: MagicMock) -> None:
        """Returns False when no rate key exists in Redis (default 0)."""
        mock_cache.get.return_value = 0
        assert OTPService.check_rate_limit(TEST_PHONE) is False

    @patch("accounts.services.cache")
    def test_uses_correct_redis_key(self, mock_cache: MagicMock) -> None:
        """check_rate_limit queries the correct otp_rate:{phone} key."""
        mock_cache.get.return_value = 0
        OTPService.check_rate_limit(TEST_PHONE)
        mock_cache.get.assert_called_with(f"otp_rate:{TEST_PHONE}", 0)


# ── OTPService.is_locked ───────────────────────────────────────────────────────


class TestOTPServiceIsLocked:
    """Tests for OTPService.is_locked()."""

    @patch("accounts.services.cache")
    def test_not_locked_when_key_absent(self, mock_cache: MagicMock) -> None:
        """Returns False when no lock key exists."""
        mock_cache.get.return_value = None
        assert OTPService.is_locked(TEST_PHONE) is False

    @patch("accounts.services.cache")
    def test_locked_when_key_present(self, mock_cache: MagicMock) -> None:
        """Returns True when lock key exists."""
        mock_cache.get.return_value = True
        assert OTPService.is_locked(TEST_PHONE) is True

    @patch("accounts.services.cache")
    def test_uses_correct_redis_key(self, mock_cache: MagicMock) -> None:
        """is_locked queries the correct otp_lock:{phone} key."""
        mock_cache.get.return_value = None
        OTPService.is_locked(TEST_PHONE)
        mock_cache.get.assert_called_with(f"otp_lock:{TEST_PHONE}")


# ── OTPService.verify_otp ──────────────────────────────────────────────────────


class TestOTPServiceVerifyOtp:
    """Tests for OTPService.verify_otp() — the full verification state machine."""

    @patch("accounts.services.cache")
    def test_verify_returns_locked_when_locked(self, mock_cache: MagicMock) -> None:
        """Returns LOCKED immediately when lock key exists — no further checks."""
        mock_cache.get.return_value = True  # is_locked returns truthy
        result = OTPService.verify_otp(TEST_PHONE, TEST_OTP)
        assert result == OTPResult.LOCKED

    @patch("accounts.services.cache")
    def test_verify_returns_rate_limited(self, mock_cache: MagicMock) -> None:
        """Returns RATE_LIMITED when rate counter equals or exceeds max."""
        # is_locked=None (not locked), rate counter=OTP_MAX_REQUESTS
        mock_cache.get.side_effect = [None, OTP_MAX_REQUESTS]
        result = OTPService.verify_otp(TEST_PHONE, TEST_OTP)
        assert result == OTPResult.RATE_LIMITED

    @patch("accounts.services.cache")
    def test_verify_returns_expired_when_no_otp_key(
        self, mock_cache: MagicMock
    ) -> None:
        """Returns EXPIRED when OTP key is missing from Redis."""
        # is_locked=None, rate=0, otp_key=None (expired/missing)
        mock_cache.get.side_effect = [None, 0, None]
        result = OTPService.verify_otp(TEST_PHONE, TEST_OTP)
        assert result == OTPResult.EXPIRED

    @patch("accounts.services.cache")
    def test_verify_returns_valid_on_correct_otp(self, mock_cache: MagicMock) -> None:
        """Returns VALID and deletes OTP key on correct submission."""
        stored_hash = _hash_otp(TEST_OTP)
        # is_locked=None, rate=0, otp_key=stored_hash
        mock_cache.get.side_effect = [None, 0, stored_hash]
        result = OTPService.verify_otp(TEST_PHONE, TEST_OTP)
        assert result == OTPResult.VALID

    @patch("accounts.services.cache")
    def test_verify_valid_deletes_otp_key(self, mock_cache: MagicMock) -> None:
        """OTP key is deleted after successful verification (one-time use)."""
        stored_hash = _hash_otp(TEST_OTP)
        mock_cache.get.side_effect = [None, 0, stored_hash]
        OTPService.verify_otp(TEST_PHONE, TEST_OTP)
        mock_cache.delete.assert_any_call(f"otp:{TEST_PHONE}")

    @patch("accounts.services.cache")
    def test_verify_valid_clears_failure_counter(self, mock_cache: MagicMock) -> None:
        """Failure counter key is deleted after successful verification."""
        stored_hash = _hash_otp(TEST_OTP)
        mock_cache.get.side_effect = [None, 0, stored_hash]
        OTPService.verify_otp(TEST_PHONE, TEST_OTP)
        delete_calls = [str(c) for c in mock_cache.delete.call_args_list]
        assert any(f"otp_fail:{TEST_PHONE}" in c for c in delete_calls)

    @patch("accounts.services.cache")
    def test_verify_returns_invalid_on_wrong_otp(self, mock_cache: MagicMock) -> None:
        """Returns INVALID and increments failure counter on wrong OTP."""
        stored_hash = _hash_otp("999999")  # stored for '999999'
        # is_locked=None, rate=0, otp_key=stored_hash
        mock_cache.get.side_effect = [None, 0, stored_hash]
        mock_cache.incr.return_value = 1  # first failure → count=1 (below threshold)
        result = OTPService.verify_otp(TEST_PHONE, "111111")  # wrong code
        assert result == OTPResult.INVALID

    @patch("accounts.services.cache")
    def test_verify_invalid_first_failure_sets_counter(
        self, mock_cache: MagicMock
    ) -> None:
        """First failure uses atomic cache.add + cache.incr to set counter to 1."""
        stored_hash = _hash_otp("999999")
        mock_cache.get.side_effect = [None, 0, stored_hash]
        mock_cache.incr.return_value = 1  # first failure → count=1
        OTPService.verify_otp(TEST_PHONE, "111111")
        fail_key = f"otp_fail:{TEST_PHONE}"
        # cache.add initialises the key atomically (SETNX)
        mock_cache.add.assert_called_once_with(fail_key, 0, timeout=OTP_FAIL_TTL_SECONDS)
        # cache.incr atomically increments and returns the new value
        mock_cache.incr.assert_called_once_with(fail_key)

    @patch("accounts.services.cache")
    def test_verify_locks_after_max_failures(self, mock_cache: MagicMock) -> None:
        """Account is locked after OTP_MAX_FAILURES invalid attempts."""
        stored_hash = _hash_otp("999999")
        mock_cache.get.side_effect = [
            None,        # is_locked → not locked
            0,           # rate limit check → ok
            stored_hash, # OTP key → exists
        ]
        # cache.incr returns OTP_MAX_FAILURES → triggers lockout
        mock_cache.incr.return_value = OTP_MAX_FAILURES

        result = OTPService.verify_otp(TEST_PHONE, "111111")
        assert result == OTPResult.INVALID

        # Verify lock key was set with correct TTL
        lock_key = f"otp_lock:{TEST_PHONE}"
        set_calls = [str(c) for c in mock_cache.set.call_args_list]
        assert any(lock_key in c for c in set_calls)
        assert any(str(OTP_LOCK_TTL_SECONDS) in c for c in set_calls)

    @patch("accounts.services.cache")
    def test_verify_lock_also_clears_fail_counter(self, mock_cache: MagicMock) -> None:
        """Fail counter key is deleted when lockout is triggered."""
        stored_hash = _hash_otp("999999")
        mock_cache.get.side_effect = [None, 0, stored_hash]
        mock_cache.incr.return_value = OTP_MAX_FAILURES  # triggers lockout
        OTPService.verify_otp(TEST_PHONE, "111111")
        fail_key = f"otp_fail:{TEST_PHONE}"
        delete_calls = [str(c) for c in mock_cache.delete.call_args_list]
        assert any(fail_key in c for c in delete_calls)

    @patch("accounts.services.cache")
    def test_verify_second_failure_increments_counter(
        self, mock_cache: MagicMock
    ) -> None:
        """Second failure: cache.incr returns 2 (below threshold — no lockout)."""
        stored_hash = _hash_otp("999999")
        mock_cache.get.side_effect = [None, 0, stored_hash]
        mock_cache.incr.return_value = 2  # second failure → count=2 (below max)
        OTPService.verify_otp(TEST_PHONE, "111111")
        fail_key = f"otp_fail:{TEST_PHONE}"
        # Confirm cache.incr was called (atomic increment — no cache.set for counter)
        mock_cache.incr.assert_called_once_with(fail_key)
        # Confirm no lock was set (count < OTP_MAX_FAILURES)
        lock_key = f"otp_lock:{TEST_PHONE}"
        set_calls = [str(c) for c in mock_cache.set.call_args_list]
        assert not any(lock_key in c for c in set_calls)


# ── MSG91Adapter ───────────────────────────────────────────────────────────────


class TestMSG91Adapter:
    """Tests for MSG91Adapter.send_otp()."""

    @patch("accounts.services.requests.post")
    @patch("accounts.services.settings")
    def test_send_otp_success(self, mock_settings: Mock, mock_post: MagicMock) -> None:
        """Returns True on HTTP 200 from MSG91."""
        mock_settings.MSG91_API_KEY = "test_key"
        mock_settings.MSG91_TEMPLATE_ID = "tmpl_123"
        mock_response = Mock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        result = MSG91Adapter.send_otp(TEST_PHONE, TEST_OTP)
        assert result is True
        mock_post.assert_called_once()

    @patch("accounts.services.requests.post")
    @patch("accounts.services.settings")
    def test_send_otp_strips_plus_from_phone(
        self, mock_settings: Mock, mock_post: MagicMock
    ) -> None:
        """MSG91 payload uses phone number without leading '+' sign."""
        mock_settings.MSG91_API_KEY = "test_key"
        mock_settings.MSG91_TEMPLATE_ID = "tmpl_123"
        mock_response = Mock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        MSG91Adapter.send_otp("+919876543210", TEST_OTP)
        call_kwargs = mock_post.call_args
        assert call_kwargs[1]["json"]["mobile"] == "919876543210"

    @patch("accounts.services.requests.post")
    @patch("accounts.services.settings")
    def test_send_otp_retries_on_5xx(
        self, mock_settings: Mock, mock_post: MagicMock
    ) -> None:
        """Retries once on HTTP 500; returns True if retry succeeds."""
        mock_settings.MSG91_API_KEY = "test_key"
        mock_settings.MSG91_TEMPLATE_ID = "tmpl_123"

        fail_response = Mock()
        fail_response.status_code = 500
        success_response = Mock()
        success_response.status_code = 200
        mock_post.side_effect = [fail_response, success_response]

        result = MSG91Adapter.send_otp(TEST_PHONE, TEST_OTP)
        assert result is True
        assert mock_post.call_count == 2

    @patch("accounts.services.requests.post")
    @patch("accounts.services.settings")
    def test_send_otp_fails_after_two_5xx(
        self, mock_settings: Mock, mock_post: MagicMock
    ) -> None:
        """Returns False after two consecutive 5xx responses."""
        mock_settings.MSG91_API_KEY = "test_key"
        mock_settings.MSG91_TEMPLATE_ID = "tmpl_123"

        fail_response = Mock()
        fail_response.status_code = 500
        mock_post.return_value = fail_response

        result = MSG91Adapter.send_otp(TEST_PHONE, TEST_OTP)
        assert result is False
        assert mock_post.call_count == 2

    @patch("accounts.services.settings")
    def test_send_otp_returns_false_when_no_api_key(self, mock_settings: Mock) -> None:
        """Returns False immediately when MSG91_API_KEY is not configured."""
        mock_settings.MSG91_API_KEY = ""
        result = MSG91Adapter.send_otp(TEST_PHONE, TEST_OTP)
        assert result is False

    @patch("accounts.services.requests.post")
    @patch("accounts.services.settings")
    def test_send_otp_returns_false_on_4xx(
        self, mock_settings: Mock, mock_post: MagicMock
    ) -> None:
        """Returns False on 4xx without retrying (client configuration error)."""
        mock_settings.MSG91_API_KEY = "test_key"
        mock_settings.MSG91_TEMPLATE_ID = "tmpl_123"

        response = Mock()
        response.status_code = 400
        mock_post.return_value = response

        result = MSG91Adapter.send_otp(TEST_PHONE, TEST_OTP)
        assert result is False
        assert mock_post.call_count == 1  # no retry on 4xx

    @patch("accounts.services.requests.post")
    @patch("accounts.services.settings")
    def test_send_otp_retries_on_request_exception(
        self, mock_settings: Mock, mock_post: MagicMock
    ) -> None:
        """Retries once on network exception; returns True if retry succeeds."""
        import requests as req_lib

        mock_settings.MSG91_API_KEY = "test_key"
        mock_settings.MSG91_TEMPLATE_ID = "tmpl_123"

        success_response = Mock()
        success_response.status_code = 200
        mock_post.side_effect = [req_lib.RequestException("timeout"), success_response]

        result = MSG91Adapter.send_otp(TEST_PHONE, TEST_OTP)
        assert result is True
        assert mock_post.call_count == 2

    @patch("accounts.services.requests.post")
    @patch("accounts.services.settings")
    def test_send_otp_fails_after_two_request_exceptions(
        self, mock_settings: Mock, mock_post: MagicMock
    ) -> None:
        """Returns False after two consecutive network exceptions."""
        import requests as req_lib

        mock_settings.MSG91_API_KEY = "test_key"
        mock_settings.MSG91_TEMPLATE_ID = "tmpl_123"

        mock_post.side_effect = req_lib.RequestException("connection refused")

        result = MSG91Adapter.send_otp(TEST_PHONE, TEST_OTP)
        assert result is False
        assert mock_post.call_count == 2

    @patch("accounts.services.requests.post")
    @patch("accounts.services.settings")
    def test_send_otp_uses_correct_url_and_timeout(
        self, mock_settings: Mock, mock_post: MagicMock
    ) -> None:
        """send_otp calls the correct MSG91 endpoint with the declared timeout."""
        mock_settings.MSG91_API_KEY = "test_key"
        mock_settings.MSG91_TEMPLATE_ID = "tmpl_123"
        mock_response = Mock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        MSG91Adapter.send_otp(TEST_PHONE, TEST_OTP)
        call_args = mock_post.call_args
        assert call_args[0][0] == MSG91Adapter.MSG91_OTP_URL
        assert call_args[1]["timeout"] == MSG91Adapter.REQUEST_TIMEOUT_SECONDS


# ── OTPResult enum ─────────────────────────────────────────────────────────────


class TestOTPResultEnum:
    """Tests for OTPResult enum completeness and values."""

    def test_all_variants_present(self) -> None:
        """OTPResult has all 5 required variants."""
        variants = {r.value for r in OTPResult}
        assert variants == {"valid", "invalid", "expired", "locked", "rate_limited"}

    def test_valid_variant_value(self) -> None:
        """OTPResult.VALID has the expected string value."""
        assert OTPResult.VALID.value == "valid"

    def test_invalid_variant_value(self) -> None:
        """OTPResult.INVALID has the expected string value."""
        assert OTPResult.INVALID.value == "invalid"

    def test_expired_variant_value(self) -> None:
        """OTPResult.EXPIRED has the expected string value."""
        assert OTPResult.EXPIRED.value == "expired"

    def test_locked_variant_value(self) -> None:
        """OTPResult.LOCKED has the expected string value."""
        assert OTPResult.LOCKED.value == "locked"

    def test_rate_limited_variant_value(self) -> None:
        """OTPResult.RATE_LIMITED has the expected string value."""
        assert OTPResult.RATE_LIMITED.value == "rate_limited"
