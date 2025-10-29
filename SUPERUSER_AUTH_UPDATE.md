# Superuser Authentication Update - Summary

## Changes Made

The Next.js admin panel has been updated to **only allow Django superusers** to authenticate and access admin pages.

## Backend Changes

### 1. New Authentication Views (`backend/dental/auth_views.py`)

Created three new API views:

- **`AdminLoginView`** - Custom login that checks for superuser status
  - Verifies username and password
  - **Rejects non-superusers** with 403 error
  - Returns JWT tokens + user info on success

- **`AdminVerifyView`** - Verifies current user is authenticated and is superuser
  - Used on page loads to check access
  - Returns user info if valid superuser

- **`AdminLogoutView`** - Logout endpoint

### 2. Updated URLs (`backend/core/urls.py`)

Added new endpoints:
```python
POST /api/admin/login/    # Login with superuser check
GET  /api/admin/verify/   # Verify superuser status
POST /api/admin/logout/   # Logout
```

## Frontend Changes

### 1. Updated Auth Service (`frontend/src/lib/auth.ts`)

- **`login()`** - Now uses `/api/admin/login/` endpoint
- **`verifyAuth()`** - New method to verify superuser status with backend
- **`isSuperuser()`** - Check if current user is superuser
- **`getUser()`** - Get stored user information
- **`logout()`** - Calls backend logout and clears all tokens

### 2. Updated Admin Root (`frontend/src/app/admin/page.tsx`)

- Verifies authentication and superuser status on load
- Redirects to `/admin/login` if not authenticated or not superuser
- Redirects to `/admin/dashboard` if valid superuser

### 3. Updated Login Page (`frontend/src/app/admin/login/page.tsx`)

- Redirects to `/admin/dashboard` on successful login
- Shows specific error messages (including "Access denied" for non-superusers)

### 4. New Dashboard Page (`frontend/src/app/admin/dashboard/page.tsx`)

- Welcome screen with statistics
- Shows appointment counts, doctors, feedback
- Quick action buttons
- User account information
- Verifies superuser status on mount

### 5. Updated Admin Layout (`frontend/src/components/admin/AdminLayout.tsx`)

- Verifies superuser status on mount
- Updated navigation to include Dashboard
- Redirects to login if verification fails

## Authentication Flow

```
1. User visits /admin
   ↓
2. Check authentication with backend
   ↓
3. Backend verifies JWT token AND superuser status
   ↓
4. If valid superuser → redirect to /admin/dashboard
   If not → redirect to /admin/login
   ↓
5. User enters credentials at /admin/login
   ↓
6. POST to /api/admin/login/
   ↓
7. Backend checks:
   - User exists? ✓
   - Password correct? ✓
   - User active? ✓
   - User is superuser? ✓ ← NEW CHECK
   ↓
8. If all checks pass:
   - Return JWT tokens
   - Return user info (including is_superuser flag)
   - Frontend stores tokens and user info
   - Redirect to /admin/dashboard
   ↓
9. All subsequent API requests:
   - Include JWT token in Authorization header
   - Backend verifies token
   - Backend checks superuser status
```

## Security Features

### ✅ Superuser-Only Access
- Only Django superusers can login
- Regular users and staff users are rejected
- Non-superusers get clear error message

### ✅ Token-Based Authentication
- JWT tokens for stateless authentication
- Tokens stored securely in localStorage
- Automatic token refresh support

### ✅ Backend Verification
- Every page load verifies with backend
- Checks both token validity and superuser status
- Prevents client-side bypass

### ✅ Environment-Based Configuration
- API base URL from `.env.local`
- No hard-coded localhost URLs
- Easy to switch between dev/staging/prod

## How to Create Admin User

See `CREATE_ADMIN_USER.md` for detailed instructions.

**Quick method**:
```bash
cd backend
venv\Scripts\activate
python manage.py shell
```

Then paste:
```python
from django.contrib.auth.models import User
User.objects.create_superuser('admin', 'admin@example.com', 'admin')
exit()
```

## Testing the Changes

### 1. Create Superuser
```bash
cd backend
venv\Scripts\activate
python manage.py createsuperuser
# Username: admin
# Password: admin
```

### 2. Start Django Backend
```bash
python manage.py runserver
```

### 3. Start Next.js Frontend
```bash
cd frontend
npm run dev
```

### 4. Test Login
1. Visit: http://localhost:3000/admin
2. Should redirect to: http://localhost:3000/admin/login
3. Enter credentials: `admin` / `admin`
4. Should redirect to: http://localhost:3000/admin/dashboard
5. Should see welcome message and statistics

### 5. Test Non-Superuser (Optional)
1. Create regular user in Django admin
2. Try to login with that user
3. Should see error: "Access denied. Only superusers can access the admin panel."

### 6. Test Token Verification
1. Login successfully
2. Refresh the page
3. Should stay logged in (token verified with backend)
4. Open browser DevTools → Application → Local Storage
5. Should see: `admin_token`, `admin_refresh_token`, `admin_user`

### 7. Test Logout
1. Click "Logout" in sidebar
2. Should redirect to login page
3. Tokens should be cleared from localStorage
4. Trying to access /admin/dashboard should redirect to login

## Error Messages

Users will see specific error messages:

- **Invalid credentials**: Wrong username or password
- **Access denied. Only superusers can access the admin panel.**: User exists but is not a superuser
- **User account is disabled**: User exists but is_active = False

## Files Modified

### Backend
- ✅ `backend/dental/auth_views.py` (NEW)
- ✅ `backend/core/urls.py` (MODIFIED)

### Frontend
- ✅ `frontend/src/lib/auth.ts` (MODIFIED)
- ✅ `frontend/src/app/admin/page.tsx` (MODIFIED)
- ✅ `frontend/src/app/admin/login/page.tsx` (MODIFIED)
- ✅ `frontend/src/app/admin/dashboard/page.tsx` (NEW)
- ✅ `frontend/src/components/admin/AdminLayout.tsx` (MODIFIED)

### Documentation
- ✅ `CREATE_ADMIN_USER.md` (NEW)
- ✅ `SUPERUSER_AUTH_UPDATE.md` (NEW - this file)

## Next Steps

1. ✅ Create superuser account (see `CREATE_ADMIN_USER.md`)
2. ✅ Start Django backend
3. ✅ Start Next.js frontend
4. ✅ Test login at http://localhost:3000/admin
5. ✅ Verify dashboard loads
6. ✅ Test all admin pages (appointments, doctors, etc.)

## Production Considerations

Before deploying to production:

1. **Change default credentials**
   - Use strong, unique passwords
   - Don't use `admin/admin`

2. **Environment variables**
   - Set `NEXT_PUBLIC_API_BASE_URL` to production API
   - Use HTTPS URLs

3. **Django settings**
   - Configure CORS for production domain
   - Set strong `SECRET_KEY`
   - Enable HTTPS/SSL

4. **Security**
   - Consider two-factor authentication
   - Implement rate limiting on login endpoint
   - Add login attempt monitoring
   - Regular password rotation policy

## Support

If you encounter issues:

1. Check Django backend is running
2. Check Next.js frontend is running
3. Verify `.env.local` has correct API URL
4. Check browser console for errors
5. Check Django logs for API errors
6. Verify user is a superuser: `user.is_superuser == True`

See `ADMIN_README.md` for complete documentation.
