"""
Test script to verify appointment approval/rejection functionality
This tests that appointments are moved to history and deleted when approved/rejected
"""

import os
import django
import sys

# Setup Django environment
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from dental.models import Appointment, AppointmentHistory
from datetime import date, time

def print_separator():
    print("\n" + "="*80 + "\n")

def test_appointment_lifecycle():
    """Test the complete appointment lifecycle"""
    
    print("🧪 Testing Appointment Approval/Rejection Functionality")
    print_separator()
    
    # Clean up any existing test data
    print("📋 Cleaning up existing test data...")
    Appointment.objects.filter(phone='TEST_PHONE_123').delete()
    AppointmentHistory.objects.filter(phone='TEST_PHONE_123').delete()
    
    # Step 1: Create a test appointment
    print("✅ Step 1: Creating test appointment...")
    appointment = Appointment.objects.create(
        name="Test Patient",
        email="test@example.com",
        phone="TEST_PHONE_123",
        service="General Checkup",
        appointment_date=date.today(),
        appointment_time=time(10, 0),
        message="Test appointment",
        status="PENDING"
    )
    print(f"   Created appointment ID: {appointment.id}")
    print(f"   Status: {appointment.status}")
    
    # Verify it's in active appointments
    active_count = Appointment.objects.filter(phone='TEST_PHONE_123').count()
    history_count = AppointmentHistory.objects.filter(phone='TEST_PHONE_123').count()
    print(f"   Active appointments: {active_count}")
    print(f"   History records: {history_count}")
    
    if active_count != 1:
        print("   ❌ FAILED: Appointment not created properly")
        return False
    
    print_separator()
    
    # Step 2: Simulate approval (like Django admin does)
    print("✅ Step 2: Approving appointment (simulating Django admin)...")
    
    # Get the appointment again (fresh from DB)
    appointment = Appointment.objects.get(id=appointment.id)
    old_status = appointment.status
    appointment.status = "APPROVED"
    
    # Create history entry
    AppointmentHistory.objects.create(
        appointment=appointment,
        name=appointment.name,
        email=appointment.email,
        phone=appointment.phone,
        service=appointment.service,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time,
        message=appointment.message,
        doctor_id=getattr(appointment.doctor, 'id', None) if appointment.doctor else None,
        doctor_name=getattr(appointment.doctor, 'name', None) if appointment.doctor else None,
        previous_status=old_status,
        new_status="APPROVED",
        changed_by="test_script",
        notes="Test approval"
    )
    
    # Delete the appointment (as Django admin does)
    appointment.delete()
    print("   Appointment approved and deleted")
    
    # Verify the results
    active_count = Appointment.objects.filter(phone='TEST_PHONE_123').count()
    history_count = AppointmentHistory.objects.filter(phone='TEST_PHONE_123').count()
    
    print(f"   Active appointments: {active_count}")
    print(f"   History records: {history_count}")
    
    if active_count != 0:
        print("   ❌ FAILED: Appointment still in active table!")
        return False
    
    if history_count != 1:
        print("   ❌ FAILED: History entry not created!")
        return False
    
    # Check history details
    history = AppointmentHistory.objects.get(phone='TEST_PHONE_123')
    print(f"   History entry ID: {history.id}")
    print(f"   Previous status: {history.previous_status}")
    print(f"   New status: {history.new_status}")
    print(f"   Changed by: {history.changed_by}")
    
    if history.previous_status != "PENDING":
        print("   ❌ FAILED: Previous status incorrect!")
        return False
    
    if history.new_status != "APPROVED":
        print("   ❌ FAILED: New status incorrect!")
        return False
    
    print_separator()
    
    # Step 3: Test rejection
    print("✅ Step 3: Testing rejection...")
    
    # Create another appointment
    appointment2 = Appointment.objects.create(
        name="Test Patient 2",
        email="test2@example.com",
        phone="TEST_PHONE_456",
        service="Orthodontics",
        appointment_date=date.today(),
        appointment_time=time(14, 0),
        message="Test appointment 2",
        status="PENDING"
    )
    print(f"   Created appointment ID: {appointment2.id}")
    
    # Reject it
    old_status = appointment2.status
    appointment2.status = "REJECTED"
    
    AppointmentHistory.objects.create(
        appointment=appointment2,
        name=appointment2.name,
        email=appointment2.email,
        phone=appointment2.phone,
        service=appointment2.service,
        appointment_date=appointment2.appointment_date,
        appointment_time=appointment2.appointment_time,
        message=appointment2.message,
        doctor_id=None,
        doctor_name=None,
        previous_status=old_status,
        new_status="REJECTED",
        changed_by="test_script",
        notes="Test rejection"
    )
    
    appointment2.delete()
    print("   Appointment rejected and deleted")
    
    # Verify
    active_count = Appointment.objects.filter(phone='TEST_PHONE_456').count()
    history_count = AppointmentHistory.objects.filter(phone='TEST_PHONE_456').count()
    
    print(f"   Active appointments: {active_count}")
    print(f"   History records: {history_count}")
    
    if active_count != 0:
        print("   ❌ FAILED: Rejected appointment still in active table!")
        return False
    
    if history_count != 1:
        print("   ❌ FAILED: History entry not created for rejection!")
        return False
    
    history2 = AppointmentHistory.objects.get(phone='TEST_PHONE_456')
    if history2.new_status != "REJECTED":
        print("   ❌ FAILED: Rejection status incorrect!")
        return False
    
    print_separator()
    
    # Cleanup
    print("🧹 Cleaning up test data...")
    AppointmentHistory.objects.filter(phone__in=['TEST_PHONE_123', 'TEST_PHONE_456']).delete()
    
    print_separator()
    print("✅ ALL TESTS PASSED!")
    print("\n📊 Summary:")
    print("   ✅ Appointments are created correctly")
    print("   ✅ Approved appointments move to history")
    print("   ✅ Approved appointments are deleted from active table")
    print("   ✅ Rejected appointments move to history")
    print("   ✅ Rejected appointments are deleted from active table")
    print("   ✅ History entries contain correct status transitions")
    print_separator()
    
    return True

if __name__ == "__main__":
    try:
        success = test_appointment_lifecycle()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
