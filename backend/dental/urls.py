from django.urls import path, include
from rest_framework import routers
from .api_views import AppointmentViewSet, AppointmentHistoryViewSet, DoctorViewSet, ServiceViewSet, FeedbackListCreateView, UserViewSet, FeedbackDetailView

router = routers.DefaultRouter()
router.register(r'services', ServiceViewSet, basename='services')
router.register(r'appointments', AppointmentViewSet, basename='appointments')
router.register(r'history', AppointmentHistoryViewSet, basename='history')
router.register(r'doctors', DoctorViewSet, basename='doctors')
router.register(r'users', UserViewSet, basename='users')

urlpatterns = [
    path('api/', include(router.urls)),
    path("api/feedback/", FeedbackListCreateView.as_view(), name="feedback-list-create"),
    path("api/feedback/<int:pk>/", FeedbackDetailView.as_view(), name="feedback-detail"),
]
