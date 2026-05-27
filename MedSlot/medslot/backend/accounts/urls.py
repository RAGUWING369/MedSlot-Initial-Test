"""URL routing for the accounts app."""

from django.urls import path

from .views import OTPRequestView, OTPVerifyView, PatientProfileView

urlpatterns = [
    # Auth endpoints — public (AllowAny); rate limiting enforced in OTPService
    path("auth/otp/request/", OTPRequestView.as_view(), name="otp-request"),
    path("auth/otp/verify/", OTPVerifyView.as_view(), name="otp-verify"),
    # Patient profile — requires IsPatient JWT
    path("patient/profile/", PatientProfileView.as_view(), name="patient-profile"),
]
