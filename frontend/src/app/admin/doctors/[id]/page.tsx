"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiClient } from "@/lib/api";
import { Doctor } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

export default function DoctorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/doctors")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctor #{doctor.id}</h1>
            <p className="text-gray-600 mt-1">View doctor details</p>
          </div>
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
                onChange={(e) => {
                  const text = e.target.value;
                  setDoctor({ ...doctor, name: text });
                }}
                // readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
              <input
                type="text"
                value={doctor.service}
                // readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={doctor.email || ""}
                // readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={doctor.phone || ""}
                // readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <span
                className={`inline-block px-3 py-2 text-sm font-medium rounded-lg ${doctor.active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                  }`}
              >
                {doctor.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
