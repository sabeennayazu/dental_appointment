from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Appointment, AppointmentHistory, Doctor, Feedback
from .serializers import AppointmentSerializer, AppointmentHistorySerializer, DoctorSerializer, FeedbackSerializer


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
        # prevent editing of user-provided fields via API (only allow status and admin_notes)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        allowed = {'status', 'admin_notes'}
        data = {k: v for k, v in request.data.items() if k in allowed}
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        # record history if status changes
        old_status = instance.status
        self.perform_update(serializer)
        if 'status' in data and old_status != data.get('status'):
            # snapshot doctor info if present
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

    @action(detail=True, methods=['post'])
    def mark_visited(self, request, pk=None):
        """Mark a history entry as visited (patient arrived)."""
        obj = get_object_or_404(AppointmentHistory, pk=pk)
        obj.status = 'visited'
        obj.save()
        return Response(self.get_serializer(obj).data)


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.filter(active=True).order_by('name')
    serializer_class = DoctorSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        service = self.request.query_params.get('service')
        if service:
            qs = qs.filter(service=service)
        return qs

class FeedbackCreateView(APIView):
    def post(self, request):
        serializer = FeedbackSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Feedback submitted successfully!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)