from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView


class LoginView(APIView):
  permission_classes = [AllowAny]
  throttle_classes = [ScopedRateThrottle]
  throttle_scope = "login"

  def post(self, req):
    username = req.data.get("username")
    password = req.data.get("password")
    user = authenticate(req, username=username, password=password)
    if user is None:
      return Response(
        {"detail": "invalid cred"},
        status=status.HTTP_400_BAD_REQUEST,
      )

    login(req, user)
    return Response({"username": user.username})

class LogoutView(APIView):
  permission_classes = [IsAuthenticated]

  def post(self, req):
    logout(req)
    return Response(status=status.HTTP_204_NO_CONTENT)

class SessionView(APIView):
  permission_classes = [AllowAny]

  @method_decorator(ensure_csrf_cookie)
  def get(self, req):
    if req.user.is_authenticated:
      return Response({"username": req.user.username})
    return Response(status=status.HTTP_401_UNAUTHORIZED)
