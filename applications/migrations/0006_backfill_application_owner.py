from django.conf import settings
from django.db import migrations


def backfill_owner(apps, schema_editor):
    Application = apps.get_model("applications", "Application")
    User = apps.get_model(*settings.AUTH_USER_MODEL.split("."))

    if not Application.objects.filter(owner__isnull=True).exists():
        return

    user = User.objects.order_by("id").first()
    if user is None:
        raise RuntimeError(
            "Applications exist with no owner and no user exists. "
            "Run createsuperuser before migrating."
        )

    Application.objects.filter(owner__isnull=True).update(owner=user)

class Migration(migrations.Migration):
    dependencies = [("applications", "0005_application_owner")]
    operations = [migrations.RunPython(backfill_owner, migrations.RunPython.noop)]
