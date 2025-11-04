"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiClient } from "@/lib/api";
import { Feedback } from "@/lib/types";
import { Search, Eye } from "lucide-react";
import { format } from "date-fns";
import debounce from "lodash/debounce";

export default function FeedbackPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(""); // live phone number search
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        ...(search && { phone: search }), // search by phone number
      });

      const url = `/api/feedback/?${params}`;
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

      if (data.results) {
        setFeedback(data.results);
        setTotalCount(data.count || 0);
      } else if (Array.isArray(data)) {
        setFeedback(data);
        setTotalCount(data.length);
      } else {
        setFeedback([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      console.error("Error fetching feedback:", err);
      setError(err.message || "Failed to fetch feedback");
      setFeedback([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  // Debounced version for search
  const debouncedFetch = useCallback(
    debounce(() => {
      fetchFeedback();
    }, 300),
    [fetchFeedback]
  );

  useEffect(() => {
    if (search) {
      debouncedFetch();
    } else {
      fetchFeedback();
    }

    return () => {
      debouncedFetch.cancel();
    };
  }, [page, search, fetchFeedback, debouncedFetch]);

  // Note: Search is now handled server-side via the API
  const filteredFeedback = feedback;

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
          <p className="text-gray-600 mt-1">{search ? `Searching phone: ${search}` : "View customer feedback and messages"}</p>
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
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Loading feedback...
                    </td>
                  </tr>
                ) : filteredFeedback.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No feedback found
                    </td>
                  </tr>
                ) : (
                  filteredFeedback.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/feedback/${item.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{item.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{item.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(item.created_at), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/feedback/${item.id}`);
                          }}
                          className="text-cyan-600 hover:text-cyan-900 font-medium"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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
