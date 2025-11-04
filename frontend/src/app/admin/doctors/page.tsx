"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiClient } from "@/lib/api";
import { Doctor, SERVICE_CHOICES } from "@/lib/types";
import { Search, Plus, Eye, Edit } from "lucide-react";
import debounce from "lodash/debounce";

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        ...(serviceFilter && { service: serviceFilter }),
      });

      const url = `/api/doctors/?${params}`;
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
        setDoctors(data.results);
      } else if (Array.isArray(data)) {
        setDoctors(data);
      } else {
        setDoctors([]);
      }
    } catch (err: any) {
      console.error("Error fetching doctors:", err);
      setError(err.message || "Failed to fetch doctors");
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [serviceFilter]);

  // Debounced version for search
  const debouncedFetch = useCallback(
    debounce(() => {
      fetchDoctors();
    }, 300),
    [fetchDoctors]
  );

  useEffect(() => {
    if (search) {
      // For client-side filtering, we still fetch all but don't debounce the fetch
      fetchDoctors();
    } else {
      fetchDoctors();
    }

    return () => {
      debouncedFetch.cancel();
    };
  }, [serviceFilter, fetchDoctors, debouncedFetch, search]);

  const filteredDoctors = doctors.filter((doctor) =>
    search
      ? doctor.name.toLowerCase().includes(search.toLowerCase()) ||
        doctor.email?.toLowerCase().includes(search.toLowerCase()) ||
        doctor.phone?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
            <p className="text-gray-600 mt-1">Manage doctors and their services</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="sm:w-64">
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              >
                <option value="">All Services</option>
                {SERVICE_CHOICES.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
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
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                      Loading doctors...
                    </td>
                  </tr>
                ) : filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No doctors found
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <tr
                      key={doctor.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/doctors/${doctor.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{doctor.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {doctor.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doctor.service}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doctor.email}</div>
                        <div className="text-sm text-gray-500">{doctor.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            doctor.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {doctor.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/doctors/${doctor.id}`);
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
        </div>
      </div>
    </AdminLayout>
  );
}
