from rest_framework import serializers
from .models import Appointment, AppointmentHistory, Doctor, Feedback, Service
from django.contrib.auth import get_user_model
User = get_user_model()

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['created_at']


class AppointmentSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'name', 'email', 'phone', 'service', 'service_name',
            'appointment_date', 'appointment_time', 'message', 'status', 'admin_notes',
            'created_at', 'updated_at', 'doctor'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AppointmentHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentHistory
        fields = [
            'id', 'appointment', 'name', 'email', 'phone', 'service_name',
            'appointment_date', 'appointment_time', 'message', 'doctor_id',
            'doctor_name', 'previous_status', 'new_status', 'changed_by',
            'notes', 'timestamp', 'visited', 'service_id'
        ]
        read_only_fields = ['timestamp']


class DoctorSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    
    class Meta:
        model = Doctor
        fields = ['id', 'name', 'service', 'service_name', 'email', 'phone', 'active']


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'name', 'phone', 'message', 'created_at']
        read_only_fields = ['created_at']
        


class CalendarAppointmentSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    doctor = DoctorSerializer(read_only=True)
    patient = serializers.SerializerMethodField()
    patient_name = serializers.CharField(source='name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_duration = serializers.SerializerMethodField()
    start_time = serializers.SerializerMethodField()
    end_time = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_name', 'service', 'service_name', 'service_duration',
            'doctor', 'start_time', 'end_time', 'message', 'status', 'admin_notes',
            'created_at'
        ]

    def get_patient(self, obj):
        return {
            'id': obj.id,
            'name': obj.name or '',
            'phone': obj.phone or '',
            'email': obj.email or ''
        }

    def get_service_duration(self, obj):
        # Default to 60 minutes if no duration specified in service
        # You can add a duration field to Service model later if needed
        return 60

    def get_start_time(self, obj):
        if obj.appointment_date and obj.appointment_time:
            from datetime import datetime
            dt = datetime.combine(obj.appointment_date, obj.appointment_time)
            return dt.isoformat()
        return None

    def get_end_time(self, obj):
        if obj.appointment_date and obj.appointment_time:
            from datetime import datetime, timedelta
            dt = datetime.combine(obj.appointment_date, obj.appointment_time)
            # Add service duration (default 60 minutes)
            duration = self.get_service_duration(obj)
            dt = dt + timedelta(minutes=duration)
            return dt.isoformat()
        return None


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_staff', 'is_superuser', 'is_active',
            'date_joined', 'last_login', 'password'
        ]
        read_only_fields = ['date_joined', 'last_login']
        extra_kwargs = {
            'password': {'write_only': True}
        }
