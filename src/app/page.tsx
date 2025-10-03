"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  Clock,
  Shield,
  Award,
  HeartPulse,
  Calendar,
  Star,
  ChevronRight,
  ChevronLeft,
  Quote,
  Phone,
  MapPin,
  Mail,

} from "lucide-react";

const services = [
  {
    id: 1,
    title: "General Dentistry",
    description:
      "Routine check-ups, cleanings, and preventive care to maintain optimal oral health.",
    icon: <HeartPulse className="h-8 w-8 text-blue-700" />,
  },
  {
    id: 2,
    title: "Cosmetic Dentistry",
    description:
      "Enhance your smile with our cosmetic procedures including teeth whitening and veneers.",
    icon: <Award className="h-8 w-8 text-blue-700" />,
  },
  {
    id: 3,
    title: "Orthodontics",
    description: "Straighten your teeth with our modern braces and Invisalign treatments.",
    icon: <Shield className="h-8 w-8 text-blue-700" />,
  },
  {
    id: 4,
    title: "Emergency Care",
    description:
      "Immediate attention for dental emergencies to relieve pain and prevent complications.",
    icon: <Clock className="h-8 w-8 text-blue-700" />,
  },
];

const benefits = [
  {
    title: "Experienced Team",
    description:
      "Our dentists have years of experience and stay updated with the latest techniques.",
    icon: <Shield className="h-6 w-6" />,
  },
  {
    title: "Modern Technology",
    description:
      "We use state-of-the-art equipment for accurate diagnoses and effective treatments.",
    icon: <Award className="h-6 w-6" />,
  },
  {
    title: "Comfortable Environment",
    description:
      "Our clinic is designed to make your visit as comfortable and stress-free as possible.",
    icon: <HeartPulse className="h-6 w-6" />,
  },
  {
    title: "Flexible Scheduling",
    description: "We offer convenient appointment times to fit your busy schedule. You can choose the time yourself.",
    icon: <Calendar className="h-6 w-6" />,
  },
];

