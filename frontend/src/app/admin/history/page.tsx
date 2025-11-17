"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiClient } from "@/lib/api";
import { AppointmentHistory } from "@/lib/types";
import { Search, Eye } from "lucide-react";
import { format } from "date-fns";
import debounce from "lodash/debounce";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<AppointmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(""); // live phone number search
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        ...(search && { phone: search }), // search by phone number
      });

      const url = `/api/history/?${params}`;
      const response = await fetch(url);

      if (!response.ok) {
        // Try to parse error response safely
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      // Safe JSON parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server did not return valid JSON.");
      }

      const responseText = await response.text();
      if (process.env.NODE_ENV === "development") {
        console.log("Raw response:", responseText.substring(0, 500));
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Response text:", responseText.substring(0, 500));
        throw new Error("Server returned invalid JSON. Please check the console for details.");
      }

      if (!data) {
        setHistory([]);
        setTotalCount(0);
      } else if (data.results) {
        setHistory(data.results);
        setTotalCount(data.count || 0);
      } else if (Array.isArray(data)) {
        setHistory(data);
        setTotalCount(data.length);
      } else {
        setHistory([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      console.error("Error fetching history:", err);
      setError(err.message || "Failed to fetch history");
      setHistory([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  // Debounced version for search
  const debouncedFetch = useCallback(
    debounce(() => {
      fetchHistory();
    }, 300),
    [fetchHistory]
  );

  useEffect(() => {
    if (search) {
      debouncedFetch();
    } else {
      fetchHistory();
    }

    return () => {
      debouncedFetch.cancel();
    };
  }, [page, search, fetchHistory, debouncedFetch]);

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointment History</h1>
          <p className="text-gray-600 mt-1">{search ? `Searching phone: ${search}` : "View all appointment status changes"}</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Live search by phone number (digits only)..."
              value={search}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // Strip non-digits
                setSearch(value);
                setPage(1); // Reset to first page on search
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Changed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visit Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Loading history...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No history found
                    </td>
                  </tr>
                ) : (
                  history.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/history/${entry.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{entry.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.name}
                        </div>
                        <div className="text-sm text-gray-500">{entry.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                              entry.previous_status
                            )}`}
                          >
                            {entry.previous_status}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                              entry.new_status
                            )}`}
                          >
                            {entry.new_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.changed_by}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(entry.timestamp), "MMM dd, yyyy HH:mm")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full ${entry.visited === 'visited' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {entry.visited || 'unvisited'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/history/${entry.id}`);
                            }}
                            className="text-cyan-600 hover:text-cyan-900 font-medium"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {entry.visited !== 'visited' && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await apiClient.post(`/api/history/${entry.id}/mark_visited/`);
                                  setHistory((prev) => prev.map((h) => (h.id === entry.id ? { ...h, visited: 'visited' } : h)));
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="px-2 py-1 text-sm bg-green-50 text-green-700 rounded-md"
                            >
                              Mark visited
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, totalCount)} of {totalCount} results
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
