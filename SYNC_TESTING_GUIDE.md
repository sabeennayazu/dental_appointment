# 🧪 Django-Next.js Sync Testing Guide

## Quick Start

```powershell
# Run automated test
powershell -ExecutionPolicy Bypass -File test_sync.ps1
```

---

## Manual Testing Scenarios

### Scenario 1: Status Update from Next.js Admin → Django Admin

**Objective:** Verify that approving an appointment in Next.js admin reflects in Django admin

**Steps:**
1. **Start both servers:**
   ```powershell
   # Terminal 1: Django
   cd backend
   venv\Scripts\python.exe manage.py runserver 8000
   
   # Terminal 2: Next.js
   cd frontend
   npm run dev
   ```

2. **Open both admin panels:**
   - Django: http://localhost:8000/admin/
   - Next.js: http://localhost:3000/admin/appointments

3. **Create test appointment in Django admin:**
   - Click "Add Appointment"
   - Fill in:
     - Name: "Test Patient"
     - Phone: "9999999999"
     - Service: "General Checkup"
     - Date: Tomorrow
   - Save

4. **Verify in Next.js admin:**
   - Refresh: http://localhost:3000/admin/appointments
   - ✅ Should see "Test Patient" appointment
   - ✅ Status should be "PENDING"

5. **Approve in Next.js admin:**
   - Click on the appointment
   - Click "Approve" button
   - Confirm the action

6. **Verify in Django admin:**
   - Refresh: http://localhost:8000/admin/dental/appointment/
   - ✅ "Test Patient" should be GONE from active list
   - Go to: http://localhost:8000/admin/dental/appointmenthistory/
   - ✅ Should see history entry: PENDING → APPROVED

**Expected Result:** ✅ Appointment moves from active to history in BOTH admin panels

---

### Scenario 2: Status Update from Django Admin → Next.js Admin

**Objective:** Verify that rejecting an appointment in Django admin reflects in Next.js admin

**Steps:**
1. **Create test appointment in Next.js admin:**
   - Go to: http://localhost:3000/admin/appointments
   - Click "New Appointment" (if available) or use Django admin
   - Create appointment with phone: "8888888888"

2. **Verify it appears in Django admin:**
   - Go to: http://localhost:8000/admin/dental/appointment/
   - ✅ Should see the new appointment

3. **Reject in Django admin:**
   - Click on the appointment
   - Click "Disapprove" button
   - Save

4. **Verify in Next.js admin:**
   - Refresh: http://localhost:3000/admin/appointments
   - ✅ Appointment should be GONE from active list
   - Go to: http://localhost:3000/admin/history
   - ✅ Should see history entry with REJECTED status

**Expected Result:** ✅ Appointment moves from active to history in BOTH admin panels

---

### Scenario 3: Patient Phone Search (No Duplicates)

**Objective:** Verify that patient status check returns single, correct record

**Steps:**
1. **Create and approve appointment:**
   - In Django admin, create appointment:
     - Name: "John Doe"
     - Phone: "5551234567"
     - Service: "Orthodontics"
   - Approve it immediately

2. **Check patient status page:**
   - Go to: http://localhost:3000/status
   - Enter phone: "5551234567"
   - Click "Check Status"

3. **Verify results:**
   - ✅ Should see ONLY ONE record
   - ✅ Status should show "APPROVED"
   - ✅ Should show in history section
   - ❌ Should NOT show duplicate entries

4. **Create another appointment with same phone:**
   - In Django admin, create new appointment:
     - Name: "John Doe"
     - Phone: "5551234567"
     - Service: "General Checkup"
   - Leave as PENDING

5. **Check patient status again:**
   - Refresh: http://localhost:3000/status
   - Enter phone: "5551234567"
   - Click "Check Status"

6. **Verify results:**
   - ✅ Should see TWO records:
     1. PENDING appointment (active)
     2. APPROVED appointment (history)
   - ✅ No duplicates
   - ✅ Both records are distinct

**Expected Result:** ✅ Patient sees all their appointments without duplicates

---

### Scenario 4: Real-time Data Consistency

**Objective:** Verify that changes are immediately reflected across panels

**Steps:**
1. **Open three browser tabs:**
   - Tab 1: Django admin appointments
   - Tab 2: Next.js admin appointments
   - Tab 3: Patient status page

2. **Create appointment in Tab 1 (Django):**
   - Add new appointment with phone: "7777777777"
   - Save

3. **Immediately check Tab 2 (Next.js):**
   - Refresh the page
   - ✅ New appointment should appear

4. **Approve in Tab 2 (Next.js):**
   - Click on the appointment
   - Approve it

5. **Immediately check Tab 1 (Django):**
   - Refresh appointments page
   - ✅ Appointment should be gone
   - Check history page
   - ✅ History entry should exist

6. **Check Tab 3 (Patient status):**
   - Enter phone: "7777777777"
   - ✅ Should show APPROVED status
   - ✅ No duplicate entries

**Expected Result:** ✅ All three interfaces show consistent data

---

### Scenario 5: Concurrent Updates

**Objective:** Test what happens when both admins update simultaneously

**Steps:**
1. **Create test appointment:**
   - Phone: "6666666666"
   - Status: PENDING

2. **Open appointment in both admins:**
   - Django: http://localhost:8000/admin/dental/appointment/{id}/
   - Next.js: http://localhost:3000/admin/appointments/{id}

3. **Update notes in Django admin:**
   - Add admin notes: "Called patient"
   - Save

