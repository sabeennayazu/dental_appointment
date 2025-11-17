from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone


class Service(models.Model):
	"""Represents a dental service offered."""
	name = models.CharField(max_length=255, unique=True)
	description = models.TextField(blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['name']

	def __str__(self):
		return self.name


class Appointment(models.Model):
	STATUS_CHOICES = [
		('PENDING', 'Pending'),
		('APPROVED', 'Approved'),
		('REJECTED', 'Rejected'),
	]

	name = models.CharField(max_length=255, blank=True, null=True)
	email = models.EmailField(blank=True, null=True)
	phone = models.CharField(max_length=50, blank=True, null=True)
	service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, related_name='appointments')
	# link to a Doctor (optional)
	doctor = models.ForeignKey('Doctor', on_delete=models.SET_NULL, null=True, blank=True, related_name='appointments')
	appointment_date = models.DateField(blank=True, null=True, default=timezone.now)
	appointment_time = models.TimeField(blank=True, null=True)
	message = models.TextField(blank=True, null=True)

	# internal fields
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
	admin_notes = models.TextField(blank=True)

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"{self.name} — {self.phone} — {self.appointment_date}"


class AppointmentHistory(models.Model):
	# keep an optional reference to the original appointment but also snapshot all relevant fields
	appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='history')

	# snapshot of the appointment at the time of approval/rejection
	name = models.CharField(max_length=255, blank=True, null=True)
	email = models.EmailField(blank=True, null=True)
	phone = models.CharField(max_length=50, blank=True, null=True)
	service_name = models.CharField(max_length=255, blank=True, null=True)  # snapshot of service name
	appointment_date = models.DateField(blank=True, null=True)
	appointment_time = models.TimeField(blank=True, null=True)
	message = models.TextField(blank=True, null=True)

	# snapshot of associated doctor (store id and name if available)
	doctor_id = models.IntegerField(blank=True, null=True)
	doctor_name = models.CharField(max_length=255, blank=True, null=True)

	previous_status = models.CharField(max_length=20)
	new_status = models.CharField(max_length=20)
	changed_by = models.CharField(max_length=255, blank=True)
	notes = models.TextField(blank=True)
	timestamp = models.DateTimeField(auto_now_add=True)

	# admin usage: whether the patient actually visited after the appointment (unvisited/visited)
	STATUS_CHOICES = [
		('unvisited', 'Unvisited'),
		('visited', 'Visited'),
	]
	visited = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unvisited')

	def __str__(self):
		return f"History for {self.name} ({self.phone}) at {self.timestamp}"


class Doctor(models.Model):
	name = models.CharField(max_length=255)
	# link to a Service (one doctor, one service specialty)
	service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name='doctors')
	email = models.EmailField(blank=True, null=True)
	phone = models.CharField(max_length=50, blank=True, null=True)
	active = models.BooleanField(default=True)

	def __str__(self):
		return f"{self.name} — {self.service.name}"

class Feedback(models.Model):
	name = models.CharField(max_length=255, blank=True, null=True)
	phone = models.CharField(max_length=50, blank=True, null=True)
	message = models.TextField(blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Feedback from {self.name} ({self.phone}) at {self.created_at}"
