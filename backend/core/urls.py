"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from dental.auth_views import AdminLoginView, AdminVerifyView, AdminLogoutView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('dental.urls')),
    path('api-auth/', include('rest_framework.urls')),
    
    # Admin panel authentication endpoints
    path('api/admin/login/', AdminLoginView.as_view(), name='admin_login'),
    path('api/admin/verify/', AdminVerifyView.as_view(), name='admin_verify'),
    path('api/admin/logout/', AdminLogoutView.as_view(), name='admin_logout'),
]
