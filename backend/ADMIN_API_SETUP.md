# Backend API Setup for Next.js Admin Panel

This guide explains the backend modifications needed to fully support the Next.js admin panel.

## Required Packages

Install these packages if not already installed:

```bash
pip install djangorestframework-simplejwt django-cors-headers django-filter
```

## 1. Settings Configuration

Update `core/settings.py`:

```python
INSTALLED_APPS = [
    # ... existing apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Add this near the top
    'django.middleware.security.SecurityMiddleware',
    # ... rest of middleware
]

# CORS Configuration (for development)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# For production, use specific origins
# CORS_ALLOWED_ORIGINS = [
#     "https://yourdomain.com",
# ]

CORS_ALLOW_CREDENTIALS = True

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

## 2. URL Configuration

Update `core/urls.py`:

```python
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('dental.urls')),
    
    # JWT Authentication endpoints
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # DRF browsable API login (optional, for testing)
    path('api-auth/', include('rest_framework.urls')),
]
```

## 3. Update API Views

Update `dental/api_views.py` to add filtering and pagination:

```python
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .models import Appointment, AppointmentHistory, Doctor, Feedback
from .serializers import (
    AppointmentSerializer, 
    AppointmentHistorySerializer, 
    DoctorSerializer, 
    FeedbackSerializer
)


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().order_by('-created_at')
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'service', 'doctor', 'appointment_date']
    search_fields = ['name', 'email', 'phone']
    ordering_fields = ['created_at', 'appointment_date', 'status']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Date range filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(appointment_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(appointment_date__lte=date_to)
            
        return queryset

    def create(self, request, *args, **kwargs):
        # New appointments always start with PENDING
        data = request.data.copy()
        data['status'] = 'PENDING'
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # For admin updates, allow status and admin_notes
        allowed = {'status', 'admin_notes', 'doctor', 'appointment_date', 'appointment_time'}
        data = {k: v for k, v in request.data.items() if k in allowed}
        
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Record history if status changes
        old_status = instance.status
        self.perform_update(serializer)
        
        if 'status' in data and old_status != data.get('status'):
            doc = instance.doctor
            AppointmentHistory.objects.create(
                appointment=instance,
                name=instance.name,
                email=instance.email,
                phone=instance.phone,
                service=instance.service,
                appointment_date=instance.appointment_date,
                appointment_time=instance.appointment_time,
                message=instance.message,
                doctor_id=getattr(doc, 'id', None),
                doctor_name=getattr(doc, 'name', None),
                previous_status=old_status,
                new_status=data.get('status'),
                changed_by=str(request.user) if request.user.is_authenticated else 'api',
                notes=data.get('admin_notes', '')
            )
            
            # Delete appointment if approved or rejected (matching Django admin behavior)
            if data.get('status') in ('APPROVED', 'REJECTED'):
                instance.delete()
                return Response({'message': f'Appointment {data.get("status").lower()} and archived'})
        
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_phone(self, request):
        import re
        try:
            phone = request.query_params.get('phone')
            if not phone:
                return Response({'detail': 'phone query param required'}, status=400)

            query_digits = re.sub(r"\D", "", str(phone))
            results = []

            for a in Appointment.objects.all().order_by('-created_at'):
                try:
                    raw = getattr(a, 'phone', None)
                    if not raw:
                        continue
                    a_digits = re.sub(r"\D", "", str(raw))
                    if a_digits == query_digits:
                        serialized = AppointmentSerializer(a).data
                        serialized['_source'] = 'active'
                        results.append(serialized)
                except Exception:
                    continue

            for h in AppointmentHistory.objects.all().order_by('-timestamp'):
                try:
                    raw = getattr(h, 'phone', None)
                    if not raw:
                        continue
                    h_digits = re.sub(r"\D", "", str(raw))
                    if h_digits == query_digits:
                        serialized = AppointmentHistorySerializer(h).data
                        serialized['_source'] = 'history'
                        results.append(serialized)
                except Exception:
                    continue

            if not results:
                return Response({'message': 'No appointments found'}, status=404)

            return Response(results)
        except Exception as exc:
            return Response({'error': str(exc)}, status=500)


class AppointmentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AppointmentHistory.objects.all().order_by('-timestamp')
    serializer_class = AppointmentHistorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['previous_status', 'new_status', 'changed_by']
    search_fields = ['name', 'phone', 'changed_by']


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.filter(active=True).order_by('name')
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['service', 'active']
    search_fields = ['name', 'email', 'phone']

    def get_queryset(self):
        qs = super().get_queryset()
        service = self.request.query_params.get('service')
        if service:
            qs = qs.filter(service=service)
        return qs


class FeedbackViewSet(viewsets.ModelViewSet):
    """ViewSet for Feedback - read-only for admin, create for public"""
    queryset = Feedback.objects.all().order_by('-created_at')
    serializer_class = FeedbackSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'phone', 'message']
    
    def get_permissions(self):
        # Allow public POST, require auth for GET/list
        if self.action == 'create':
            return []
        return [IsAuthenticated()]


