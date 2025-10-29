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
        try:
            phone = request.query_params.get('phone')
            if not phone:
                return Response({'detail': 'phone query param required'}, status=400)

            query_digits = re.sub(r"\D", "", str(phone))
            results = []

            # Search active appointments (exact normalized match)
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
                    # skip malformed appointment entries
                    continue

            # Search appointment history snapshots (some rows may lack phone)
            for h in AppointmentHistory.objects.all().order_by('-timestamp'):
                try:
                    raw = getattr(h, 'phone', None)
                    if not raw:
                        # gracefully skip history entries without phone
                        continue
                    h_digits = re.sub(r"\D", "", str(raw))
                    if h_digits == query_digits:
                        serialized = AppointmentHistorySerializer(h).data
                        serialized['_source'] = 'history'
                        results.append(serialized)
                except Exception:
                    # skip malformed history entries
                    continue

            if not results:
                return Response({'message': 'No appointments found'}, status=404)

            # Return the list of serialized matches (most recent first already by queryset ordering)
            return Response(results)
        except Exception as exc:
            # Always return JSON on unexpected failures
            return Response({'error': str(exc)}, status=500)


class AppointmentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AppointmentHistory.objects.all().order_by('-timestamp')
    serializer_class = AppointmentHistorySerializer


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