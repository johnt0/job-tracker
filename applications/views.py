from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from . import models
from .models import ApplicationState
from .serializers import ApplicationSerializer


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = models.Application.objects.filter(owner=self.request.user)
        state = self.request.query_params.get('state')
        if state in ApplicationState.values:
            queryset = queryset.filter(state=state)
        return queryset

    def perform_create(self, serializer):
      serializer.save(owner=self.request.user)
