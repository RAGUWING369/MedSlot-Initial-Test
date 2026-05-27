"""
Custom user manager for MedSlot's phone-based authentication.

AbstractBaseUser requires a custom manager. Since MedSlot uses phone
numbers as the unique identifier (not email), USERNAME_FIELD = 'phone'.
No password is stored — authentication is OTP-based (see accounts/services.py).
"""
from django.contrib.auth.base_user import BaseUserManager


class CustomUserManager(BaseUserManager):
    """
    Manager for CustomUser.

    create_user and create_superuser are required by AbstractBaseUser.
    Phone is the unique identifier; no password is stored for regular users.
    """

    def create_user(self, phone: str, role: str = "patient", **extra_fields):
        """
        Create and return a regular user with the given phone number.

        Args:
            phone: Indian mobile number (10 digits, validated at API layer).
            role: One of 'patient', 'doctor', 'admin'. Defaults to 'patient'.
            **extra_fields: Additional model field values.

        Returns:
            CustomUser instance saved to the database.

        Raises:
            ValueError: If phone is empty or None.
        """
        if not phone:
            raise ValueError("Phone number is required.")
        user = self.model(phone=phone, role=role, **extra_fields)
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone: str, password: str = None, **extra_fields):
        """
        Create and return a superuser (admin role, staff and superuser flags set).

        Used exclusively for `python manage.py createsuperuser` — not part of
        the OTP registration flow.

        Args:
            phone: Mobile number for the admin account.
            password: Optional password for Django admin panel login.
            **extra_fields: Additional model field values.

        Returns:
            CustomUser instance with role='admin', is_staff=True, is_superuser=True.

        Raises:
            ValueError: If is_staff or is_superuser are explicitly set to False.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        user = self.model(phone=phone, role="admin", **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user
