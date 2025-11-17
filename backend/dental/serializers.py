from rest_framework import serializers
from .models import Appointment, AppointmentHistory, Doctor, Feedback, Service

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
            'notes', 'timestamp', 'visited'
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
