from django.conf import settings
from django.db import models


class ApplicationState(models.TextChoices):
    APPLIED = "APPLIED", "Applied"
    INTERVIEWING = "INTERVIEWING", "Interviewing"
    OFFERED = "OFFER", "Offer"
    REJECTED = "REJECTED", "Rejected"

class Application(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=128)
    company = models.CharField(max_length=128)
    date_applied = models.DateField()
    state = models.CharField(max_length=128, choices=ApplicationState.choices)
    link = models.URLField(blank=True)
    owner = models.ForeignKey(
      settings.AUTH_USER_MODEL,
      on_delete=models.CASCADE,
      related_name="applications",
    )
