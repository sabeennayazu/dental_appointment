# Doctor Management System

## Overview
The dental appointment system now includes a complete doctor management system with the ability to add, view, and manage doctors from both the Next.js admin panel and Django admin panel.

## Features

### 1. Service Model (New)
- **Separate Service Model**: Services are now stored as independent database objects instead of hardcoded choices
- **Services Available**:
  - General Checkup
  - Periodontist
  - Orthodontics
  - Endodontist
  - Oral Surgery
  - Prosthodontist
- **Expandable**: New services can be added from Django admin panel

### 2. Doctor Management from Next.js Admin Panel

#### Adding a Doctor
1. Navigate to Admin Dashboard → Doctors
2. Click the "Add Doctors" button (circular button with + icon in top-right)
3. A modal form will appear with the following fields:
   - **Name** (required): Doctor's full name
   - **Service** (required): Select from available services
   - **Email** (required): Doctor's email address
   - **Phone** (optional): Doctor's phone number
   - **Status**: Toggle switch to set Active/Inactive status

4. Click "Save Doctor" to add the doctor
5. The doctor will immediately appear in the Django admin panel

#### Viewing Doctors
- All doctors are displayed in a table with:
  - Doctor ID
  - Name
  - Service specialty
  - Email and Phone contact information
  - Active/Inactive status badge
  - View details icon

#### Filtering & Searching
- **Search**: Filter by doctor name, email, or phone number
- **Service Filter**: Filter doctors by their service specialty

### 3. Doctor Management from Django Admin Panel

#### Adding a Doctor
1. Navigate to Django Admin → Doctors
2. Click "Add Doctor"
3. Fill in the form:
   - Name
   - Service (dropdown selection)
   - Email
   - Phone
   - Active checkbox
4. Save

#### Viewing & Editing
- All doctors are displayed in a table
- Click on any doctor to view/edit details
- Changes are immediately visible in Next.js admin

### 4. Database Schema Changes

#### New Service Model
```python
class Service(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### Updated Doctor Model
```python
class Doctor(models.Model):
    name = models.CharField(max_length=255)
    service = models.ForeignKey(Service, on_delete=models.PROTECT)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    active = models.BooleanField(default=True)
```

### 5. API Endpoints

#### Services API
- **List Services**: `GET /api/services/`
- **Create Service**: `POST /api/services/`
- **Get Service**: `GET /api/services/{id}/`
- **Update Service**: `PUT /api/services/{id}/`
- **Delete Service**: `DELETE /api/services/{id}/`

#### Doctors API
- **List Doctors**: `GET /api/doctors/`
- **Create Doctor**: `POST /api/doctors/`
  ```json
  {
    "name": "Dr. John Doe",
    "service": 1,
    "email": "john@example.com",
    "phone": "+1234567890",
    "active": true
  }
  ```
- **Get Doctor**: `GET /api/doctors/{id}/`
- **Update Doctor**: `PUT /api/doctors/{id}/`
- **Delete Doctor**: `DELETE /api/doctors/{id}/`

### 6. Booking Flow Updates

When a patient books an appointment:
1. They select a **Service** (fetched from Service model)
2. System automatically filters available doctors by selected service
3. They optionally select a **Doctor** (recommended for that service)
4. Appointment is created with the service ID

### 7. Bi-Directional Sync

**Changes made in Next.js admin are immediately visible in Django admin:**
- Add a doctor in Next.js → See it in Django admin
- Add a doctor in Django admin → See it in Next.js admin
- Edit a doctor in either panel → Changes sync automatically

**Changes made in Django admin are immediately visible in Next.js admin:**
- No additional action needed - APIs are called in real-time

### 8. Visit Tracking

The system now has improved visit tracking for appointments:
- **AppointmentHistory Model**: Includes a `visited` field (instead of `status`)
- **Status Options**: 'unvisited' or 'visited'
- **Admin Action**: Mark appointments as "Visited" from Next.js admin history page
- **Django Sync**: Changes to visited status are reflected in Django admin

### 9. Migration Information

The system uses Django migrations to manage schema changes:
- **Migration 0008**: Creates Service model and updates related models
- **Migration 0009**: Populates default services (automatic)

**Data Integrity**:
- Doctor.service now requires a valid Service (PROTECT on delete)
- Appointment.service is optional and NULLs on service deletion
- AppointmentHistory keeps a snapshot of service_name

## Usage Example

### Adding a Doctor from Next.js Admin
```typescript
// Form data structure
{
  name: "Dr. Sarah Johnson",
  service: 2,  // Service ID for "Periodontist"
  email: "sarah@dentist.com",
  phone: "+1-555-0123",
  active: true
}

// API call
POST http://localhost:8000/api/doctors/
Content-Type: application/json
{...formData}
```

### Booking Appointment with Service
```typescript
// Patient books appointment
{
  name: "John Patient",
  email: "patient@example.com",
  phone: "+1-555-9999",
  service: 2,  // Service ID (instead of service name)
  doctor: 3,   // Optional: Doctor ID
  appointment_date: "2025-11-25",
  appointment_time: "14:30",
  message: "I have gum pain"
}
```

## Troubleshooting

### Services not showing in dropdown
- Ensure migrations have been applied: `python manage.py migrate`
- Check that services exist: `python manage.py shell -c "from dental.models import Service; print(Service.objects.all())"`

### Doctor creation fails
- Verify service ID is valid
- Check email format
- Ensure required fields are filled

### Changes not syncing
- Clear browser cache
- Restart Django server
- Verify API endpoints are accessible

## Technical Details

### File Changes
- **Backend Models**: `backend/dental/models.py` - Added Service model, updated Doctor and Appointment
- **Backend Admin**: `backend/dental/admin.py` - Added ServiceAdmin, updated DoctorAdmin
- **Backend Serializers**: `backend/dental/serializers.py` - Added ServiceSerializer, updated others
- **Backend URLs**: `backend/dental/urls.py` - Registered ServiceViewSet
- **Frontend Components**: `frontend/src/app/admin/doctors/page.tsx` - Added doctor creation modal
- **Frontend Types**: `frontend/src/lib/types.ts` - Updated interfaces

### Dependencies
- Django 5.2.6
- Django REST Framework
- Next.js 15.5.4
- React 18+

## Future Enhancements
- Bulk doctor import
- Doctor availability calendar
- Service pricing
- Doctor ratings and reviews
- Automated doctor assignment
