"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiClient } from "@/lib/api";
import { Feedback } from "@/lib/types";
import { ArrowLeft, Save } from "lucide-react";
import { format } from "date-fns";

export default function FeedbackDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchFeedback();
    }
  }, [id]);

  const fetchFeedback = async () => {
    try {
      const data = await apiClient.get<Feedback>(`/api/feedback/${id}/`);
      setFeedback(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch feedback");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Loading feedback...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!feedback) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-gray-600 mb-4">Feedback not found</p>
          <button
            onClick={() => router.push("/admin/feedback")}
            className="text-cyan-600 hover:text-cyan-700 font-medium"
          >
            Back to Feedback
          </button>
        </div>
      </AdminLayout>
    );
  }

  const handleSaveChanges = async () => {
    if (!feedback) return;

    setSaving(true);
    setError("");

    try {
      const updated = await apiClient.patch<Feedback>(
        `/api/feedback/${id}/`,
        {
          name: feedback.name,
          phone: feedback.phone,
          message: feedback.message,
        }
      );

      setFeedback(updated);
      alert("Feedback updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/feedback")}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Feedback #{feedback.id}
              </h1>
              <p className="text-gray-600 mt-1">View and edit feedback details</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Feedback Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={feedback.name || ""}
                    onChange={(e) => setFeedback({ ...feedback, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={feedback.phone || ""}
                    onChange={(e) => setFeedback({ ...feedback, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={feedback.message || ""}
                    onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created At
                  </label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(feedback.created_at), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