const testimonials = [
  {
    id: 1,
    name: "Sunita Lamsal",
    role: "Patient",
    content:
      "The team at Alfa Dental made me feel so comfortable during my procedure. The office is beautiful and the staff is incredibly professional.",
    rating: 5,
  },
  {
    id: 2,
    name: "Raj Shrestha",
    role: "Patient",
    content:
      "I was nervous about getting dental work done, but the dentist was patient and explained everything clearly. Highly recommend!",
    rating: 5,
  },
  {
    id: 3,
    name: "Maya Gurung",
    role: "Patient",
    content:
      "The online booking system is so convenient, and the staff followed up with me before my appointment. Great experience overall.",
    rating: 4,
  },
];

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    doctor: "",
    date: "",
    time: "",
    message: "",
  });
  const [doctors, setDoctors] = useState<Array<{ id: number; name: string; service: string }>>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  // fetch doctors once
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
    return () => {
      mounted = false;
    };
  }, []);

  const handleDoctorChangeHome = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const doc = doctors.find((d) => String(d.id) === String(val));
    setFormData((prev) => ({ ...prev, doctor: val, service: doc ? doc.service : prev.service }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
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

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };
  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const doc = doctors.find((d) => String(d.id) === String(val));
    setFormData((s) => ({ ...s, doctor: val, service: doc ? doc.service : s.service }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white text-gray-900">
      {/* Decorative background blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200 blur-3xl opacity-40" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-200 blur-3xl opacity-40" />
      </div>

      {/* Hero Section – previous UI style, upgraded */}
      <section className="relative max-w-7xl mx-auto my-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl p-10 md:p-16 shadow-xl ring-1 ring-white/60">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1 text-sm shadow-sm ring-1 ring-black/5">
              <Check className="h-4 w-4 text-blue-600" /> Trusted dental care in Nepal
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-800 leading-tight">
              Your Perfect Smile Starts Here
            </h1>
            <p className="mt-4 text-lg md:text-xl text-slate-700">
              Experience gentle, professional dental care in a comfortable environment.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <a
                href="#book-now"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Book Your Appointment
                <ChevronRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href="#services"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 shadow-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Our Services
              </a>
            </div>
            {/* New Highlights under buttons */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <span className="text-3xl font-bold text-green-600 flex items-center justify-center gap-2">
                  10+ Years
                </span>
                <p className="mt-1 text-gray-600">of Excellence</p>
              </div>

              <div>
                <span className="text-3xl font-bold text-yellow-500 flex items-center justify-center gap-2">
                  5,000+
                </span>
                <p className="mt-1 text-gray-600">Happy Patients</p>
              </div>

              <div>
                <span className="text-3xl font-bold text-blue-600 flex items-center justify-center gap-2">
                  Certified
                </span>
                <p className="mt-1 text-gray-600">Specialists</p>
              </div>
            </div>



          </div>

          {/* Right Image */}
          <div className="hidden md:flex justify-center">
            <div className="relative w-150 h-100">
              <div className="absolute -inset-3 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-3xl opacity-20 blur-xl" />
              <div className="relative w-full h-full bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
                <img
                  src="/images/general.jpg"
                  alt="Smiling dentist with patient"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="max-w-7xl mx-auto px-4 py-6  sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Our Dental Services</h2>
            <p className="mt-3 text-xl text-gray-600">Comprehensive dental care for the whole family</p>
          </div>

          {/* View All Button Aligned Right */}
          <div className="flex justify-end mb-6">
            <Link href="/services">
              <button className="flex items-center cursor-pointer text-blue-600 hover:text-blue-800 transition-colors font-medium">
                <span className="mr-1">View all</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                className="group relative rounded-2xl bg-white/80 backdrop-blur p-8 shadow-md ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="inline-flex items-center justify-center rounded-full p-4 mb-5 bg-gradient-to-br from-blue-100 to-blue-50 shadow-inner">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>

                <div className="pointer-events-none absolute inset-x-0 -bottom-6 mx-auto h-12 w-[80%] rounded-full bg-black/5 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-choose-us" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Why Choose Alfa Dental?</h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-600">
              We're committed to providing exceptional dental care with a personal touch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[benefits.slice(0, 2), benefits.slice(2)].map((col, colIdx) => (
              <div key={colIdx} className="space-y-6">
                {col.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-4 p-5 rounded-2xl bg-white/80 backdrop-blur shadow-md ring-1 ring-black/5">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 text-blue-700">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{benefit.title}</h3>
                      <p className="mt-1 text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section (carousel) */}
      <section id="testimonials" className="py-20 mb-20 p bg-gradient-to-b from-white/60 to-blue-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">What Our Patients Say</h2>
            <p className="mt-3 text-xl text-gray-600">Don't just take our word for it - hear from our patients</p>
          </div>

          <div className="relative max-w-3xl mx-auto">
            <div className="relative bg-white/80 backdrop-blur rounded-2xl shadow-xl p-8 md:p-10 ring-1 ring-black/5">
              <Quote className="absolute top-8 left-8 text-blue-100 h-16 w-16 -z-0" />
              <div className="relative z-10">
                <div className="flex items-center mb-6" aria-label={`Rating ${testimonials[currentTestimonial].rating} out of 5`}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < testimonials[currentTestimonial].rating ? "text-yellow-400" : "text-gray-300"}`}
                      fill={i < testimonials[currentTestimonial].rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <blockquote className="text-lg text-gray-700 mb-6">“{testimonials[currentTestimonial].content}”</blockquote>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                    {testimonials[currentTestimonial].name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">{testimonials[currentTestimonial].name}</p>
                    <p className="text-gray-600">{testimonials[currentTestimonial].role}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={prevTestimonial}
                className="p-2 rounded-full bg-white shadow-md text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`h-2 w-2 rounded-full transition-all ${index === currentTestimonial ? "bg-blue-700 w-6" : "bg-gray-300"}`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={nextTestimonial}
                className="p-2 rounded-full bg-white shadow-md text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </section>



      {/* Book Now Section */}
      <section id="book-now" className="py-22">
        <div className="max-w-7xl mx-auto px-4   sm:px-6 lg:px-8">
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

  {/* Tooth Related */}
  <p className="text-white font-medium mt-2">🦷 Tooth Problems:</p>
  <ul className="text-sm space-y-1 ml-4">
    <li>✔ Toothache / Sensitivity → <span className="text-blue-200 font-semibold">Endodontist</span></li>
    <li>✔ Broken or Missing Tooth → <span className="text-blue-200 font-semibold">Prosthodontist</span></li>
    <li>✔ Need Tooth Extraction → <span className="text-blue-200 font-semibold">Oral Surgery</span></li>
  </ul>

  {/* Gum Related */}
  <p className="text-white font-medium mt-4">🌿 Gum / Mouth Issues:</p>
  <ul className="text-sm space-y-1 ml-4">
    <li>✔ Gum Bleeding / Swelling → <span className="text-blue-200 font-semibold">Periodontist</span></li>
    <li>✔ Bad Breath / Loose Gums → <span className="text-blue-200 font-semibold">Periodontist</span></li>
  </ul>

  {/* Cosmetic / Appearance */}
  <p className="text-white font-medium mt-4">✨ Cosmetic / Appearance:</p>
  <ul className="text-sm space-y-1 ml-4">
    <li>✔ Crooked / Misaligned Teeth → <span className="text-blue-200 font-semibold">Orthodontics</span></li>
  </ul>

  {/* Routine */}
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
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                </div>

                {/* --- NEW LAYOUT: Service / Doctor --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-gray-700">Service *</label>
                    <select
                      id="service"
                      name="service"
                      required
                      value={formData.service}
                      onChange={(e) => { handleInputChange(e); setFormData((s) => ({ ...s, doctor: "" })); }}
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
                        <option key={doc.id} value={doc.id}>{doc.name}</option>
                      ))}
                    </select>
                    {errors.doctor && <p className="mt-1 text-sm text-red-600">{errors.doctor}</p>}
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

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-b from-blue-50/60 to-white/60">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Get In Touch</h2>
            <p className="mt-3 text-xl text-gray-600">We'd love to hear from you</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-md ring-1 ring-black/5 text-center hover:-translate-y-1 transition-all">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-700 mb-4"><MapPin className="h-6 w-6" /></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Location</h3>
              <p className="text-gray-600 leading-relaxed">123 Dental Avenue<br />Kathmandu, Nepal 44600</p>
            </div>
            <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-md ring-1 ring-black/5 text-center hover:-translate-y-1 transition-all">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-700 mb-4"><Phone className="h-6 w-6" /></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600 leading-relaxed">+977 1 2345678<br />+977 1 2345679</p>
            </div>
            <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-md ring-1 ring-black/5 text-center hover:-translate-y-1 transition-all">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-700 mb-4"><Mail className="h-6 w-6" /></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 leading-relaxed">info@alfadental.com<br />appointments@alfadental.com</p>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
