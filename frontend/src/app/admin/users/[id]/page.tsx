"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const userData = await apiClient.get<any>(`/api/users/${id}/`);
        console.log('[UserDetail] Fetched user:', userData);
        setUser(userData);
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to load user';
        console.error('[UserDetail] Error:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadUser();
    }
  }, [id]);

  const handleSave = async () => {
    try {
      await apiClient.put(`/api/users/${id}/`, user);
      alert("User updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Save failed:", error);
      alert("Error updating user");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center">Loading...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 mb-4">
            <strong>Error:</strong> {error}
          </div>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded p-4 mb-4">
            User not found
          </div>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">

        {/* Page Title */}
        <h1 className="text-2xl font-bold mb-6">
          Change User — {user.username}
        </h1>

        {/* --- USER INFO CARD --- */}
        <div className="bg-white rounded-lg border shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>

          {/* Username */}
          <label className="block text-sm font-medium text-gray-700 mt-3">
            Username
          </label>
          <input
            className="w-full border rounded p-2"
            value={user.username || ""}
            onChange={(e) => setUser({ ...user, username: e.target.value })}
          />

          {/* First name */}
          <label className="block text-sm font-medium text-gray-700 mt-3">
            First name
          </label>
          <input
            className="w-full border rounded p-2"
            value={user.first_name || ""}
            onChange={(e) => setUser({ ...user, first_name: e.target.value })}
          />

          {/* Last name */}
          <label className="block text-sm font-medium text-gray-700 mt-3">
            Last name
          </label>
          <input
            className="w-full border rounded p-2"
            value={user.last_name || ""}
            onChange={(e) => setUser({ ...user, last_name: e.target.value })}
          />

          {/* Email */}
          <label className="block text-sm font-medium text-gray-700 mt-3">
            Email address
          </label>
          <input
            className="w-full border rounded p-2"
            value={user.email || ""}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
        </div>

        {/* --- PASSWORD SECTION (like Django Admin) --- */}
        <div className="bg-white rounded-lg border shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Password</h2>

          <p className="text-sm text-gray-600 mb-3">
            Raw passwords are not stored, so there is no way to see this user’s password.
          </p>

          <Button
            variant="secondary"
            onClick={() => router.push(`/admin/users/${id}/password`)}
          >
            Change Password
          </Button>
        </div>

        {/* Save Button */}
        <Button className="mt-6 w-full" onClick={handleSave}>
          Save changes
        </Button>
      </div>
    </AdminLayout>
  );
}
