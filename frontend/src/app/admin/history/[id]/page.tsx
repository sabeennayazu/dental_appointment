"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiClient } from "@/lib/api";
import { AppointmentHistory } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function HistoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [entry, setEntry] = useState<AppointmentHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchEntry();
    }
  }, [id]);

  const fetchEntry = async () => {
    try {
      const data = await apiClient.get<AppointmentHistory>(`/api/history/${id}/`);
      setEntry(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch history entry");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Loading history entry...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!entry) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-gray-600 mb-4">History entry not found</p>
          <button
            onClick={() => router.push("/admin/history")}
            className="text-cyan-600 hover:text-cyan-700 font-medium"
          >
            Back to History
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
            onClick={() => router.push("/admin/history")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              History Entry #{entry.id}
            </h1>
            <p className="text-gray-600 mt-1">View appointment history details</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Patient Information (Snapshot)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={entry.name}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={entry.email}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={entry.phone}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service
                  </label>
                  <input
                    type="text"
                    value={entry.service}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment Date
                  </label>
                  <input
                    type="text"
                    value={entry.appointment_date}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment Time
                  </label>
                  <input
                    type="text"
                    value={entry.appointment_time}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>

                {entry.doctor_name && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Doctor
                    </label>
                    <input
                      type="text"
                      value={`${entry.doctor_name} (ID: ${entry.doctor_id})`}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={entry.message || ""}
                    readOnly
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Status Change Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Status Change Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Previous Status
                    </label>
                    <span
                      className={`inline-block px-3 py-2 text-sm font-medium rounded-lg ${getStatusBadge(
                        entry.previous_status
                      )}`}
                    >
                      {entry.previous_status}
                    </span>
                  </div>
                  <div className="text-2xl text-gray-400 mt-6">→</div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Status
                    </label>
                    <span
                      className={`inline-block px-3 py-2 text-sm font-medium rounded-lg ${getStatusBadge(
                        entry.new_status
                      )}`}
                    >
                      {entry.new_status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Changed By
                  </label>
                  <input
                    type="text"
                    value={entry.changed_by}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>

                {entry.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={entry.notes}
                      readOnly
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timestamp
                  </label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(entry.timestamp), "MMM dd, yyyy HH:mm:ss")}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visit Status
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full ${entry.status === 'visited' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {entry.status || 'unvisited'}
                    </span>
                    {entry.status !== 'visited' && (
                      <button
                        onClick={async () => {
                          try {
                            await apiClient.post(`/api/history/${entry.id}/mark_visited/`);
                            // refresh
                            await fetchEntry();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                      >
                        Mark visited
                      </button>
                    )}
                  </div>
                </div>
                {entry.appointment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Original Appointment ID
                    </label>
                    <p className="text-sm text-gray-900">#{entry.appointment}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
