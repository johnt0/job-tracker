from rest_framework import serializers

from . import models
from .models import ApplicationState


class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Application
        fields = ["id", "title", "company", "date_applied", "state", "link"]
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['state'] = ApplicationState.APPLIED
        return super().create(validated_data)
