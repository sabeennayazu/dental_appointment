from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny, IsAuthenticated


class AdminLoginView(APIView):
    """
    Custom login view that only allows superusers to authenticate
    Returns JWT tokens for authenticated superusers
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate user
        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check if user is superuser
        if not user.is_superuser:
            return Response(
                {'error': 'Access denied. Only superusers can access the admin panel.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if user is active
        if not user.is_active:
            return Response(
                {'error': 'User account is disabled'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
            }
        }, status=status.HTTP_200_OK)


class AdminVerifyView(APIView):
    """
    Verify if the current user is authenticated and is a superuser
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if not user.is_superuser:
            return Response(
                {'error': 'Access denied. Only superusers can access the admin panel.'},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response({
            'authenticated': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
            }
        }, status=status.HTTP_200_OK)


class AdminLogoutView(APIView):
    """
    Logout view (client-side token removal is sufficient for JWT)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(
            {'message': 'Logged out successfully'},
            status=status.HTTP_200_OK
        )
