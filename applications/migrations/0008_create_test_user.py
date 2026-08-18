import os

from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_test_user(apps, schema_editor):
    User = apps.get_model("auth", "User")

    username = os.environ.get("TEST_USER_USERNAME", "testuser")
    password = os.environ.get("TEST_USER_PASSWORD")
    if not password:
        return

    if User.objects.filter(username=username).exists():
        return

    User.objects.create(
        username=username,
        password=make_password(password),
        is_active=True,
    )


class Migration(migrations.Migration):
    dependencies = [("applications", "0007_alter_application_owner")]
    operations = [migrations.RunPython(create_test_user, migrations.RunPython.noop)]
