from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework import generics
from rest_framework.generics import RetrieveAPIView
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Appointment, AppointmentHistory, Doctor, Feedback, Service
from .serializers import AppointmentSerializer, AppointmentHistorySerializer, DoctorSerializer, FeedbackSerializer, ServiceSerializer, UserSerializer, CalendarAppointmentSerializer
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
        
        # Validate max 3 appointments per hour before creating
        validated_data = serializer.validated_data
        doctor_id = validated_data.get('doctor')
        appointment_date = validated_data.get('appointment_date')
        appointment_time = validated_data.get('appointment_time')
        
        if doctor_id and appointment_date and appointment_time:
            # Extract hour from appointment_time (format: HH:MM)
            hour = int(appointment_time.split(':')[0]) if ':' in str(appointment_time) else 0
            
            # Count existing appointments for this doctor, date, and hour
            from django.db.models import Q
            from datetime import timedelta
            
            # Count active appointments in the same hour
            existing_count = Appointment.objects.filter(
                doctor_id=doctor_id,
                appointment_date=appointment_date,
                appointment_time__startswith=f"{hour:02d}:"
            ).count()
            
            if existing_count >= 3:
                return Response(
                    {'error': 'Maximum capacity reached. You cannot add more than 3 appointments in this hour.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        """Handle PATCH and PUT requests for partial or full updates"""
        # Force partial=True for PATCH requests to allow partial updates
        partial = request.method == 'PATCH'
        kwargs['partial'] = partial
        
        instance = self.get_object()
        
        # Store old status before any changes
        old_status = instance.status
        new_status = request.data.get('status', old_status)
        
        try:
            # Process all allowed fields with partial=True for PATCH
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate max 3 appointments per hour if date/time/doctor is being changed
            validated_data = serializer.validated_data
            doctor_id = validated_data.get('doctor', instance.doctor_id)
            appointment_date = validated_data.get('appointment_date', instance.appointment_date)
            appointment_time = validated_data.get('appointment_time', instance.appointment_time)
            
            # Check if any relevant field is changing
            if doctor_id and appointment_date and appointment_time:
                # Extract hour from appointment_time (format: HH:MM)
                hour = int(str(appointment_time).split(':')[0]) if appointment_time else 0
                
                # Count existing appointments for this doctor, date, and hour (excluding current appointment)
                existing_count = Appointment.objects.filter(
                    doctor_id=doctor_id,
                    appointment_date=appointment_date,
                    appointment_time__startswith=f"{hour:02d}:"
                ).exclude(id=instance.id).count()
                
                if existing_count >= 3:
                    return Response(
                        {'detail': 'You cannot add more than 3 appointments in this hour.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # ✅ UPDATE THE APPOINTMENT FIRST with all changes
            self.perform_update(serializer)
            
            # ✅ Create history entry if status is changing
            if old_status != new_status:
                # Get the updated instance to capture new data
                instance.refresh_from_db()
                doc = instance.doctor
                
                try:
                    # Create history entry with UPDATED data (after changes)
                    history_entry = AppointmentHistory.objects.create(
                        appointment=instance,
                        name=instance.name,
                        email=instance.email,
                        phone=instance.phone,
                        service_name=instance.service.name if instance.service else None,
                        service_id=instance.service.id if instance.service else None,
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
                
                except Exception as e:
                    import traceback
                    error_msg = str(e)
                    traceback.print_exc()
                    print(f"Error creating history entry: {error_msg}")
                    return Response(
                        {'detail': f'Failed to create history entry: {error_msg}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Return updated data
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            error_msg = str(e)
            traceback.print_exc()
            print(f"Error updating appointment: {error_msg}")
            return Response(
                {'detail': f'Failed to update appointment: {error_msg}'},
                status=status.HTTP_400_BAD_REQUEST
            )

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

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Return appointments formatted for calendar view. Excludes rejected appointments."""
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            doctor_id = request.query_params.get('doctor_id')

            if not start_date or not end_date:
                return Response(
                    {'error': 'start_date and end_date are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Filter appointments by date range - exclude rejected appointments globally
            appointments = Appointment.objects.filter(
                appointment_date__gte=start_date,
                appointment_date__lte=end_date
            ).exclude(status='REJECTED')

            # Filter by doctor if specified
            if doctor_id:
                appointments = appointments.filter(doctor_id=doctor_id)

            # Use calendar serializer
            serializer = CalendarAppointmentSerializer(appointments, many=True)
            return Response(serializer.data)

        except Exception as exc:
            return Response({'error': str(exc)}, status=500)


class AppointmentHistoryViewSet(viewsets.ModelViewSet):
    queryset = AppointmentHistory.objects.all().order_by('-timestamp')
    serializer_class = AppointmentHistorySerializer

    def get_queryset(self):
        """Filter history by phone number, date range, and doctor_id if provided. Excludes rejected appointments for calendar views."""
        qs = super().get_queryset()
        
        # Filter by phone number if provided
        phone = self.request.query_params.get('phone', None)
        if phone:
            import re
            # Normalize to digits only for flexible matching
            query_digits = re.sub(r"\D", "", str(phone))
            if query_digits:
                # Filter records where phone contains the search digits
                qs = qs.filter(phone__icontains=query_digits)
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date:
            qs = qs.filter(appointment_date__gte=start_date)
        if end_date:
            qs = qs.filter(appointment_date__lte=end_date)
        
        # Filter by doctor_id if provided
        doctor_id = self.request.query_params.get('doctor_id', None)
        if doctor_id:
            try:
                qs = qs.filter(doctor_id=int(doctor_id))
            except (ValueError, TypeError):
                pass  # Ignore invalid doctor_id values
        
        # Exclude rejected appointments when used for calendar views (when doctor_id is provided)
        # This prevents rejected appointments from appearing in calendar
        if doctor_id:
            qs = qs.exclude(new_status='REJECTED')
        
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
