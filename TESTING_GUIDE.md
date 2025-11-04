# Testing Guide - Admin Panel Data Fetching

## ✅ Backend Status

**Backend is running on:** http://localhost:8000  
**Frontend is running on:** http://localhost:3000

### Backend Test Results:
- ✅ `/api/appointments/` - **200 OK** - Found 2 appointments
- ✅ `/api/history/` - **200 OK** - Working
- ✅ `/api/doctors/` - **200 OK** - Working
- ⚠️ `/api/feedback/` - **405 Method Not Allowed** (POST only endpoint)

---

## 🧪 Manual Testing Checklist

### 1. Appointments Page (`/admin/appointments`)

#### Test Data Loading
- [ ] Navigate to http://localhost:3000/admin/appointments
- [ ] Verify appointments table loads with data
- [ ] Check loading state appears briefly
- [ ] Verify no console errors

#### Test Phone Search (Debounced)
- [ ] Type a phone number in the search box
- [ ] Verify search is debounced (waits 300ms after typing stops)
- [ ] Check console for "Raw response:" log in development mode
- [ ] Verify results update correctly
- [ ] Clear search and verify all appointments return

#### Test Filters
- [ ] Click "Filters" button
- [ ] Select a status filter (PENDING/APPROVED/REJECTED)
- [ ] Verify filtered results
- [ ] Select a service filter
- [ ] Verify filtered results
- [ ] Select date range
- [ ] Verify filtered results
- [ ] Clear all filters and verify all data returns

#### Test Pagination
- [ ] If more than 20 appointments, verify pagination controls appear
- [ ] Click "Next" button
- [ ] Verify page 2 loads
- [ ] Click "Previous" button
- [ ] Verify page 1 loads
- [ ] Verify pagination info shows correct counts

#### Test Error Handling
- [ ] Stop the backend server
- [ ] Try to search or filter
- [ ] Verify error message appears: "Server error: ..."
- [ ] Check console for detailed error logs
- [ ] Restart backend and verify recovery

---

### 2. Appointment History Page (`/admin/history`)

#### Test Data Loading
- [ ] Navigate to http://localhost:3000/admin/history
- [ ] Verify history table loads with data
- [ ] Check loading state appears briefly
- [ ] Verify no console errors

#### Test Search (Debounced)
- [ ] Type in the search box (name, phone, or changed by)
- [ ] Verify search is debounced (300ms delay)
- [ ] Verify results update correctly
- [ ] Verify page resets to 1 when searching
- [ ] Clear search and verify all history returns

#### Test Pagination
- [ ] Navigate through pages if available
- [ ] Verify pagination works correctly

#### Test "Mark Visited" Button
- [ ] Find an unvisited entry
- [ ] Click "Mark visited" button
- [ ] Verify status updates to "visited"
- [ ] Verify button disappears after marking

---

### 3. Doctors Page (`/admin/doctors`)

#### Test Data Loading
- [ ] Navigate to http://localhost:3000/admin/doctors
- [ ] Verify doctors table loads with data
- [ ] Check loading state appears briefly
- [ ] Verify no console errors

#### Test Service Filter
- [ ] Select a service from dropdown
- [ ] Verify doctors are filtered by service
- [ ] Select "All Services"
- [ ] Verify all doctors return

#### Test Client-Side Search
- [ ] Type in search box (name, email, or phone)
- [ ] Verify results filter immediately (client-side)
- [ ] Clear search and verify all doctors return

---

### 4. Feedback Page (`/admin/feedback`)

⚠️ **Note:** The backend feedback endpoint may only support POST method.

#### Test Data Loading
- [ ] Navigate to http://localhost:3000/admin/feedback
- [ ] Check if data loads or if error appears
- [ ] If error: Verify error message is user-friendly
- [ ] Check console for detailed error logs

#### Test Search (if endpoint supports GET)
- [ ] Type in search box
- [ ] Verify search is debounced (300ms delay)
- [ ] Verify results update correctly

---

## 🔍 Console Testing

Open browser DevTools (F12) and check:

### Expected Console Logs (Development Mode)

#### On Successful Data Fetch:
```
Raw response: {"count":2,"results":[{"id":1,"name":"John Doe"...
```

#### On JSON Parse Error:
```
JSON parse error: SyntaxError: Unexpected token...
Response text: <html>Error page...
```

#### On Network Error:
```
Error fetching appointments: Server error: 500 Internal Server Error
```

### Expected Behavior:
- ✅ No uncaught exceptions
- ✅ All errors are caught and displayed in UI
- ✅ Raw responses logged in development mode
- ✅ User-friendly error messages in production

---

## 🎯 Key Features to Verify

