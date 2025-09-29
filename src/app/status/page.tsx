"use client";

import { useState } from "react";

type Appointment = {
  id: number;
  date: string;
  time: string;
  service: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
};

export default function StatusPage() {
  const [phone, setPhone] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mock API function (replace with real API call)
  const fetchAppointments = async (phoneNumber: string) => {
    setLoading(true);
    setError("");
    setAppointments([]);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      const mockData: Appointment[] = [
        {
          id: 1,
          date: "2025-10-05",
          time: "10:00 AM",
          service: "General Checkup",
          status: "pending",
        },
        {
          id: 2,
          date: "2025-10-12",
          time: "2:00 PM",
          service: "Dental Cleaning",
          status: "confirmed",
        },
      ];

      // Simulate "phone not found"
      if (phoneNumber !== "9876543210") {
        setAppointments([]);
        setError("No appointments found for this phone number.");
      } else {
        setAppointments(mockData);
      }
    } catch (err) {
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

  return (
    <section className="max-w-4xl mx-auto px-4 py-16">
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
          className="rounded-xl border border-gray-300 px-4 py-3 w-full sm:w-2/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-xl bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-all"
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
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center border rounded-xl p-4 shadow-sm hover:shadow-md transition"
            >
              <div>
                <p className="text-gray-700">
                  <span className="font-semibold">Service:</span> {appt.service}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Date:</span> {appt.date}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Time:</span> {appt.time}
                </p>
              </div>
              <div className="mt-2 sm:mt-0">
                <span
                  className={`px-4 py-1 rounded-full text-sm font-semibold ${
                    appt.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : appt.status === "confirmed"
                      ? "bg-blue-100 text-blue-800"
                      : appt.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {appt.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