4. **Immediately update status in Next.js:**
   - Approve the appointment
   - Save

5. **Verify final state:**
   - ✅ Appointment should be in history
   - ✅ Status should be APPROVED
   - ✅ Notes should be preserved (if possible)

**Expected Result:** ✅ Last write wins, no data corruption

---

## API Endpoint Testing

### Test 1: GET Appointments
```powershell
# Direct Django
curl http://localhost:8000/api/appointments/

# Through Next.js proxy
curl http://localhost:3000/api/appointments/

# Should return same data
```

### Test 2: PATCH Appointment
```powershell
# Update status through proxy
curl -X PATCH http://localhost:3000/api/appointments/1/ `
  -H "Content-Type: application/json" `
  -d '{"status": "APPROVED", "admin_notes": "Test approval"}'

# Verify in Django
curl http://localhost:8000/api/history/
```

### Test 3: Phone Search
```powershell
# Search by phone
curl "http://localhost:8000/api/appointments/by_phone/?phone=9999999999"

# Should return both active and history records
```

---

## Database Verification

### Check Active Appointments
```python
# Django shell
python manage.py shell

from dental.models import Appointment
print(f"Active appointments: {Appointment.objects.count()}")
for appt in Appointment.objects.all():
    print(f"  - {appt.name} ({appt.phone}): {appt.status}")
```

### Check History
```python
from dental.models import AppointmentHistory
print(f"History records: {AppointmentHistory.objects.count()}")
for hist in AppointmentHistory.objects.all()[:5]:
    print(f"  - {hist.name}: {hist.previous_status} → {hist.new_status}")
```

---

## Common Issues & Solutions

### Issue 1: Appointment not disappearing after approval

**Symptoms:**
- Approved appointment still shows in active list
- History entry created but appointment not deleted

**Solution:**
```powershell
# 1. Restart Django backend
cd backend
venv\Scripts\python.exe manage.py runserver 8000

# 2. Clear browser cache
# Press Ctrl+Shift+Delete

# 3. Hard refresh
# Press Ctrl+Shift+R
```

### Issue 2: Duplicate records in patient search

**Symptoms:**
- Patient sees same appointment twice
- One from active, one from history

**Solution:**
```powershell
# 1. Check if appointment was actually deleted
python manage.py shell
>>> from dental.models import Appointment
>>> Appointment.objects.filter(phone='PHONE_NUMBER')

# 2. If still exists, manually delete
>>> appt = Appointment.objects.get(id=ID)
>>> appt.delete()

# 3. Restart frontend
cd frontend
npm run dev
```

### Issue 3: API proxy not forwarding requests

**Symptoms:**
- 404 errors in Next.js admin
- "Failed to fetch" errors

**Solution:**
```powershell
# 1. Check if proxy route exists
ls frontend/src/app/api/appointments/[id]/

# 2. Restart Next.js dev server
cd frontend
npm run dev

# 3. Check browser console for errors
# Press F12 → Console tab
```

---

## Performance Testing

### Test Load Time
```powershell
# Measure API response time
Measure-Command {
    Invoke-WebRequest -Uri "http://localhost:8000/api/appointments/" -UseBasicParsing
}

# Should be < 500ms for small datasets
```

### Test Concurrent Requests
```powershell
# Run multiple requests simultaneously
1..10 | ForEach-Object -Parallel {
    Invoke-WebRequest -Uri "http://localhost:8000/api/appointments/" -UseBasicParsing
}
```

---

## Checklist: All Tests Passed ✅

### Basic Functionality:
- [ ] Django admin loads
- [ ] Next.js admin loads
- [ ] Patient status page loads
- [ ] Can create appointments
- [ ] Can view appointments

### Synchronization:
- [ ] Status update in Next.js → reflects in Django
- [ ] Status update in Django → reflects in Next.js
- [ ] Approved appointments move to history
- [ ] Rejected appointments move to history
- [ ] History entries show correct status changes

### Patient Experience:
- [ ] Phone search returns results
- [ ] No duplicate records
- [ ] Shows both active and history
- [ ] Correct status displayed

### API Functionality:
- [ ] GET requests work
- [ ] POST requests work
- [ ] PATCH requests work
- [ ] DELETE requests work
- [ ] Proxy forwards correctly

### Data Integrity:
- [ ] No orphaned records
- [ ] History entries complete
- [ ] Timestamps correct
- [ ] Foreign keys intact

---

## Success Criteria

**All tests pass when:**
1. ✅ Both admin panels show identical data
2. ✅ Status changes reflect immediately
3. ✅ Patients see no duplicates
4. ✅ History tracking works correctly
5. ✅ No console errors
6. ✅ No database inconsistencies

---

## Final Verification Command

```powershell
# Run this to verify everything
powershell -ExecutionPolicy Bypass -File test_sync.ps1

# Expected output:
# ✅ Django Backend: Running
# ✅ Next.js Frontend: Running
# ✅ API Proxy: Working
# ✅ Phone Search: Functional
# ✅ History Tracking: Functional
# 🎉 All systems operational!
```

---

## 🎉 If All Tests Pass

**Congratulations! Your Django-Next.js synchronization is working perfectly!**

The system is now:
- ✅ Production-ready
- ✅ Fully synchronized
- ✅ Patient-friendly (no duplicates)
- ✅ Admin-friendly (consistent data)
- ✅ Developer-friendly (maintainable code)

**You can now deploy with confidence! 🚀**
