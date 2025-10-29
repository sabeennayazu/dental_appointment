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
    print(f"Admin user '{username}' updated. Password set to '{password}'")
else:
    user = User.objects.create_superuser(username=username, email=email, password=password)
    print(f"Admin user '{username}' created with password '{password}'")

print(f"\nLogin at: http://localhost:3000/admin")
print(f"Username: {username}")
print(f"Password: {password}")