### 1. Safe JSON Parsing
- [ ] Invalid JSON responses don't crash the app
- [ ] Error message: "Server returned invalid JSON. Please check the console for details."
- [ ] Console shows raw response text for debugging

### 2. Content-Type Validation
- [ ] Non-JSON responses are caught
- [ ] Error message: "Server did not return valid JSON."

### 3. Debounced Search
- [ ] Search waits 300ms after typing stops
- [ ] Reduces API calls during typing
- [ ] Page resets to 1 on search

### 4. Loading States
- [ ] "Loading..." message appears while fetching
- [ ] Loading state clears after data loads
- [ ] Loading state clears on error

### 5. Error States
- [ ] Red error alert box appears on error
- [ ] Error message is user-friendly
- [ ] Console has detailed error information

### 6. Empty States
- [ ] "No items found" message when no results
- [ ] Appears after loading completes
- [ ] Clears when data is available

---

## 🐛 Common Issues & Solutions

### Issue: "Unable to connect to the remote server"
**Solution:** Backend is not running. Start it with:
```powershell
cd backend
venv\Scripts\python.exe manage.py runserver 8000
```

### Issue: "Server returned invalid JSON"
**Solution:** 
1. Check console for raw response
2. Verify backend endpoint exists
3. Check backend logs for errors

### Issue: Search not debouncing
**Solution:**
1. Check browser console for errors
2. Verify lodash/debounce is installed
3. Check network tab for API call timing

### Issue: Pagination not working
**Solution:**
1. Verify backend returns `count` and `results`
2. Check if totalCount state is set correctly
3. Verify page state updates on button click

### Issue: Filters not working
**Solution:**
1. Check network tab for correct query parameters
2. Verify backend supports the filter parameters
3. Check console for errors

---

## 📊 Performance Metrics

### Expected Performance:
- **Initial Load:** < 1 second (with local backend)
- **Search Debounce:** 300ms delay
- **Page Navigation:** < 500ms
- **Filter Application:** < 500ms

### Network Requests:
- **Without Search:** 1 request per page load
- **With Search:** 1 request per 300ms pause in typing
- **Pagination:** 1 request per page change

---

## ✨ Success Criteria

All tests pass if:
- ✅ No uncaught JavaScript errors
- ✅ All data loads correctly from backend
- ✅ Search is debounced (300ms)
- ✅ Pagination works smoothly
- ✅ Filters apply correctly
- ✅ Error messages are user-friendly
- ✅ Loading states appear and disappear correctly
- ✅ Empty states show when no data
- ✅ Console logs raw responses in development
- ✅ Invalid JSON doesn't crash the app

---

## 🚀 Quick Test Script

Run this to verify backend is working:
```powershell
powershell -ExecutionPolicy Bypass -File test_backend.ps1
```

Expected output:
```
Testing Django Backend on http://localhost:8000
================================================

1. Testing /api/appointments/ endpoint...
   Status: 200
   Found X appointments

2. Testing /api/history/ endpoint...
   Status: 200

3. Testing /api/doctors/ endpoint...
   Status: 200

4. Testing /api/feedback/ endpoint...
   Status: 200 or 405

Testing complete!
```

---

## 📝 Test Report Template

```
Date: ___________
Tester: ___________

Backend Status: [ ] Running [ ] Not Running
Frontend Status: [ ] Running [ ] Not Running

Appointments Page:
- Data Loading: [ ] Pass [ ] Fail
- Phone Search: [ ] Pass [ ] Fail
- Filters: [ ] Pass [ ] Fail
- Pagination: [ ] Pass [ ] Fail
- Error Handling: [ ] Pass [ ] Fail

History Page:
- Data Loading: [ ] Pass [ ] Fail
- Search: [ ] Pass [ ] Fail
- Pagination: [ ] Pass [ ] Fail
- Mark Visited: [ ] Pass [ ] Fail

Doctors Page:
- Data Loading: [ ] Pass [ ] Fail
- Service Filter: [ ] Pass [ ] Fail
- Search: [ ] Pass [ ] Fail

Feedback Page:
- Data Loading: [ ] Pass [ ] Fail
- Search: [ ] Pass [ ] Fail

Overall Result: [ ] All Pass [ ] Some Failures

Notes:
_________________________________
_________________________________
_________________________________
```

---

## 🎉 Next Steps After Testing

1. **If all tests pass:**
   - Document any edge cases found
   - Consider adding automated tests
   - Deploy to staging environment

2. **If tests fail:**
   - Note specific failures
   - Check console for detailed errors
   - Review ADMIN_DATA_FETCHING_PATTERN.md
   - Fix issues and retest

3. **Performance optimization:**
   - Monitor network tab for slow requests
   - Consider adding request caching
   - Optimize backend queries if needed

---

**Happy Testing! 🧪**
