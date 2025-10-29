# Next.js Admin Panel - Setup & Documentation

This is a Next.js-based admin panel that replicates the Django Unfold admin theme and functionality. It provides a modern, responsive interface for managing dental appointments, doctors, history, and feedback.

## 🚀 Features

- **Authentication**: Token-based authentication compatible with Django backend
- **Appointments Management**: 
  - List view with filters (status, service, date range), search, and pagination
  - Detail view with approve/reject actions
  - Admin notes (editable)
  - History tracking
  - Import/Export functionality
- **Doctors Management**: List and detail views for managing doctors
- **Appointment History**: View all status changes with full audit trail
- **Feedback**: View customer feedback submissions
- **Responsive Design**: Mobile-friendly UI matching Unfold theme (cyan/blue color scheme)
- **Environment-based Configuration**: All API endpoints configurable via environment variables

## 📋 Prerequisites

- Node.js 18+ and npm
- Django backend running (default: http://localhost:8000)
- Admin user account in Django

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the `frontend` directory:

```bash
# Copy the example file
cp env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Authentication endpoints (adjust if using different auth)
NEXT_PUBLIC_API_AUTH_URL=/api-auth/login/
NEXT_PUBLIC_API_REFRESH_URL=/api-auth/token/refresh/

# Environment
NODE_ENV=development
```

**Important**: Replace `http://localhost:8000` with your actual Django backend URL.

### 3. Backend API Requirements

The Next.js admin expects the following Django REST API endpoints:

#### Authentication
- `POST /api-auth/login/` - Login endpoint (returns access token)
- `POST /api-auth/token/refresh/` - Refresh token endpoint

#### Appointments
- `GET /api/appointments/` - List appointments (supports pagination, filters)
- `GET /api/appointments/{id}/` - Get appointment detail
- `PATCH /api/appointments/{id}/` - Update appointment (status, admin_notes)
- `POST /api/appointments/` - Create appointment
- `DELETE /api/appointments/{id}/` - Delete appointment

**Query Parameters for Filtering:**
- `status` - Filter by status (PENDING, APPROVED, REJECTED)
- `service` - Filter by service type
- `date_from` - Filter appointments from date
- `date_to` - Filter appointments to date
- `search` - Search by name, email, or phone
- `page` - Page number for pagination
- `page_size` - Number of results per page

#### Doctors
- `GET /api/doctors/` - List doctors
- `GET /api/doctors/{id}/` - Get doctor detail
- `POST /api/doctors/` - Create doctor
- `PATCH /api/doctors/{id}/` - Update doctor
- `DELETE /api/doctors/{id}/` - Delete doctor

#### History
- `GET /api/history/` - List appointment history
- `GET /api/history/{id}/` - Get history entry detail

#### Feedback
- `GET /api/feedback/` - List feedback (needs to be added to backend)
- `GET /api/feedback/{id}/` - Get feedback detail (needs to be added to backend)
- `POST /api/feedback/` - Create feedback (already exists)

### 4. Backend Modifications Needed

If your Django backend doesn't have all required endpoints, add them:

#### Add Feedback ViewSet (if not exists)

In `dental/api_views.py`:

```python
class FeedbackViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Feedback.objects.all().order_by('-created_at')
    serializer_class = FeedbackSerializer
```

In `dental/urls.py`:

```python
router.register(r'feedback', FeedbackViewSet, basename='feedback')
```

#### Add Authentication Endpoints

Install Django REST Framework Simple JWT (if not already):

```bash
pip install djangorestframework-simplejwt
```

In `core/settings.py`:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
}
```

In `core/urls.py`:

```python
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # ... existing patterns
    path('api-auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api-auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
```

### 5. Run the Development Server

```bash
npm run dev
```

The admin panel will be available at: **http://localhost:3000/admin**

## 🔐 Authentication

1. Navigate to `/admin` - you'll be redirected to `/admin/login`
2. Enter your Django admin credentials
3. Upon successful login, you'll be redirected to `/admin/appointments`

The authentication token is stored in `localStorage` and automatically attached to all API requests.

## 📱 Usage

### Appointments

**List View** (`/admin/appointments`):
- Search by name, email, or phone
- Filter by status, service, and date range
- Paginated results (20 per page)
- Click any row to view details
- Export appointments as JSON

**Detail View** (`/admin/appointments/{id}`):
- View all appointment fields (readonly: name, email, phone, etc.)
- Edit admin notes
- Approve or Reject appointment (creates history entry)
- View appointment history
- Metadata: created_at, updated_at, assigned doctor

**Actions**:
- **Approve**: Changes status to APPROVED, creates history entry, deletes appointment (per Django admin behavior)
- **Reject**: Changes status to REJECTED, creates history entry, deletes appointment
- **Save Notes**: Updates admin_notes without changing status

### Doctors

**List View** (`/admin/doctors`):
- Search by name, email, or phone
- Filter by service
- View active/inactive status

**Detail View** (`/admin/doctors/{id}`):
- View doctor information (readonly)

### History

**List View** (`/admin/history`):
- View all appointment status changes
- Search by name, phone, or changed_by
- See status transitions (PENDING → APPROVED, etc.)
- Paginated results

**Detail View** (`/admin/history/{id}`):
- Full snapshot of appointment at time of change
- Status change details
- Admin notes from the change

### Feedback

**List View** (`/admin/feedback`):
- View all customer feedback
- Search by name, phone, or message
- Paginated results

**Detail View** (`/admin/feedback/{id}`):
- View full feedback message
- Contact information

## 🧪 Acceptance Testing Checklist

### Setup
- [ ] Backend is running at configured `NEXT_PUBLIC_API_BASE_URL`
- [ ] `.env.local` is configured with correct API base URL
- [ ] Admin user exists in Django backend
- [ ] All required backend endpoints are available

### Authentication
- [ ] Navigate to `/admin` redirects to `/admin/login`
- [ ] Can log in with valid Django admin credentials
- [ ] Invalid credentials show error message
- [ ] Successful login redirects to `/admin/appointments`
- [ ] Logout button works and redirects to login

### Appointments List
- [ ] Appointments load and display in table
- [ ] Search by name works
- [ ] Search by email works
- [ ] Search by phone works
- [ ] Status filter works (PENDING, APPROVED, REJECTED)
- [ ] Service filter works
- [ ] Date range filter works (from/to)
- [ ] Pagination works (Previous/Next buttons)
- [ ] Clicking row navigates to detail page
- [ ] Export button downloads JSON file

### Appointment Detail
- [ ] All patient fields display correctly
- [ ] Readonly fields cannot be edited (name, email, phone, etc.)
- [ ] Admin notes can be edited
- [ ] "Save Notes" button updates admin_notes
- [ ] "Approve" button:
  - [ ] Shows confirmation dialog
  - [ ] Updates status to APPROVED
  - [ ] Creates history entry
  - [ ] Redirects to list after success
- [ ] "Reject" button:
  - [ ] Shows confirmation dialog
  - [ ] Updates status to REJECTED
  - [ ] Creates history entry
  - [ ] Redirects to list after success
- [ ] History section shows previous status changes
- [ ] Metadata shows created_at, updated_at
- [ ] Assigned doctor displays if present

### Doctors
- [ ] Doctors list loads and displays
- [ ] Search works
- [ ] Service filter works
- [ ] Active/Inactive status displays correctly
- [ ] Clicking row navigates to detail page
- [ ] Detail page shows all doctor information

### History
- [ ] History list loads and displays
- [ ] Search works
- [ ] Status transitions display correctly (PENDING → APPROVED)
- [ ] Pagination works
- [ ] Clicking row navigates to detail page
- [ ] Detail page shows full snapshot and change details

### Feedback
- [ ] Feedback list loads and displays
- [ ] Search works
- [ ] Pagination works
- [ ] Clicking row navigates to detail page
- [ ] Detail page shows full message

### API Base URL Change
- [ ] Stop Next.js dev server
- [ ] Change `NEXT_PUBLIC_API_BASE_URL` in `.env.local` to different URL
- [ ] Restart Next.js dev server
- [ ] Verify all API calls use new base URL (check Network tab in browser DevTools)
- [ ] All features work with new base URL

### Responsive Design
- [ ] Admin panel works on mobile devices
- [ ] Sidebar collapses on mobile
- [ ] Tables are scrollable on mobile
- [ ] Forms are usable on mobile

### Error Handling
- [ ] Network errors show user-friendly messages
- [ ] 404 errors show "not found" messages
- [ ] Authentication errors redirect to login
- [ ] Form validation errors display correctly

## 🎨 UI/UX Features

- **Unfold-inspired Design**: Cyan/blue color scheme matching Django Unfold theme
- **Status Badges**: Color-coded status indicators (yellow=PENDING, green=APPROVED, red=REJECTED)
- **Responsive Layout**: Sidebar navigation with mobile hamburger menu
- **Loading States**: Skeleton screens and loading indicators
- **Confirmation Dialogs**: For destructive actions (approve/reject)
- **Breadcrumb Navigation**: Back buttons on detail pages
- **Hover Effects**: Interactive table rows and buttons

## 🔧 Customization

### Changing API Endpoints

Edit `src/lib/api.ts` to modify the API client behavior.

### Changing Colors

The admin uses Tailwind CSS. Primary colors are:
- `cyan-600` / `cyan-700` - Primary actions
- `green-600` / `green-700` - Approve actions
- `red-600` / `red-700` - Reject actions
- `gray-*` - Neutral elements

### Adding New Sections

1. Create new page in `src/app/admin/[section]/page.tsx`
2. Add route to sidebar navigation in `src/components/admin/AdminLayout.tsx`
3. Create API service methods in `src/lib/api.ts` if needed

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### "Failed to fetch" errors
- Verify Django backend is running
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Ensure CORS is configured in Django backend
- Check browser console for detailed error messages

### Authentication not working
- Verify JWT endpoints are configured in Django
- Check that `djangorestframework-simplejwt` is installed
- Ensure user credentials are correct
- Clear localStorage and try again

### Appointments not loading
- Verify `/api/appointments/` endpoint exists
- Check that DRF router is configured correctly
- Ensure authentication token is valid
- Check Django logs for errors

## 📝 Notes

- **Import/Export**: Currently exports as JSON. For CSV import/export, implement backend endpoints using `django-import-export` and update frontend accordingly.
- **Inline Editing**: Not implemented. All editing is done via detail pages.
- **Bulk Actions**: Not implemented. Actions are performed one at a time.
- **Real-time Updates**: Not implemented. Refresh page to see latest data.

## 🤝 Support

For issues or questions:
1. Check Django backend logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Ensure all backend endpoints are accessible

## 📄 License

This admin panel is part of the Dental Appointment System project.
