"use client";

import { useState } from "react";
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  MessageSquare,
  ClipboardList,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

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
  // when result comes from history serializer
  _source?: "active" | "history";
  previous_status?: string | null;
  new_status?: string | null;
  timestamp?: string | null;
};

export default function StatusPage() {
  const [phone, setPhone] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAppointments = async (phoneNumber: string) => {
    setLoading(true);
    setError("");
    setAppointments([]);
    try {
      const res = await fetch(
        `http://localhost:8000/api/appointments/by_phone/?phone=${encodeURIComponent(
          phoneNumber
        )}`
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      // backend returns a mixed list of active appointments and history entries
      const list = (data || []) as any[];

      if (!list || list.length === 0) {
        setError("No information found for this phone number.");
      } else {
        // normalize created time for sorting: active -> created_at, history -> timestamp
        const withDates = list.map((item) => {
          const created = item.created_at || item.timestamp || null;
          return { ...item, __sortDate: created };
        });

        // sort by most recent first
        withDates.sort((a, b) => {
          const ta = a.__sortDate ? new Date(a.__sortDate).getTime() : 0;
          const tb = b.__sortDate ? new Date(b.__sortDate).getTime() : 0;
          return tb - ta;
        });

        setAppointments(withDates as any);
      }
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

  return (
    <section className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-10">
        Check Your Appointment Status
      </h1>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
      >
        <input
          type="tel"
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-xl border border-gray-300 px-4 py-3 w-full sm:w-2/3 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        <button
          type="submit"
          className="rounded-xl bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-all shadow-md"
        >
          Check Status
        </button>
      </form>

      {/* Loading */}
      {loading && <p className="text-center text-gray-500">Loading...</p>}

      {/* Error */}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* Appointments */}
      {appointments.length > 0 && (
        <div className="space-y-6">
          {appointments.map((a) => (
            <article
              key={a.id}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-transform hover:scale-[1.01]"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                {/* Left column */}
                <div className="flex-1 space-y-5">
                  <h3 className="text-xl font-semibold text-gray-800">
                    <div className="flex items-center gap-3">
                      <span>{a.name}</span>
                      {a._source === "history" && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          History
                        </span>
                      )}
                    </div>
                  </h3>
                  <div className="flex items-center text-sm gap-2">
                    <Phone size={16} className="text-green-500" />{" "}
                    <span className="text-gray-500">{a.phone}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <Mail size={16} className="text-indigo-500" />{" "}
                    <span className="text-gray-500">{a.email}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                    {/* Service */}
                    <div className="flex items-start gap-2">
                      <ClipboardList size={20} className="text-blue-500 mt-1" />
                      <div>
                        <dt className="text-black font-bold text-base">
                          Service
                        </dt>
                        <dd className="text-gray-800 mt-1">{a.service || "—"}</dd>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-start gap-2">
                      <Calendar size={20} className="text-teal-500 mt-1" />
                      <div>
                        <dt className="text-black font-bold text-base">Date</dt>
                        <dd className="text-gray-800 mt-1">
                          {a.appointment_date ? formatDate(a.appointment_date) : "—"}
                        </dd>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-start gap-2">
                      <Clock size={20} className="text-orange-500 mt-1" />
                      <div>
                        <dt className="text-black font-bold text-base">Time</dt>
                        <dd className="text-gray-800 mt-1">
                          {formatTime(a.appointment_time)}
                        </dd>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="sm:col-span-2 flex items-start gap-2">
                      <MessageSquare size={20} className="text-purple-500 mt-1" />
                      <div>
                        <dt className="text-black font-bold text-base">Message</dt>
                        <dd className="text-gray-800 mt-1">{a.message || "—"}</dd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column: Status + Notes */}
                <div className="w-full md:w-60 flex-shrink-0 space-y-4">
                  <StatusPill appt={a} />
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p>
                      <span className="font-medium">Notes:</span>{" "}
                      {a.admin_notes || "—"}
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
    </section>
  );
}

function StatusPill({ appt }: { appt: Appointment }) {
  const now = new Date();

  let apptDate: Date | null = null;
  try {
    if (appt.appointment_date) {
      apptDate = new Date(appt.appointment_date + "T" + (appt.appointment_time || "00:00:00"));
    }
  } catch (e) {
    apptDate = null;
  }

  let label = appt.status;
  let classes = "bg-gray-200 text-gray-800";
  let icon = <Clock size={16} className="mr-1" />;

  if (appt.status === "PENDING") {
    label = "Pending";
    classes = "bg-yellow-100 text-yellow-800";
    icon = <Clock size={16} className="mr-1" />;
  } else if (appt.status === "APPROVED") {
    if (apptDate && apptDate < now) {
      label = "Overdue";
      classes = "bg-red-100 text-red-800";
      icon = <AlertTriangle size={16} className="mr-1" />;
    } else {
      label = "Approved";
      classes = "bg-blue-100 text-blue-800";
      icon = <CheckCircle size={16} className="mr-1" />;
    }
  } else if (appt.status === "REJECTED") {
    label = "Rejected";
    classes = "bg-gray-200 text-gray-700";
    icon = <XCircle size={16} className="mr-1" />;
  }

  return (
    <span className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${classes}`}>
      {icon} {label}
    </span>
  );
}
