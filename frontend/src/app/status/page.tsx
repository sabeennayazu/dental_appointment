"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Footer from "../components/footer";
import {
  Phone,
  Mail,
  Calendar as CalendarIcon,
  Clock,
  MessageSquare,
  ClipboardList,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  CalendarDays,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type React from "react";

type Appointment = {
  id: number;
  name: string;
  email: string;
  phone: string;
  appointment_date: string;
  appointment_time?: string | null;
  service: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  message?: string;
  admin_notes?: string | null;
  created_at?: string | null;
  _source?: "active" | "history";
  previous_status?: string | null;
  new_status?: string | null;
  timestamp?: string | null;
  doctor?: number | null;
  doctor_name?: string | null;
};

export default function StatusPage() {
  const [phone, setPhone] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [doctorsMap, setDoctorsMap] = useState<Record<string, string>>({});

  // Calendar state
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  

  // Polling
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("http://localhost:8000/api/doctors/")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          const map: Record<string, string> = {};
          data.forEach((d: any) => {
            if (d && d.id) map[String(d.id)] = d.name;
          });
          setDoctorsMap(map);
        }
      })
      .catch((err) => console.error(err));
    return () => {
      mounted = false;
    };
  }, []);

  const fetchAppointments = async (phoneNumber: string) => {
    setLoading(true);
    setError("");
    setAppointments([]);
    try {
      // Fetch from both appointments and history endpoints
      const [appointmentsRes, historyRes] = await Promise.all([
        fetch(`http://localhost:8000/api/appointments/`),
        fetch(`http://localhost:8000/api/history/`)
      ]);

      if (!appointmentsRes.ok || !historyRes.ok) {
        throw new Error("Server error");
      }

      const appointmentsData = await appointmentsRes.json();
      const historyData = await historyRes.json();

      // Extract results from paginated responses
      let activeAppointments: any[] = [];
      let historyRecords: any[] = [];

      if (Array.isArray(appointmentsData)) {
        activeAppointments = appointmentsData;
      } else if (appointmentsData.results && Array.isArray(appointmentsData.results)) {
        activeAppointments = appointmentsData.results;
      }

      if (Array.isArray(historyData)) {
        historyRecords = historyData;
      } else if (historyData.results && Array.isArray(historyData.results)) {
        historyRecords = historyData.results;
      }

      // ✅ EXACT MATCH ONLY - filter by exact phone number
      const normalizePhone = (phone: string) => {
        // Remove all non-digit characters for comparison
        return phone.replace(/\D/g, '');
      };

      const searchPhone = normalizePhone(phoneNumber);

      // Filter active appointments with exact match
      const matchedActive = activeAppointments.filter((appt: any) => {
        if (!appt.phone) return false;
        return normalizePhone(appt.phone) === searchPhone;
      }).map((appt: any) => ({
        ...appt,
        _source: 'active',
        doctor_name: appt.doctor && doctorsMap[String(appt.doctor)]
          ? doctorsMap[String(appt.doctor)]
          : appt.doctor_name || ""
      }));

      // Filter history records with exact match
      const matchedHistory = historyRecords.filter((hist: any) => {
        if (!hist.phone) return false;
        return normalizePhone(hist.phone) === searchPhone;
      }).map((hist: any) => ({
        ...hist,
        _source: 'history'
      }));

      // Combine results
      let results = [...matchedActive, ...matchedHistory];

      if (results.length === 0) {
        setError("No appointments found for this phone number");
        setAppointments([]);
        setLoading(false);
        return;
      }

      // Sort by date (most recent first)
      const parseApptDate = (it: any) => {
        if (it.appointment_date) {
          const t = it.appointment_time || "00:00:00";
          return new Date(it.appointment_date + "T" + t).getTime();
        }
        if (it.timestamp) return new Date(it.timestamp).getTime();
        if (it.created_at) return new Date(it.created_at).getTime();
        return 0;
      };

      results.sort((a: any, b: any) => parseApptDate(b) - parseApptDate(a));

      setAppointments(results as any);
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError("Please enter a phone number.");
      return;
    }
    fetchAppointments(phone);
  };

  const formatTime = (time?: string | null) => {
    if (!time) return "—";
    const [hour, minute] = time.split(":").map(Number);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ===== Calendar & Filters Helpers =====
  const normalizeStatus = (appt: Appointment) => {
    const raw = appt._source === "history" ? appt.new_status || appt.status : appt.status;
    return (raw || "").toUpperCase();
  };

  const isOverdue = (appt: Appointment) => {
    const st = normalizeStatus(appt);
    if (st !== "APPROVED") return false;
    if (!appt.appointment_date) return false;
    const t = appt.appointment_time || "00:00:00";
    const when = new Date(`${appt.appointment_date}T${t}`);
    return when.getTime() < today.getTime();
  };

  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
  const startWeekDay = start.getDay(); // Sunday=0
    const days: Date[] = [];
    for (let i = 0; i < startWeekDay; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() - (startWeekDay - i));
      days.push(d);
    }
    for (let dnum = 1; dnum <= end.getDate(); dnum++) {
      days.push(new Date(start.getFullYear(), start.getMonth(), dnum));
    }
    while (days.length % 7 !== 0 || days.length < 42) {
      const last = days[days.length - 1];
      const next = new Date(last);
      next.setDate(next.getDate() + 1);
      days.push(next);
    }
    return days;
  }, [currentMonth]);

  // Determine highest-priority status for a list of appointments on a day
  const dayPriorityStatus = (appts: Appointment[]) => {
    if (!appts || appts.length === 0) return null;
    // Priority: Overdue > Pending > Approved > Rejected
    const hasOverdue = appts.some((a) => isOverdue(a));
    if (hasOverdue) return "OVERDUE";
    const hasPending = appts.some((a) => normalizeStatus(a) === "PENDING");
    if (hasPending) return "PENDING";
    const hasApproved = appts.some((a) => normalizeStatus(a) === "APPROVED");
    if (hasApproved) return "APPROVED";
    const hasRejected = appts.some((a) => normalizeStatus(a) === "REJECTED");
    if (hasRejected) return "REJECTED";
    return null;
  };

  const dayStatusClass = (status: string | null) => {
    switch (status) {
      case "OVERDUE":
        return "bg-red-400 text-white";
      case "PENDING":
        return "bg-yellow-300 text-gray-900";
      case "APPROVED":
        return "bg-green-300 text-gray-900";
      case "REJECTED":
        return "bg-red-100 text-gray-900";
      default:
        return "";
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const st = normalizeStatus(a);
      if (statusFilter !== "ALL") {
        if (statusFilter === "OVERDUE") {
          if (!isOverdue(a)) return false;
        } else if (st !== statusFilter) return false;
      }
      return true;
    });
  }, [appointments, statusFilter]);

  const apptsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    filteredAppointments.forEach((a) => {
      if (!a.appointment_date) return;
      const key = a.appointment_date;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [filteredAppointments]);

  const distinctDentists = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => {
      const dn = (a.doctor_name || a.doctor || "").toString();
      if (dn) set.add(dn);
    });
    return Array.from(set);
  }, [appointments]);

  const openDayModal = (d: Date) => {
    setSelectedDate(d);
    setIsModalOpen(true);
  };
  const closeDayModal = () => setIsModalOpen(false);

  const handleKeyNav = useCallback((e: KeyboardEvent) => {
    if (!isModalOpen) {
      if (e.key === "ArrowLeft") setCurrentMonth((m) => addMonths(m, -1));
      if (e.key === "ArrowRight") setCurrentMonth((m) => addMonths(m, 1));
    }
  }, [isModalOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKeyNav(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKeyNav]);

  const legendDot = (color: string) => (
    <span className={`inline-block w-3 h-3 rounded-full ${color}`} />
  );

  const stateColor = (a: Appointment) => {
    const st = normalizeStatus(a);
    if (st === "PENDING") return "bg-yellow-400";
    if (st === "APPROVED") return isOverdue(a) ? "bg-red-500" : "bg-green-500";
    if (st === "REJECTED") return "bg-red-400";
    return "bg-gray-300";
  };

  const monthLabel = useMemo(() => {
    return currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [currentMonth]);

  // Polling every 60s when phone present
  useEffect(() => {
    if (!phone) return;
    const id = setInterval(() => fetchAppointments(phone), 60000);
    return () => clearInterval(id);
  }, [phone]);

  const handleRefresh = () => {
    if (!phone) return;
    fetchAppointments(phone);
  };
  // Clear appointments when phone number is erased
useEffect(() => {
  if (phone.trim() === "") {
    setAppointments([]);
    setError("");
  }
}, [phone]);


  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">Appointment Status</h1>

      {/* SEARCH: only visible initially (heading + search box + check status) */}
      <div className="bg-white rounded-2xl p-4 mb-6 flex items-center justify-center">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="flex-1 flex gap-2">
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl border border-gray-300 px-4 py-3 w-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
            >
              <CalendarDays size={18} />
              Check Status
            </button>
          </div>
        </form>
      </div>

      {/* show loading / error as before */}
      {loading && <p className="text-center text-gray-500">Loading...</p>}
      {error && !loading && <p className="text-center text-red-500">{error}</p>}

      {/* === ONLY SHOW FILTERS, CARDS, CALENDAR WHEN APPOINTMENTS EXIST === */}
      {appointments.length > 0 && (
        <>
          {/* Controls + Filters (moved Today/Refresh here so they are hidden until data exists) */}
          <div className="bg-white rounded-2xl shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <Filter size={16} />
                  <span>Filters</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="ALL">All statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
                  className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
                  title="Jump to today"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading || !phone}
                  className="rounded-full border px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
                <div className="ml-4 text-xs text-gray-500">
                  {lastSyncedAt ? `Synced ${lastSyncedAt.toLocaleTimeString()}` : "Not synced yet"}
                </div>
              </div>
            </div>
          </div>

          {/* main content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Appointments</h2>
              {appointments.length === 0 && !loading ? (
                <div className="rounded-2xl border border-dashed p-6 text-center text-gray-500">No appointments yet.</div>
              ) : filteredAppointments.length === 0 && !loading ? (
                <div className="rounded-2xl border border-dashed p-6 text-center text-gray-500">No appointments match the selected filters.</div>
              ) : (
                <div className="space-y-6">
                  {filteredAppointments.map((a) => (
                    <article key={`${a._source || 'active'}:${a.id}`} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-transform hover:scale-[1.01]">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div className="flex-1 space-y-5">
                          <h3 className="text-xl font-semibold text-gray-800">
                            <div className="flex items-center gap-3">
                              <span>{a.name}</span>
                              {a._source === "history" && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">History</span>
                              )}
                            </div>
                          </h3>
                          <div className="flex items-center text-sm gap-2">
                            <Phone size={16} className="text-green-500" />
                            <span className="text-gray-500">{a.phone}</span>
                            <span className="mx-2 text-gray-400">•</span>
                            <Mail size={16} className="text-indigo-500" />
                            <span className="text-gray-500">{a.email}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                            <div className="flex items-start gap-2">
                              <ClipboardList size={20} className="text-blue-500 mt-1" />
                              <div>
                                <dt className="text-black font-bold text-base">Service</dt>
                                <dd className="text-gray-800 mt-1">{a.service || "—"}</dd>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <ClipboardList size={20} className="text-indigo-500 mt-1" />
                              <div>
                                <dt className="text-black font-bold text-base ">Doctor</dt>
                                <dd className="text-gray-800 mt-1">Dr. {a.doctor_name || a.doctor || "—"}</dd>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <CalendarIcon size={20} className="text-teal-500 mt-1" />
                              <div>
                                <dt className="text-black font-bold text-base">Date</dt>
                                <dd className="text-gray-800 mt-1">{a.appointment_date ? formatDate(a.appointment_date) : "—"}</dd>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <Clock size={20} className="text-orange-500 mt-1" />
                              <div>
                                <dt className="text-black font-bold text-base">Time</dt>
                                <dd className="text-gray-800 mt-1">{formatTime(a.appointment_time)}</dd>
                              </div>
                            </div>

                            <div className="sm:col-span-2 flex items-start gap-2">
                              <MessageSquare size={20} className="text-purple-500 mt-1" />
                              <div>
                                <dt className="text-black font-bold text-base">Message</dt>
                                <dd className="text-gray-800 mt-1">{a.message || "—"}</dd>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="w-full md:w-60 flex-shrink-0 space-y-4">
                          <StatusPill appt={a} />
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            <p>
                              <span className="font-medium">Notes:</span> {a.admin_notes || "—"}
                            </p>
                            <p className="mt-2 text-xs text-gray-400">
                              {a._source === "history" ? (
                                <>Status changed: {a.timestamp ? new Date(a.timestamp).toLocaleString() : "—"}</>
                              ) : (
                                <>Submitted: {a.created_at ? new Date(a.created_at).toLocaleString() : "—"}</>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="bg-white rounded-2xl shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button aria-label="Previous month" onClick={() => setCurrentMonth((m) => addMonths(m, -1))} className="rounded-full p-2 hover:bg-gray-100">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button aria-label="Next month" onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="rounded-full p-2 hover:bg-gray-100">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="font-semibold text-gray-800 ml-2">{monthLabel}</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-400" /> Pending</div>
                    <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500" /> Approved</div>
                    <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-500" /> Overdue</div>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-500 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center">{d}</div>
                  ))}
                </div>

                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={monthLabel}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-7 gap-2"
                  >
                    {monthDays.map((d, idx) => {
                      const inCurrent = d.getMonth() === currentMonth.getMonth();
                      const key = toKey(d);
                      const dayAppts = apptsByDate[key] || [];
                      const isToday = isSameDay(d, today);
                      const isSelected = selectedDate && isSameDay(d, selectedDate);
                      // compute unique statuses for this day (preserve order)
                      const statuses: string[] = [];
                      dayAppts.forEach((a) => {
                        const st = isOverdue(a) ? "OVERDUE" : normalizeStatus(a);
                        if (!statuses.includes(st)) statuses.push(st);
                      });

                      const baseBg = inCurrent ? "" : "bg-gray-50 text-gray-400";
                      const isSaturday = d.getDay() === 6;

                      // date text color: if any OVERDUE present, use white for contrast
                      const dateTextCls = statuses.includes("OVERDUE") ? "text-white" : (inCurrent ? "text-gray-700" : "text-gray-400");

                      return (
                        <button
                          key={idx}
                          onClick={() => openDayModal(d)}
                          onMouseEnter={() => setHoverDate(key)}
                          onMouseLeave={() => setHoverDate(null)}
                          title={dayAppts.length ? `${dayAppts.length} appointment(s)` : "No appointments"}
                          className={`relative h-16 rounded-xl ${isSaturday ? 'border-2 border-red-400' : 'border'} p-0 text-left transition-colors overflow-hidden ${baseBg} ${isSelected ? "ring-2 ring-blue-400" : ""}`}
                        >
                          {/* colored segments background */}
                          {statuses.length > 0 && (
                            <div className="absolute inset-0 flex -z-0">
                              {statuses.map((s, i) => {
                                const pct = `${100 / statuses.length}%`;
                                const cls = dayStatusClass(s);
                                // make inner div fill and clip to rounded corners
                                return (
                                  <div
                                    key={i}
                                    style={{ width: pct }}
                                    className={`${cls} h-full`}
                                  />
                                );
                              })}
                            </div>
                          )}

                          <div className="relative z-10 p-2">
                            <div className="flex items-center justify-between">
                              <span className={`text-sm ${dateTextCls}`}>{d.getDate()}</span>
                              {isToday && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Today</span>}
                            </div>
                            <div className="mt-2">
                              {/* service names removed from calendar display per request */}
                              {dayAppts.length > 3 && <div className="text-[11px] text-gray-800">+{dayAppts.length - 3} more</div>}
                            </div>
                          </div>

                          
                        </button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {isModalOpen && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeDayModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-4"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-800">
                  {selectedDate.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
                <button onClick={closeDayModal} className="rounded-full px-3 py-1 text-sm hover:bg-gray-50 border">Close</button>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {(apptsByDate[toKey(selectedDate)] || []).length === 0 ? (
                  <div className="text-sm text-gray-500">No appointments this day.</div>
                ) : (
                  (apptsByDate[toKey(selectedDate)] || []).map((a) => (
                    <div key={a.id} className="rounded-xl border p-3 flex items-start gap-3">
                      <span className={`w-2 h-2 rounded-full mt-1.5 ${stateColor(a)}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">{a.service || "Appointment"}</div>
                        <div className="text-xs text-gray-600">{formatTime(a.appointment_time)} • Dr. {a.doctor_name || a.doctor || "—"}</div>
                        <div className="text-xs text-gray-500 mt-1">{a.message || ""}</div>
                      </div>
                      <StatusPill appt={a} />
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      
      </AnimatePresence>
      
    </section>
  );
}

function StatusPill({ appt }: { appt: Appointment }) {
  const now = new Date();
  let apptDate: Date | null = null;

  if (appt.appointment_date) {
    try {
      apptDate = new Date(appt.appointment_date + "T" + (appt.appointment_time || "00:00:00"));
    } catch {}
  }

  // ✅ Fix: use new_status for history, fallback to status
  const rawStatus = appt._source === "history" ? appt.new_status || appt.status : appt.status;

  let label = rawStatus;
  let classes = "bg-gray-200 text-gray-800";
  let icon = <Clock size={16} className="mr-1" />;

  if (rawStatus === "PENDING") {
    label = "Pending";
    classes = "bg-yellow-100 text-yellow-800";
    icon = <Clock size={16} className="mr-1" />;
  } else if (rawStatus === "APPROVED") {
    if (apptDate && apptDate < now) {
      label = "Overdue";
      classes = "bg-red-200 text-red-800";
      icon = <AlertTriangle size={16} className="mr-1" />;
    } else {
      label = "Approved";
      classes = "bg-blue-200 text-blue-800";
      icon = <CheckCircle size={16} className="mr-1" />;
    }
  } else if (rawStatus === "REJECTED") {
    label = "Rejected";
    classes = "bg-red-200 text-red-700";
    icon = <XCircle size={16} className="mr-1" />;
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${classes}`}
    >
      {icon} {label}
    </span>
  );
}
