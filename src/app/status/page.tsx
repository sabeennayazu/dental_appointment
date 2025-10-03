"use client";

import { useState, useEffect } from "react";
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
      const phoneEncoded = encodeURIComponent(phoneNumber);
      const [byPhoneRes, historyRes] = await Promise.allSettled([
        fetch(`http://localhost:8000/api/appointments/by_phone/?phone=${phoneEncoded}`),
        fetch(`http://localhost:8000/api/history/`),
      ]);

      let results: any[] = [];

      if (byPhoneRes.status === "fulfilled") {
        const res = byPhoneRes.value as Response;
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            results = results.concat(data.map((r: any) => ({ ...r })));
          }
        }
      }

      if (historyRes.status === "fulfilled") {
        const res = historyRes.value as Response;
        if (res.ok) {
          const hdata = await res.json();
          if (Array.isArray(hdata)) {
            const digits = (s: string | undefined | null) => (s ? s.replace(/\D/g, "") : "");
            const q = digits(phoneNumber);
            const filtered = hdata
              .filter((h: any) => digits(h.phone) === q)
              .map((h: any) => ({ ...h, _source: "history" }));
            const existingKeys = new Set(results.map((r) => `${r._source || "active"}:${r.id}`));
            filtered.forEach((f: any) => {
              const key = `history:${f.id}`;
              if (!existingKeys.has(key)) {
                results.push(f);
                existingKeys.add(key);
              }
            });
          }
        }
      }

      if (!results || results.length === 0) {
        setError("No appointments found");
        setAppointments([]);
        setLoading(false);
        return;
      }

      results = results.map((item: any) => {
        const copy = { ...item };
        if (copy._source === "active" && copy.doctor) {
          copy.doctor_name =
            copy.doctor && doctorsMap[String(copy.doctor)]
              ? doctorsMap[String(copy.doctor)]
              : copy.doctor_name || "";
        }
        return copy;
      });

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
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
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

      {loading && <p className="text-center text-gray-500">Loading...</p>}
      {error && !loading && <p className="text-center text-red-500">{error}</p>}

      {appointments.length > 0 && !loading && (
        <div className="space-y-6">
          {appointments.map((a) => (
            <article
              key={a.id}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-transform hover:scale-[1.01]"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
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
                      <Calendar size={20} className="text-teal-500 mt-1" />
                      <div>
                        <dt className="text-black font-bold text-base">Date</dt>
                        <dd className="text-gray-800 mt-1">
                          {a.appointment_date ? formatDate(a.appointment_date) : "—"}
                        </dd>
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
      classes = "bg-red-100 text-red-800";
      icon = <AlertTriangle size={16} className="mr-1" />;
    } else {
      label = "Approved";
      classes = "bg-blue-100 text-blue-800";
      icon = <CheckCircle size={16} className="mr-1" />;
    }
  } else if (rawStatus === "REJECTED") {
    label = "Rejected";
    classes = "bg-red-300 text-red-700";
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
