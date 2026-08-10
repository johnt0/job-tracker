from django.db import connection
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework import viewsets
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from . import models
from .models import ApplicationState
from .serializers import ApplicationSerializer


@method_decorator(never_cache, name='dispatch')
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


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def healthz(req):
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        return Response(status=200)
    except Exception:
        return Response(status=503)
