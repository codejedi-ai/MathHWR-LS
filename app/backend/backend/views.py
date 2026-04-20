from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from django.contrib.auth.models import User
from django.db import IntegrityError

@api_view(['POST'])
def signup_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')

    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.create_user(username=username, email=email, password=password)
        login(request, user)
        return Response({'message': 'User created successfully', 'username': user.username}, status=status.HTTP_201_CREATED)
    except IntegrityError:
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        login(request, user)
        return Response({'message': 'Logged in successfully', 'username': user.username})
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logged out successfully'})

@api_view(['GET'])
def user_info(request):
    if request.user.is_authenticated:
        return Response({'username': request.user.username})
    return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

@ensure_csrf_cookie
@api_view(['GET'])
def get_csrf_token(request):
    return Response({'detail': 'CSRF cookie set'})
