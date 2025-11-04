from django.urls import path, include
from rest_framework import routers
from .api_views import AppointmentViewSet, AppointmentHistoryViewSet, DoctorViewSet, FeedbackListCreateView

router = routers.DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointments')
router.register(r'history', AppointmentHistoryViewSet, basename='history')
router.register(r'doctors', DoctorViewSet, basename='doctors')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/feedback/', FeedbackListCreateView.as_view(), name='feedback')
]
