from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework import generics
from rest_framework.generics import RetrieveAPIView
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Appointment, AppointmentHistory, Doctor, Feedback, Service
from .serializers import AppointmentSerializer, AppointmentHistorySerializer, DoctorSerializer, FeedbackSerializer, ServiceSerializer, UserSerializer
from django.contrib.auth import get_user_model
import re

User = get_user_model()


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().order_by('-created_at')
    serializer_class = AppointmentSerializer

    def create(self, request, *args, **kwargs):
        # new appointments always start with PENDING
        data = request.data.copy()
        data['status'] = 'PENDING'
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        # Allow editing of appointment details
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Store old status before any changes
        old_status = instance.status
        new_status = request.data.get('status', old_status)
        
        # Process all allowed fields
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # ✅ UPDATE THE APPOINTMENT FIRST with all changes
        self.perform_update(serializer)
        
        # ✅ Create history entry if status is changing
        if old_status != new_status:
            # Get the updated instance to capture new data
            instance.refresh_from_db()
            doc = instance.doctor
            
            # Create history entry with UPDATED data (after changes)
            history_entry = AppointmentHistory.objects.create(
                appointment=instance,
                name=instance.name,
                email=instance.email,
                phone=instance.phone,
                service_name=instance.service.name if instance.service else None,
                appointment_date=instance.appointment_date,
                appointment_time=instance.appointment_time,
                message=instance.message,
                doctor_id=getattr(doc, 'id', None),
                doctor_name=getattr(doc, 'name', None),
                previous_status=old_status,
                new_status=new_status,
                changed_by=str(request.user) if request.user.is_authenticated else 'api',
                notes=instance.admin_notes or ''
            )
            
            # ✅ MATCH Django admin behavior: delete appointment if APPROVED or REJECTED
            if new_status in ('APPROVED', 'REJECTED'):
                # Prepare response data with updated instance info
                response_data = {
                    'id': instance.id,
                    'name': instance.name,
                    'email': instance.email,
                    'phone': instance.phone,
                    'status': new_status,
                    'deleted': True,
                    'moved_to_history': True,
                    'history_id': history_entry.id,
                    'message': f'Appointment {new_status.lower()} and moved to history'
                }
                # Delete the appointment
                instance.delete()
                return Response(response_data, status=status.HTTP_200_OK)
        
        # Return updated data
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_phone(self, request):
        import re
        from datetime import datetime
        from django.db.models import Q

        try:
            phone = request.query_params.get('phone', '').strip()
            if not phone:
                return Response([], status=200)

            # Normalize query to digits only
            query_digits = re.sub(r"\D", "", str(phone))
            if not query_digits:
                return Response([], status=200)

            results = []

            # Search active appointments using partial match
            appointments = Appointment.objects.all().order_by('-created_at')
            for appointment in appointments:
                try:
                    if not appointment.phone:
                        continue
                    normalized = re.sub(r"\D", "", str(appointment.phone))
                    if normalized.startswith(query_digits):
                        data = AppointmentSerializer(appointment).data
                        data['_source'] = 'active'
                        data['_sort_timestamp'] = appointment.created_at.isoformat()
                        results.append(data)
                except Exception:
                    continue

            # Search appointment history using partial match
            history = AppointmentHistory.objects.all().order_by('-timestamp')
            for entry in history:
                try:
                    if not entry.phone:
                        continue
                    normalized = re.sub(r"\D", "", str(entry.phone))
                    if normalized.startswith(query_digits):
                        data = AppointmentHistorySerializer(entry).data
                        data['_source'] = 'history'
                        data['_sort_timestamp'] = entry.timestamp.isoformat()
                        results.append(data)
                except Exception:
                    continue

            # Sort all results by timestamp (most recent first)
            results.sort(key=lambda x: x.get('_sort_timestamp', ''), reverse=True)

            # Remove temporary sort field
            for result in results:
                result.pop('_sort_timestamp', None)

            return Response(results, status=200)

        except Exception as exc:
            return Response({'error': str(exc)}, status=200)
        except Exception as exc:
            # Always return JSON on unexpected failures
            return Response({'error': str(exc)}, status=500)


class AppointmentHistoryViewSet(viewsets.ModelViewSet):
    queryset = AppointmentHistory.objects.all().order_by('-timestamp')
    serializer_class = AppointmentHistorySerializer

    def get_queryset(self):
        """Filter history by phone number if provided."""
        qs = super().get_queryset()
        phone = self.request.query_params.get('phone', None)
        if phone:
            import re
            # Normalize to digits only for flexible matching
            query_digits = re.sub(r"\D", "", str(phone))
            if query_digits:
                # Filter records where phone contains the search digits
                qs = qs.filter(phone__icontains=query_digits)
        return qs

    @action(detail=True, methods=['post'])
    def mark_visited(self, request, pk=None):
        """Mark a history entry as visited (patient arrived)."""
        obj = get_object_or_404(AppointmentHistory, pk=pk)
        obj.visited = 'visited'
        obj.save()
        return Response(self.get_serializer(obj).data)


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all().order_by('name')
    serializer_class = ServiceSerializer


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.order_by('name')
    serializer_class = DoctorSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        service = self.request.query_params.get('service')
        if service:
            qs = qs.filter(service=service)
        return qs
class FeedbackListCreateView(generics.ListCreateAPIView):
    queryset = Feedback.objects.all().order_by('-created_at')
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        phone = self.request.query_params.get('phone', None)

        if phone:
            query_digits = re.sub(r"\D", "", str(phone))
            if query_digits:
                qs = qs.filter(phone__icontains=query_digits)

        return qs


class FeedbackDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.AllowAny]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    
    def get_permissions(self):
        """
        Allow unauthenticated list/retrieve.
        Restrict create, update, delete to admins only.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only admins can create, update, or delete users
            return [permissions.IsAdminUser()]
        # Allow unauthenticated access to list and retrieve endpoints
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        """
        Return all users (read-only access for all).
        Write operations are restricted to admins by get_permissions().
        """
        return User.objects.all().order_by('-date_joined')
    
    def create(self, request, *args, **kwargs):
        """Handle password hashing when creating users."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Hash the password before saving
        user = User(**serializer.validated_data)
        password = request.data.get('password')
        if password:
            user.set_password(password)
        user.save()
        
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """Handle password hashing when updating users."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Update fields
        for attr, value in serializer.validated_data.items():
            setattr(instance, attr, value)
        
        # Hash password if provided
        password = request.data.get('password')
        if password:
            instance.set_password(password)
        
        instance.save()
        return Response(UserSerializer(instance).data)
  