# Keep the old FeedbackCreateView for backward compatibility
class FeedbackCreateView(APIView):
    permission_classes = []  # Public endpoint
    
    def post(self, request):
        serializer = FeedbackSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Feedback submitted successfully!"}, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

## 4. Update URL Router

Update `dental/urls.py`:

```python
from django.urls import path, include
from rest_framework import routers
from .api_views import (
    AppointmentViewSet, 
    AppointmentHistoryViewSet, 
    DoctorViewSet, 
    FeedbackViewSet,
    FeedbackCreateView
)

router = routers.DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointments')
router.register(r'history', AppointmentHistoryViewSet, basename='history')
router.register(r'doctors', DoctorViewSet, basename='doctors')
router.register(r'feedback', FeedbackViewSet, basename='feedback')

urlpatterns = [
    path('api/', include(router.urls)),
    # Keep old feedback endpoint for backward compatibility
    path('api/feedback/create/', FeedbackCreateView.as_view(), name='feedback_create'),
]
```

## 5. Test the API

### Get JWT Token

```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Use Token to Access API

```bash
curl -X GET http://localhost:8000/api/appointments/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### Test Filtering

```bash
# Filter by status
curl -X GET "http://localhost:8000/api/appointments/?status=PENDING" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search
curl -X GET "http://localhost:8000/api/appointments/?search=john" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Date range
curl -X GET "http://localhost:8000/api/appointments/?date_from=2024-01-01&date_to=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 6. Import/Export Support (Optional)

The current setup uses `django-import-export` for the Django admin. To expose CSV import/export via API:

```python
# In api_views.py
from rest_framework.decorators import action
from django.http import HttpResponse
import csv
from io import StringIO

class AppointmentViewSet(viewsets.ModelViewSet):
    # ... existing code ...
    
    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export appointments as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="appointments.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Name', 'Email', 'Phone', 'Service', 'Date', 'Time', 'Status'])
        
        appointments = self.filter_queryset(self.get_queryset())
        for apt in appointments:
            writer.writerow([
                apt.id, apt.name, apt.email, apt.phone, 
                apt.service, apt.appointment_date, apt.appointment_time, apt.status
            ])
        
        return response
    
    @action(detail=False, methods=['post'])
    def import_csv(self, request):
        """Import appointments from CSV"""
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response({'error': 'No file provided'}, status=400)
        
        try:
            decoded_file = csv_file.read().decode('utf-8')
            io_string = StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            created = 0
            errors = []
            
            for row in reader:
                try:
                    Appointment.objects.create(
                        name=row.get('Name'),
                        email=row.get('Email'),
                        phone=row.get('Phone'),
                        service=row.get('Service'),
                        appointment_date=row.get('Date'),
                        appointment_time=row.get('Time'),
                        status='PENDING'
                    )
                    created += 1
                except Exception as e:
                    errors.append(f"Row error: {str(e)}")
            
            return Response({
                'message': f'Imported {created} appointments',
                'errors': errors
            })
        except Exception as e:
            return Response({'error': str(e)}, status=400)
```

## 7. Production Considerations

### Security

1. **Use HTTPS** in production
2. **Set strong SECRET_KEY**
3. **Configure CORS properly**:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "https://yourdomain.com",
   ]
   ```
4. **Use environment variables** for sensitive settings
5. **Enable CSRF protection** for session auth

### Performance

1. **Add database indexes**:
   ```python
   class Appointment(models.Model):
       # ... fields ...
       class Meta:
           indexes = [
               models.Index(fields=['status', 'appointment_date']),
               models.Index(fields=['created_at']),
           ]
   ```

2. **Use select_related/prefetch_related**:
   ```python
   queryset = Appointment.objects.select_related('doctor').all()
   ```

3. **Add caching** for frequently accessed data

### Monitoring

1. Add logging for API requests
2. Monitor authentication failures
3. Track API performance

## 8. Testing

Create tests in `dental/tests.py`:

```python
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from .models import Appointment

class AppointmentAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='admin', password='test123')
        self.client.force_authenticate(user=self.user)
        
    def test_list_appointments(self):
        response = self.client.get('/api/appointments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_filter_by_status(self):
        Appointment.objects.create(
            name='Test', email='test@test.com', 
            phone='1234567890', status='PENDING'
        )
        response = self.client.get('/api/appointments/?status=PENDING')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
```

Run tests:
```bash
python manage.py test dental
```

## Summary

After implementing these changes:

1. ✅ JWT authentication for Next.js admin
2. ✅ CORS configured for frontend
3. ✅ Pagination on all list endpoints
4. ✅ Filtering and search on appointments, doctors, history, feedback
5. ✅ Proper permissions (authenticated users only)
6. ✅ History tracking on status changes
7. ✅ CSV import/export (optional)

The Next.js admin panel will now have full API support!*-
