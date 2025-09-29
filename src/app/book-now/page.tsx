"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

export default function BookNowSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    date: "",
    time: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Your appointment request has been submitted!");
    setFormData({
      name: "",
      email: "",
      phone: "",
      service: "",
      date: "",
      time: "",
    });
  };

  return (
    <section id="book-now" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Info Section */}
            <div className="relative bg-gradient-to-b from-blue-800 to-blue-600 p-10 lg:p-14 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.12),transparent_35%)]" />
              <div className="relative">
                <h2 className="text-3xl font-bold mb-4">Book Your Appointment</h2>
                <p className="text-blue-100 mb-8">
                  Fill out the form and our team will get back to you within 24 hours to confirm your appointment.
                </p>

                <div className="grid grid-cols-1 gap-6">
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
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-8 lg:p-12">
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white/90 py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
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
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white/90 py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a Location</option>
                      <option value="duwakot">Duwakot</option>
                      <option value="kamalbinayak">Kamalbinayak</option>
                      <option value="sallaghari">Sallaghari</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Preferred Date *</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white/90 py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
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
