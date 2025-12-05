"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { authService } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { Calendar, Users, History, MessageSquare, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { Search } from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  totalAppointments: number;
  pendingAppointments: number;
  approvedAppointments: number;
  rejectedAppointments: number;
  totalDoctors: number;
  totalFeedback: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    pendingAppointments: 0,
    approvedAppointments: 0,
    rejectedAppointments: 0,
    totalDoctors: 0,
    totalFeedback: 0,
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  // Search state for phone lookup across appointments and history
  const [searchPhone, setSearchPhone] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

function handleNav(id: string, type: string) {
    if (type === 'active') {
      router.push(`/admin/appointments/${id}`);
    } else if (type === 'history') {
      router.push(`/admin/history/${id}`);
    }
}

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await authService.verifyAuth();
      if (!isValid) {
        router.push("/admin/login");
        return;
      }

      const userData = authService.getUser();
      setUser(userData);
      fetchStats();
    };

    checkAuth();
  }, [router]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch appointments
      const appointmentsRes = await apiClient.get<any>("/api/appointments/");
      const appointments = await appointmentsRes.results || appointmentsRes || [];


      // Fetch doctors
      const doctorsRes = await apiClient.get<any>("/api/doctors/");
      const doctors = doctorsRes.results || doctorsRes || [];

      // Fetch feedback (may not exist yet)
      let feedback: any[] = [];
      try {
        const feedbackRes = await apiClient.get<any>("/api/feedback/");
        feedback = feedbackRes.results || feedbackRes || [];
      } catch (err) {
        console.log("Feedback endpoint not available");
      }

      setStats({
        totalAppointments: appointments.length,
        pendingAppointments: appointments.filter((a: any) => a.status === "PENDING").length,
        approvedAppointments: appointments.filter((a: any) => a.status === "APPROVED").length,
        rejectedAppointments: appointments.filter((a: any) => a.status === "REJECTED").length,
        totalDoctors: doctors.length,
        totalFeedback: feedback.length,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Appointments",
      value: stats.totalAppointments,
      icon: Calendar,
      color: "bg-blue-500",
      link: "/admin/appointments",
    },
    {
      title: "Pending",
      value: stats.pendingAppointments,
      icon: Clock,
      color: "bg-yellow-500",
      link: "/admin/appointments?status=PENDING",
    },
    {
      title: "Approved",
      value: stats.approvedAppointments,
      icon: TrendingUp,
      color: "bg-green-500",
      link: "/admin/appointments?status=APPROVED",
    },
    {
      title: "Doctors",
      value: stats.totalDoctors,
      icon: Users,
      color: "bg-purple-500",
      link: "/admin/doctors",
    },
    {
      title: "History Records",
      value: stats.approvedAppointments + stats.rejectedAppointments,
      icon: History,
      color: "bg-cyan-500",
      link: "/admin/history",
    },
    {
      title: "Feedback",
      value: stats.totalFeedback,
      icon: MessageSquare,
      color: "bg-pink-500",
      link: "/admin/feedback",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.username || "Admin"}!
          </h1>
          <p className="text-cyan-100">
            Here's what's happening with your dental clinic today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))
          ) : (
            statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Link
                  key={index}
                  href={card.link}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {card.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {card.value}
                      </p>
                    </div>
                    <div
                      className={`${card.color} p-3 rounded-lg group-hover:scale-110 transition`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/appointments"
              className="flex items-center justify-center px-4 py-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg transition font-medium"
            >
              <Calendar className="w-5 h-5 mr-2" />
              View Appointments
            </Link>
            <Link
              href="/admin/doctors"
              className="flex items-center justify-center px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition font-medium"
            >
              <Users className="w-5 h-5 mr-2" />
              Manage Doctors
            </Link>
            <Link
              href="/admin/history"
              className="flex items-center justify-center px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition font-medium"
            >
              <History className="w-5 h-5 mr-2" />
              View History
            </Link>
            <Link
              href="/admin/feedback"
              className="flex items-center justify-center px-4 py-3 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-lg transition font-medium"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              View Feedback
            </Link>
          </div>
        </div>

        {/* Phone search (appointments + history) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Search Appointments by Phone</h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                placeholder="Enter phone number"
                value={searchPhone}
                onChange={async (e) => {
                  setSearchPhone(e.target.value)

                  setSearchLoading(true);
                  setSearchError("");
                  try {
                    const res = await apiClient.get<any>(`/api/appointments/by_phone/`, { phone: searchPhone });
                    setSearchResults(Array.isArray(res) ? res : (res.results || []));
                  } catch (err: any) {
                    setSearchError(err.message || 'No results');
                    setSearchResults([]);
                  } finally {
                    setSearchLoading(false);
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>
            <button
              onClick={async () => {
                setSearchLoading(true);
                setSearchError("");
                try {
                  const res = await apiClient.get<any>(`/api/appointments/by_phone/`, { phone: searchPhone });
                  setSearchResults(Array.isArray(res) ? res : (res.results || []));
                } catch (err: any) {
                  setSearchError(err.message || 'No results');
                  setSearchResults([]);
                } finally {
                  setSearchLoading(false);
                }
              }}
              disabled={!searchPhone.trim() || searchLoading}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-700 transition"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Results */}
          <div className="mt-4">
            {searchLoading ? (
              <p className="text-gray-500">Searching...</p>
            ) : searchError ? (
              <p className="text-red-500">{searchError}</p>
            ) : searchResults.length === 0 ? (
              <p className="text-gray-500">No results</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {searchResults.map((r) => (
                  <div key={`${r._source}:${r.id}`} className="py-3 flex items-center justify-between hover:cursor-pointer hover:bg-gray-200 transition" onClick={()=>handleNav(r.id,r._source)}>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {r.name} <span className="text-xs text-gray-500">({r._source})</span>
                      </div>
                      <div className="text-sm text-gray-500">{r.phone} • {r.appointment_date || r.timestamp || ''} {r.appointment_time || ''}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r._source === 'history' && (
                        <div className="text-sm text-gray-700">Status: <span className="font-medium">{r.status || 'unvisited'}</span></div>
                      )}
                      
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Username</p>
                <p className="text-base font-medium text-gray-900">{user.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-base font-medium text-gray-900">{user.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Superuser
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
//TODO: add service button in create doctor page 