"""Data migration: seed the 13 MedSlot medical specialties."""
from django.db import migrations
from django.utils.text import slugify

SPECIALTIES = [
    "General Physician",
    "Cardiologist",
    "Dermatologist",
    "Orthopedic Surgeon",
    "Pediatrician",
    "Gynecologist",
    "Neurologist",
    "Ophthalmologist",
    "ENT Specialist",
    "Psychiatrist",
    "Urologist",
    "Endocrinologist",
    "Gastroenterologist",
]


def seed_specialties(apps, schema_editor):
    """Insert each of the 13 fixed specialties, idempotent via get_or_create."""
    Specialty = apps.get_model("accounts", "Specialty")
    for name in SPECIALTIES:
        Specialty.objects.get_or_create(
            slug=slugify(name),
            defaults={"name": name},
        )


def unseed_specialties(apps, schema_editor):
    """Remove the 13 seeded specialties on migration reversal."""
    Specialty = apps.get_model("accounts", "Specialty")
    Specialty.objects.filter(
        slug__in=[slugify(n) for n in SPECIALTIES]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_specialties, reverse_code=unseed_specialties),
    ]
