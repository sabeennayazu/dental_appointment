'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

import { AnimatedProps } from '@/app/types/animated-props';

interface FormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  doctor: string;
  date: string;
  time: string;
  message: string;
}

interface Doctor {
  id: number;
  name: string;
  service: string;
}

export default function BookNow({ isMobile, animProps }: AnimatedProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    service: "",
    doctor: "",
    date: "",
    time: "",
    message: "",
  });

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const doc = doctors.find((d: Doctor) => String(d.id) === String(val));
    setFormData((s: FormData) => ({ ...s, doctor: val, service: doc ? doc.service : s.service }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    const email = formData.email || "";
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }

    fetch("http://localhost:8000/api/appointments/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        service: formData.service,
        doctor: formData.doctor || null,
        appointment_date: formData.date,
        appointment_time: formData.time,
        message: formData.message,
      }),
    })
      .then(async (res) => {
        const text = await res.text();
        let payload: any = null;
        try { payload = text ? JSON.parse(text) : null; } catch { }
        if (!res.ok) {
          if (payload && typeof payload === "object") {
            const fieldErrors: Record<string, string> = {};
            Object.keys(payload).forEach((k) => {
              const v = payload[k];
              if (Array.isArray(v)) fieldErrors[k] = v.join(" ");
              else if (typeof v === "string") fieldErrors[k] = v;
            });
            setErrors(fieldErrors);
            return Promise.reject(new Error("validation"));
          }
          const msg = payload?.detail || text || "Failed to submit appointment.";
          setGeneralError(msg.toString());
          return Promise.reject(new Error(msg));
        }
        return payload;
      })
      .then((data) => {
        console.log("Created appointment:", data);
        alert("Your appointment request has been submitted!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          service: "",
          doctor: "",
          date: "",
          time: "",
          message: "",
        });
        setErrors({});
      })
      .catch((err) => {
        if (err.message === "validation") return;
        console.error(err);
        if (!generalError) setGeneralError("Failed to submit appointment. Please try again.");
      });
  };

  return (
    <section id="book-now" data-snap className="md:snap-start md:snap-always md:h-screen flex items-center bg-gradient-to-b from-white via-white/20 to-blue-500/50">
      <motion.div
        {...animProps({})}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="overflow-hidden rounded-3xl shadow-2xl md:mt-16 mt-0 ring-1 ring-black/5 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative bg-gradient-to-b from-blue-800 to-blue-600 p-10 lg:p-14 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.12),transparent_35%)]" />
              <div className="relative">
                <h2 className="text-3xl font-bold mb-4">Book Your Appointment</h2>
                <p className="text-blue-100 mb-8">
                  Fill out the form and our team will get back to you within 24 hours to confirm your appointment.
                </p>

                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white/10">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Opening Hours</h3>
                      <p className="text-blue-100">
                        Sunday - Friday: 8:00 AM - 6:00 PM
                        <br />
                        Saturday: 9:00 AM - 4:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 lg:p-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                {generalError && <p className="text-sm text-red-600">{generalError}</p>}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white/90 py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white/90 py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      maxLength={10}
                      pattern="\d{10}"
                      inputMode="numeric"
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white/90 py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-gray-700">Service *</label>
                    <select
                      id="service"
                      name="service"
                      required
                      value={formData.service}
                      onChange={(e) => { handleInputChange(e); setFormData((s: FormData) => ({ ...s, doctor: "" })); }}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white/90 py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a Service</option>
                      <option value="General Checkup">General Checkup</option>
                      <option value="Periodontist">Periodontist</option>
                      <option value="Orthodontics">Orthodontics</option>
                      <option value="Endodontist">Endodontist</option>
                      <option value="Oral Surgery">Oral Surgery</option>
                      <option value="Prosthodontist">Prosthodontist</option>
                    </select>
                    {errors.service && <p className="mt-1 text-sm text-red-600">{errors.service}</p>}
                  </div>

                  <div>
                    <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">Doctor</label>
                    <select
                      id="doctor"
                      name="doctor"
                      required
                      value={formData.doctor}
                      onChange={handleDoctorChange}
                      disabled={!formData.service || loadingDoctors}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white/90 py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="">{formData.service ? "Select a Doctor" : "Select a Service first"}</option>
                      {doctors.filter((d) => d.service === formData.service).map((doc) => (
                        <option key={doc.id} value={doc.id}>Dr. {doc.name}</option>
                      ))}
                    </select>
                    {errors.doctor && <p className="mt-1 text-sm text-red-600">{errors.doctor}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Preferred Date *</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white/90 py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                  </div>
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700">Preferred Time *</label>
                    <select
                      id="time"
                      name="time"
                      required
                      value={formData.time}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white/90 py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a time</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                    </select>
                    {errors.time && <p className="mt-1 text-sm text-red-600">{errors.time}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Problem Description (Optional)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Briefly describe your issue (e.g. Toothache, Gum bleeding, etc.)"
                    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white/90 py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 rounded-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    Book Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}