from rest_framework import serializers
from .models import Appointment, AppointmentHistory, Doctor, Feedback


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'id', 'name', 'email', 'phone', 'service', 'appointment_date', 'appointment_time', 'message',
            'status', 'admin_notes', 'created_at', 'updated_at', 'doctor'
        ]
        # status is normally managed by admin; keep created/updated as read-only
        read_only_fields = ['created_at', 'updated_at']


class AppointmentHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentHistory
        fields = [
            'id', 'appointment', 'name', 'email', 'phone', 'service', 'appointment_date', 'appointment_time', 'message',
            'doctor_id', 'doctor_name', 'previous_status', 'new_status', 'changed_by', 'notes', 'timestamp'
        ]


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ['id', 'name', 'service', 'email', 'phone', 'active']

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'name', 'phone', 'message', 'created_at']
        read_only_fields = ['created_at']
