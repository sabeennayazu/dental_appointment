# Create Admin User for Next.js Admin Panel

## Quick Method (Recommended)

### Option 1: Using Django Shell

1. **Activate virtual environment** (if using venv):
   ```bash
   cd backend
   venv\Scripts\activate  # Windows
   # or
   source venv/bin/activate  # Linux/Mac
   ```

2. **Run Django shell**:
   ```bash
   python manage.py shell
   ```

3. **Create superuser** (paste this in the shell):
   ```python
   from django.contrib.auth.models import User
   
   # Create or update admin user
   username = 'admin'
   password = 'admin'
   email = 'admin@example.com'
   
   if User.objects.filter(username=username).exists():
       user = User.objects.get(username=username)
       user.set_password(password)
       user.is_staff = True
       user.is_superuser = True
       user.save()
       print(f"✅ Admin user '{username}' updated")
   else:
       user = User.objects.create_superuser(username=username, email=email, password=password)
       print(f"✅ Admin user '{username}' created")
   
   print(f"\nUsername: {username}")
   print(f"Password: {password}")
   print(f"Login at: http://localhost:3000/admin")
   exit()
   ```

### Option 2: Using Django Management Command

1. **Activate virtual environment**:
   ```bash
   cd backend
   venv\Scripts\activate
   ```

2. **Create superuser interactively**:
   ```bash
   python manage.py createsuperuser
   ```
   
   Enter when prompted:
   - Username: `admin`
   - Email: `admin@example.com` (or press Enter to skip)
   - Password: `admin`
   - Password (again): `admin`

### Option 3: Using the Provided Script

1. **Activate virtual environment**:
   ```bash
   cd backend
   venv\Scripts\activate
   ```

2. **Run the create_admin_simple.py script**:
   ```bash
   python manage.py shell < create_admin_simple.py
   ```

## Verify Admin User

### Test in Django Admin

1. Start Django server:
   ```bash
   python manage.py runserver
   ```

2. Visit: http://localhost:8000/admin/

3. Login with:
   - Username: `admin`
   - Password: `admin`

### Test in Next.js Admin Panel

1. Start Next.js server (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

2. Visit: http://localhost:3000/admin

3. Login with:
   - Username: `admin`
   - Password: `admin`

4. You should be redirected to: http://localhost:3000/admin/dashboard

## Important Notes

### Superuser Requirements

The Next.js admin panel **only allows superusers** to login. Regular users or staff users without superuser status will be denied access with the message:

> "Access denied. Only superusers can access the admin panel."

### Security

⚠️ **WARNING**: The credentials `admin/admin` are for development only!

For production:
1. Use strong, unique passwords
2. Change the default admin username
3. Enable HTTPS
4. Consider two-factor authentication
5. Regularly rotate passwords

### Creating Additional Admin Users

To create more admin users:

```python
from django.contrib.auth.models import User

User.objects.create_superuser(
    username='yourusername',
    email='your@email.com',
    password='your_secure_password'
)
```

### Troubleshooting

**"ModuleNotFoundError: No module named 'unfold'"**
- This is expected if unfold is not installed
- The admin panel doesn't require unfold
- Use Option 1 or 2 above instead

**"Authentication failed"**
- Verify the user is a superuser: `user.is_superuser` should be `True`
- Check Django backend is running
- Verify CORS is configured
- Check browser console for errors

**"Access denied. Only superusers can access the admin panel."**
- The user exists but is not a superuser
- Run this to make them a superuser:
  ```python
  from django.contrib.auth.models import User
  user = User.objects.get(username='admin')
  user.is_superuser = True
  user.is_staff = True
  user.save()
  ```

## Authentication Flow

1. User enters credentials at `/admin/login`
2. Frontend sends POST to `/api/admin/login/`
3. Backend verifies:
   - User exists
   - Password is correct
   - User is active
   - **User is superuser** ✅
4. Backend returns JWT tokens + user info
5. Frontend stores tokens in localStorage
6. Frontend redirects to `/admin/dashboard`
7. All subsequent requests include JWT token
8. Backend verifies token and superuser status on each request

## API Endpoints

The admin authentication uses these endpoints:

- `POST /api/admin/login/` - Login (checks superuser)
- `GET /api/admin/verify/` - Verify token and superuser status
- `POST /api/admin/logout/` - Logout

All are defined in `backend/dental/auth_views.py` and registered in `backend/core/urls.py`.
