from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/csrf/', views.get_csrf_token),
    path('api/login/', views.login_view),
    path('api/signup/', views.signup_view),
    path('api/logout/', views.logout_view),
    path('api/user/', views.user_info),
]
