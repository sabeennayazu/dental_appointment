#!/usr/bin/env python
"""
Script to create an admin user for the Next.js admin panel
Username: admin
Password: admin
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

# Create admin user
username = 'admin'
password = 'admin'
email = 'admin@example.com'

# Check if user already exists
if User.objects.filter(username=username).exists():
    user = User.objects.get(username=username)
    user.set_password(password)
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print(f"✅ Admin user '{username}' already existed. Password updated to '{password}'")
else:
    user = User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    print(f"✅ Admin user created successfully!")

print(f"\n📋 Login Credentials:")
print(f"   Username: {username}")
print(f"   Password: {password}")
print(f"\n🌐 Use these credentials to login at:")
print(f"   Next.js Admin: http://localhost:3000/admin")
print(f"   Django Admin:  http://localhost:8000/admin/")
