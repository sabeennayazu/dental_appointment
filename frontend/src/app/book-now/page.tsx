"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

interface Service {
  id: number;
  name: string;
  description: string;
}

interface Doctor {
  id: number;
  name: string;
  service: number;
  service_name: string;
}

export default function BookNowSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    date: "",
    time: "",
    message: "",
  });
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        appointment_date: formData.date,
        appointment_time: formData.time,
        message: formData.message,
      }),
    })
      .then(async (res) => {
        const text = await res.text();
        let payload: any = null;
        try { payload = text ? JSON.parse(text) : null; } catch {}
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

  useEffect(() => {
    let mounted = true;
    setLoadingServices(true);
    fetch("http://localhost:8000/api/services/")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setServices(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingServices(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingDoctors(true);
    fetch("http://localhost:8000/api/doctors/")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setDoctors(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingDoctors(false));
    return () => { mounted = false; };
  }, []);

  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const doc = doctors.find((d) => String(d.id) === String(val));
    setFormData((s) => ({ ...s, doctor: val, service: doc ? String(doc.service) : s.service }));
  };

  return (
    <section id="book-now" className="py-">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5 bg-white">
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
                        <br />Saturday: 9:00 AM - 4:00 PM
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 bg-white/10 rounded-xl p-4 border border-white/20">
                    <h3 className="text-lg font-semibold mb-3">Not sure what service to select?</h3>

                    <p className="text-white font-medium mt-2">🦷 Tooth Problems:</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>✔ Toothache / Sensitivity → <span className="text-blue-200 font-semibold">Endodontist</span></li>
                      <li>✔ Broken or Missing Tooth → <span className="text-blue-200 font-semibold">Prosthodontist</span></li>
                      <li>✔ Need Tooth Extraction → <span className="text-blue-200 font-semibold">Oral Surgery</span></li>
                    </ul>

                    <p className="text-white font-medium mt-4">🌿 Gum / Mouth Issues:</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>✔ Gum Bleeding / Swelling → <span className="text-blue-200 font-semibold">Periodontist</span></li>
                      <li>✔ Bad Breath / Loose Gums → <span className="text-blue-200 font-semibold">Periodontist</span></li>
                    </ul>

                    <p className="text-white font-medium mt-4">✨ Cosmetic / Appearance:</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>✔ Crooked / Misaligned Teeth → <span className="text-blue-200 font-semibold">Orthodontics</span></li>
                    </ul>

                    <p className="text-white font-medium mt-4">✅ Routine Care:</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>✔ General Cleaning / Checkup → <span className="text-blue-200 font-semibold">General Checkup</span></li>
                      <li>✔ Not Sure / First Time Visit → <span className="text-blue-200 font-semibold">General Checkup</span></li>
                    </ul>
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
  <label
    htmlFor="phone"
    className="block text-sm font-medium text-gray-700"
  >
    Phone Number *
  </label>
  <input
    type="tel"
    id="phone"
    name="phone"
    required
    placeholder="10 digit number"
    value={formData.phone}
    onChange={handleInputChange}
    maxLength={10}               // ✅ hard limit to 10 characters
    pattern="\d{10}"             // ✅ ensures only 10 digits on submit
    inputMode="numeric"          // ✅ mobile shows number pad
    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white/90 py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  />
  {errors.phone && (
    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
  )}
</div>

                </div>

                {/* --- NEW LAYOUT: Service / Doctor --- */}
                <div className="w-full  ">
                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-gray-700">Service *</label>
                    <select
                      id="service"
                      name="service"
                      required
                      value={formData.service}
                      onChange={(e) => { handleInputChange(e); setFormData((s) => ({ ...s, doctor: "" })); }}
                      disabled={loadingServices}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white/90 py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="">{loadingServices ? "Loading services..." : "Select a Service"}</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                    {errors.service && <p className="mt-1 text-sm text-red-600">{errors.service}</p>}
                  </div>

                 
                </div>

                {/* --- NEW LAYOUT: Date / Time --- */}
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
      </div>
    </section>
  );
}
