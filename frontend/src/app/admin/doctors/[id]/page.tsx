"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiClient } from "@/lib/api";
import { Doctor } from "@/lib/types";
import { ArrowLeft, Save } from "lucide-react";

export default function DoctorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchDoctor();
    }
  }, [id]);

  const fetchDoctor = async () => {
    try {
      const data = await apiClient.get<Doctor>(`/api/doctors/${id}/`);
      setDoctor(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch doctor");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Loading doctor...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!doctor) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-gray-600 mb-4">Doctor not found</p>
          <button
            onClick={() => router.push("/admin/doctors")}
            className="text-cyan-600 hover:text-cyan-700 font-medium"
          >
            Back to Doctors
          </button>
        </div>
      </AdminLayout>
    );
  }

  const handleSaveChanges = async () => {
    if (!doctor) return;

    setSaving(true);
    setError("");

    try {
      const updated = await apiClient.patch<Doctor>(
        `/api/doctors/${id}/`,
        {
          name: doctor.name,
          service: doctor.service,
          email: doctor.email || "",
          phone: doctor.phone || "",
          active: doctor.active
        }
      );

      setDoctor(updated);
      alert("Doctor updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!doctor) return;
    
    const newStatus = !doctor.active;
    const confirmed = window.confirm(
      `Are you sure you want to mark this doctor as ${
        newStatus ? 'active' : 'inactive'
      }?`
    );
    
    if (!confirmed) return;

    try {
      const updated = await apiClient.patch<Doctor>(`/api/doctors/${id}/`, {
        active: newStatus
      });
      
      setDoctor(updated);
      alert(`Doctor marked as ${newStatus ? 'active' : 'inactive'}!`);
    } catch (err: any) {
      setError(err.message || 'Failed to update doctor status');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/doctors")}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor #{doctor.id}</h1>
              <p className="text-gray-600 mt-1">View and edit doctor details</p>
            </div>
          </div>
          
          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition disabled:opacity-50 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Doctor Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Doctor Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={doctor.name}
                onChange={(e) => setDoctor({ ...doctor, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
             <select
                value={doctor.service}
                onChange={(e) => setDoctor({ ...doctor, service: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
              >
                <option value="">Select a service</option>
                {/* You might want to fetch services here if not already available */}
                {/* {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))} */}
              </select>

            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={doctor.email || ""}
                onChange={(e) => setDoctor({ ...doctor, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={doctor.phone || ""}
                onChange={(e) => setDoctor({ ...doctor, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block px-3 py-2 text-sm font-medium rounded-lg ${
                    doctor.active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {doctor.active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={toggleActive}
                  className="text-sm text-cyan-600 hover:text-cyan-700"
                >
                  Mark as {doctor.active ? 'Inactive' : 'Active'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
