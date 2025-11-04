"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiClient } from "@/lib/api";
import { Appointment, AppointmentHistory, Doctor } from "@/lib/types";
import { ArrowLeft, Check, X, Save, History as HistoryIcon } from "lucide-react";
import { format } from "date-fns";

const safeFormatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? "N/A" : format(parsed, "MMM dd, yyyy HH:mm");
};

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [history, setHistory] = useState<AppointmentHistory[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAppointment();
      fetchHistory();
      fetchDoctors();
    }
  }, [id]);

  const fetchAppointment = async () => {
    try {
      const data = await apiClient.get<Appointment>(`/api/appointments/${id}/`);
      setAppointment(data);
      setAdminNotes(data.admin_notes || "");
    } catch (err: any) {
      setError(err.message || "Failed to fetch appointment");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      // Try to fetch history for this specific appointment
      const response = await apiClient.get<any>("/api/history/", {
        appointment: id,
      });
      
      if (response.results) {
        setHistory(response.results);
      } else if (Array.isArray(response)) {
        setHistory(response.filter((h: AppointmentHistory) => h.appointment === Number(id)));
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get<any>("/api/doctors/");
      if (response.results) {
        setDoctors(response.results);
      } else if (Array.isArray(response)) {
        setDoctors(response);
      }
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    }
  };

  const handleStatusChange = async (newStatus: "APPROVED" | "REJECTED") => {
    if (!appointment) return;

    const confirmed = window.confirm(
      `Are you sure you want to ${newStatus.toLowerCase()} this appointment?`
    );
    
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      const updated = await apiClient.patch<Appointment>(
        `/api/appointments/${id}/`,
        {
          status: newStatus,
          admin_notes: adminNotes,
        }
      );

      setAppointment(updated);
      alert(`Appointment ${newStatus.toLowerCase()} successfully!`);
      
      // Refresh history to show the new entry
      await fetchHistory();
      
      // ✅ Django deletes approved/rejected appointments - redirect to list
      // The appointment is now in history, not in active appointments
      setTimeout(() => {
        router.push("/admin/appointments");
      }, 1500);
    } catch (err: any) {
      setError(err.message || `Failed to ${newStatus.toLowerCase()} appointment`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!appointment) return;

    setSaving(true);
    setError("");

    try {
      const updated = await apiClient.patch<Appointment>(
        `/api/appointments/${id}/`,
        {
          admin_notes: adminNotes,
        }
      );

      setAppointment(updated);
      alert("Notes saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save notes");
    } finally {
      setSaving(false);
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
          <p className="text-gray-600">Loading appointment...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!appointment) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-gray-600 mb-4">Appointment not found</p>
          <button
            onClick={() => router.push("/admin/appointments")}
            className="text-cyan-600 hover:text-cyan-700 font-medium"
          >
            Back to Appointments
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/appointments")}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Appointment #{appointment.id}
              </h1>
              <p className="text-gray-600 mt-1">View and manage appointment details</p>
            </div>
          </div>

          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(
              appointment.status
            )}`}
          >
            {appointment.status}
          </span>
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
                Patient Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={appointment.name}
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
  value={appointment.email ?? ""}
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
                    value={appointment.phone}
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
                    value={appointment.service}
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
                    value={appointment.appointment_date}
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
                    value={appointment.appointment_time}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={appointment.message || ""}
                    readOnly
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Admin Notes
              </h2>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                placeholder="Add internal notes about this appointment..."
              />
              <div className="mt-4">
                <button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Notes
                </button>
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <HistoryIcon className="w-5 h-5 mr-2" />
                    History
                  </h2>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-sm text-cyan-600 hover:text-cyan-700"
                  >
                    {showHistory ? "Hide" : "Show"}
                  </button>
                </div>

                {showHistory && (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="border-l-4 border-cyan-500 pl-4 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {entry.previous_status} → {entry.new_status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {safeFormatDate(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Changed by: {entry.changed_by}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            Notes: {entry.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            {appointment.status === "PENDING" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => handleStatusChange("APPROVED")}
                    disabled={saving}
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange("REJECTED")}
                    disabled={saving}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created At
                  </label>
                  <p className="text-sm text-gray-900">
                    {safeFormatDate(appointment.created_at)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Updated At
                  </label>
                 <p className="text-sm text-gray-900">
  {safeFormatDate(appointment.updated_at)}
</p>

                </div>
                {appointment.doctor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned Doctor
                    </label>
                    <p className="text-sm text-gray-900">
                      {doctors.find((d) => d.id === appointment.doctor)?.name || `Doctor #${appointment.doctor}`}
                    </p>
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
