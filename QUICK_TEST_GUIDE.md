# 🚀 Quick Test Guide - Phone Search

## ⚡ Quick Start

### 1. Restart Backend (IMPORTANT!)
```powershell
cd backend
# Press Ctrl+C to stop current server
venv\Scripts\python.exe manage.py runserver 8000
```

### 2. Open Frontend
```
Frontend should already be running on: http://localhost:3000
If not: cd frontend && npm run dev
```

---

## 🧪 Quick Tests

### Test 1: Appointments Page
```
URL: http://localhost:3000/admin/appointments
Search: Type "123"
Expected: Shows "123" in input, subtitle shows "Searching phone: 123"
```

### Test 2: History Page
```
URL: http://localhost:3000/admin/history
Search: Type "abc456def"
Expected: Shows "456" in input (letters stripped)
```

### Test 3: Feedback Page
```
URL: http://localhost:3000/admin/feedback
Search: Type "(555) 123-4567"
Expected: Shows "5551234567" (only digits)
```

### Test 4: Doctors Page (Should NOT Change)
```
URL: http://localhost:3000/admin/doctors
Search: Type "John"
Expected: Shows "John" (accepts letters), filters immediately
```

---

## ✅ What to Look For

### In Search Box:
- ✅ Only digits appear (letters/symbols stripped)
- ✅ Placeholder: "Live search by phone number (digits only)..."

### In Subtitle:
- ✅ Shows: "Searching phone: {number}" when typing
- ✅ Returns to default when cleared

### In Network Tab (F12):
- ✅ API calls have `?phone={number}` parameter
- ✅ Calls happen 300ms after typing stops

### In Results:
- ✅ Shows matching phone numbers
- ✅ Updates after 300ms pause
- ✅ Shows "No items found" if no matches

---

## 🐛 Quick Fixes

**Search not working?**
→ Restart backend server

**Letters showing in search?**
→ Hard refresh browser (Ctrl+Shift+R)

**No results?**
→ Try shorter number (e.g., "98" instead of "9876543210")

**Console errors?**
→ Check backend is running on port 8000

---

## 📊 Expected Behavior

| Action | Result |
|--------|--------|
| Type "123" | Shows "123" |
| Type "abc123" | Shows "123" |
| Type "(555) 123" | Shows "555123" |
| Clear search | Shows all records |
| Wait 300ms | API call fires |
| Type quickly | Only 1 API call after pause |

---

## ✨ Success Criteria

- [ ] All 3 pages (Appointments, History, Feedback) accept only digits
- [ ] Doctors page still accepts all characters
- [ ] Subtitle updates with search term
- [ ] Network tab shows `phone` parameter
- [ ] Results update after 300ms
- [ ] No console errors

**If all checked: SUCCESS! ✅**

---

## 📞 Test with Real Data

If you have phone numbers in database:
1. Note a phone number from database
2. Type first 3 digits in search
3. Verify that record appears
4. Type full number
5. Verify only that record appears

---

**Ready to test! 🎉**
