# Quick Start Guide - Next.js Admin Panel

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
# Copy example file
cp env.example .env.local

# Edit .env.local and set your Django backend URL
# Default: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access Admin Panel
Open browser: **http://localhost:3000/admin**

Login with your Django admin credentials.

## 📋 What You Get

- ✅ **Appointments Management** - List, filter, search, approve/reject
- ✅ **Doctors Management** - View and manage doctors
- ✅ **History Tracking** - Full audit trail of status changes
- ✅ **Feedback** - View customer feedback
- ✅ **Responsive UI** - Works on mobile and desktop
- ✅ **Unfold Theme** - Matches Django Unfold admin styling

## 🔧 Backend Setup Required

The Next.js admin needs these Django endpoints:

### Minimal Setup (5 minutes)
```bash
# Install required packages
pip install djangorestframework-simplejwt django-cors-headers

# Add to settings.py:
# - corsheaders to INSTALLED_APPS
# - CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
# - JWT authentication configuration

# Add to urls.py:
# - JWT token endpoints
```

See `ADMIN_API_SETUP.md` for detailed backend setup instructions.

## 📖 Full Documentation

- **ADMIN_README.md** - Complete documentation with acceptance testing
- **ADMIN_API_SETUP.md** - Backend API setup guide
- **env.example** - Environment variables template

## 🐛 Troubleshooting

### "Failed to fetch" error
- Ensure Django backend is running on the URL in `.env.local`
- Check CORS is configured in Django
- Verify JWT endpoints are set up

### Authentication not working
- Install `djangorestframework-simplejwt`
- Configure JWT in Django settings
- Check credentials are correct

### Appointments not loading
- Verify `/api/appointments/` endpoint exists
- Check authentication token is valid
- Look at browser console for errors

## 🎯 Next Steps

1. ✅ Start Next.js: `npm run dev`
2. ✅ Start Django: `python manage.py runserver`
3. ✅ Visit: http://localhost:3000/admin
4. ✅ Login with admin credentials
5. ✅ Test appointments list and detail pages
6. ✅ Test approve/reject functionality

## 📞 Support

Check these files for help:
- `ADMIN_README.md` - Full documentation
- `ADMIN_API_SETUP.md` - Backend setup
- Browser console - Error messages
- Django logs - API errors
