"use client";


import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
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
    title: "Personalized Care",
    description:
      "Every patient receives tailored treatment plans designed to meet their unique dental needs.",
    icon: <Star className="h-6 w-6" />,
  },

  {
    title: "Flexible Scheduling",
    description: "Choose from a wide range of appointment slots designed to suit your routine.",
    icon: <Calendar className="h-6 w-6" />,
  }


];

const testimonials = [
  {
    id: 1,
    name: "Sunita Lamsal",
    role: "Patient",
    content:
      "The team at Alfa Dental Home made me feel so comfortable during my procedure. The office is beautiful and the staff is incredibly professional.",
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
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isAnimatingRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const sectionIds = ["hero", "services", "why-choose-us", "testimonials", "book-now", "contact"] as const;
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

  // IntersectionObserver to track active section
  useEffect(() => {
    const root = containerRef.current || undefined;
    const sections = Array.from((containerRef.current || document).querySelectorAll<HTMLElement>('section[data-snap]'));
    if (sections.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const idx = sections.indexOf(visible[0].target as HTMLElement);
          if (idx >= 0) setActiveSection(idx);
        }
      },
      { root, threshold: [0.5, 0.75, 1] }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  // Update URL hash to reflect active section for navbar highlighting/deep links
  useEffect(() => {
    const id = sectionIds[activeSection];
    if (!id) return;
    const newHash = `#${id}`;
    if (typeof window !== 'undefined' && window.location.hash !== newHash) {
      window.history.replaceState(null, "", newHash);
    }
  }, [activeSection]);

  // Helper to snap to index
  const snapTo = useCallback((index: number) => {
    const sections = Array.from((containerRef.current || document).querySelectorAll<HTMLElement>('section[data-snap]'));
    if (index < 0 || index >= sections.length) return;
    const el = sections[index];
    isAnimatingRef.current = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // release lock after animation duration
    window.setTimeout(() => {
      isAnimatingRef.current = false;
    }, 650);
  }, []);

  // Wheel handler for section-by-section navigation
  useEffect(() => {
    const root = containerRef.current || window;
    let lastWheel = 0;
    const onWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (isAnimatingRef.current || now - lastWheel < 500) return;
      if (Math.abs(e.deltaY) < 20) return; // ignore tiny trackpad nudges
      lastWheel = now;
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      snapTo(activeSection + dir);
    };
    root.addEventListener('wheel', onWheel as unknown as EventListener, { passive: false });
    return () => root.removeEventListener('wheel', onWheel as unknown as EventListener);
  }, [activeSection, snapTo]);

  // Touch swipe for mobile
  useEffect(() => {
    const rootEl = containerRef.current;
    if (!rootEl) return;
    const onTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const startY = touchStartYRef.current;
      touchStartYRef.current = null;
      if (startY == null) return;
      const endY = e.changedTouches[0].clientY;
      const delta = startY - endY;
      if (Math.abs(delta) < 40 || isAnimatingRef.current) return;
      const dir = delta > 0 ? 1 : -1;
      snapTo(activeSection + dir);
    };
    rootEl.addEventListener('touchstart', onTouchStart, { passive: true });
    rootEl.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      rootEl.removeEventListener('touchstart', onTouchStart as any);
      rootEl.removeEventListener('touchend', onTouchEnd as any);
    };
  }, [activeSection, snapTo]);

  return (
    <main ref={containerRef} className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-gradient-to-b from-white via-blue-50 to-white text-gray-900">
      {/* Decorative background blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200 blur-3xl opacity-40" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-200 blur-3xl opacity-40" />
      </div>

      {/* Hero Section */}
      <section id="hero" data-snap className="snap-start snap-always h-screen flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative max-w-7xl mx-auto w-full p-8 md:p-16 sm:px-6 lg:px-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl p-12 md:p-16shadow-xl ring-1 ring-white/60">

            {/* Left Side (Text + Buttons + Highlights) */}
            <div className="w-fit">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1 text-sm shadow-sm ring-1 ring-black/5">
                <Check className="h-4 w-4 text-blue-600" /> Trusted dental care in Nepal
              </div>

              {/* Heading */}
              <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-800 leading-tight">
                Your Perfect Smile Starts Here
              </h1>
              <p className="mt-4 text-lg md:text-xl text-slate-700">
                Experience gentle, professional dental care in a comfortable environment.
              </p>

              {/* Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4 order-3 md:order-2">
                <a
                  href="#book-now"
                  className="w-full sm:w-auto flex justify-center items-center px-8 py-4 rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Book Your Appointment
                  <ChevronRight className="ml-2 h-5 w-5" />
                </a>
                <a
                  href="#services"
                  className="w-full sm:w-auto flex justify-center items-center px-8 py-4 rounded-full text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 shadow-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Our Services
                </a>
              </div>

              {/* Highlights */}
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center order-4 md:order-3">
                <div>
                  <span className="text-3xl font-bold text-green-600 flex items-center justify-center gap-2">10+ Years</span>
                  <p className="mt-1 text-gray-600">of Excellence</p>
                </div>
                <div>
                  <span className="text-3xl font-bold text-yellow-500 flex items-center justify-center gap-2">5,000+</span>
                  <p className="mt-1 text-gray-600">Happy Patients</p>
                </div>
                <div>
                  <span className="text-3xl font-bold text-blue-600 flex items-center justify-center gap-2">Certified</span>
                  <p className="mt-1 text-gray-600">Specialists</p>
                </div>
              </div>
            </div>

            {/* Right Side (Image) */}
            <div className="w-full md:w-1/2 flex justify-center md:justify-end order-2 md:order-2">
              <div className="relative w-full max-w-md h-80 md:h-96">
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
        </motion.div>
      </section>

      {/* Services Section */}
      <section id="services" data-snap className="snap-start snap-always h-screen flex items-center bg-gradient-to-b from-white via-white/20 to-cyan-500/50">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 w-full"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-cyan-300 bg-clip-text text-transparent sm:text-4xl">Our Dental Services</h2>
            <p className="mt-3 text-xl text-gray-500">Comprehensive dental care for the whole family</p>
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
        </motion.div>
      </section>

      {/* Why Choose Us Section */}
      <section
  id="why-choose-us"
  data-snap
  className="snap-start snap-always h-screen flex items-center bg-gradient-to-b from-white via-white-50 to-blue-500/40 overflow-hidden"
>
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false, amount: 0.4 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12 px-6 lg:px-10 w-full"
  >
    {/* Left: Text + Benefits */}
    <div className="space-y-10">
      {/* Header block */}
      <motion.div
        initial={{ opacity: 0, x: -150, rotate: -5 }}
        whileInView={{ opacity: 1, x: 0, rotate: 0 }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-left"
      >
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-cyan-400 bg-clip-text text-transparent">
          Why Choose Alfa Dental?
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-gray-700 leading-relaxed">
          We're committed to providing exceptional dental care with a personal touch.
        </p>
        <div className="mt-4 h-1 w-24 bg-blue-500 rounded-full"></div>
      </motion.div>

      {/* Benefits (cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[benefits.slice(0, 2), benefits.slice(2)].map((col, colIdx) => (
          <div key={colIdx} className="space-y-6">
            {col.map((benefit, index) => {
              // Different motion directions for each card
              const directions = [
                { x: -120, y: -40, rotate: -8 },
                { x: -100, y: 30, rotate: -4 },
                { x: -140, y: -20, rotate: 5 },
                { x: -110, y: 40, rotate: 8 },
              ];
              const dir = directions[index % directions.length];

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, ...dir }}
                  whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                  viewport={{ once: false, amount: 0.4 }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.15,
                    ease: "easeOut",
                  }}
                  whileHover={{
                    scale: 1.05,
                    y: -10,
                    boxShadow:
                      "0 20px 35px rgba(0, 0, 0, 0.08), 0 10px 15px rgba(0, 0, 0, 0.05)",
                  }}
                  className="flex items-start gap-4 p-5 rounded-2xl bg-white/90 border border-blue-100 shadow-md"
                >
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-blue-200 to-blue-100 text-blue-700 shadow-inner">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
                      {benefit.title}
                    </h3>
                    <p className="mt-1 text-gray-600 leading-snug">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>

    {/* Right: Image */}
    <motion.div
      initial={{ opacity: 0, x: 150, rotateY: 15 }}
      whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="relative hidden lg:flex justify-center items-center h-full"
    >
      <motion.div
        whileHover={{
          scale: 1.05,
          rotateY: 5,
          y: -8,
          boxShadow:
            "0 25px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.08)",
          transition: { type: "spring", stiffness: 150, damping: 12 },
        }}
        className="relative w-full h-[80%] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-blue-100"
      >
        <img
          src="/images/room.jpg"
          alt="Dental clinic room"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-white/40 to-transparent rounded-2xl"></div>
      </motion.div>
    </motion.div>
  </motion.div>
</section>




       <section
      id="testimonials"
      data-snap
      className="snap-start h-screen flex items-center bg-gradient-to-b from-white to-cyan-300/40"
    >
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left: Image pops from left */}
        <motion.div
          initial={{ opacity: 0, x: -200, y: 50, rotate: -8 }}
          whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={{ scale: 1.07, rotate: 2, transition: { duration: 0.2 } }}
          className="rounded-2xl shadow-xl overflow-hidden"
        >
          <img
            src="/images/group.jpg"
            alt="Patient testimonial"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Right Side */}
        <div className="flex flex-col space-y-10">
          {/* Heading from top-right */}
          <motion.div
            initial={{ opacity: 0, y: -100, x: 80 }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-3xl font-extrabold text-center bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent sm:text-4xl">
              What Our Patients Say
            </h2>
            <p className="mt-3 text-xl text-center text-gray-600">
              Don't just take our word for it - hear from our patients
            </p>
          </motion.div>

          {/* Carousel from bottom-right */}
          <motion.div
            initial={{ opacity: 0, y: 120, x: 80 }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.15 } }}
            className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-8 ring-1 ring-black/5 relative"
          >
            <Quote className="absolute top-8 left-8 text-blue-100 h-16 w-16 -z-0" />
            <div className="relative z-10">
              <div className="flex mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < testimonials[currentTestimonial].rating
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    fill={
                      i < testimonials[currentTestimonial].rating
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </div>
              <blockquote className="text-lg text-gray-700 mb-6">
                “{testimonials[currentTestimonial].content}”
              </blockquote>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                  {testimonials[currentTestimonial].name.charAt(0)}
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">
                    {testimonials[currentTestimonial].name}
                  </p>
                  <p className="text-gray-600">
                    {testimonials[currentTestimonial].role}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={prevTestimonial}
                className="p-2 rounded-full bg-white shadow-md text-blue-700 hover:bg-blue-50 transition-all duration-150"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentTestimonial
                        ? "bg-blue-700 w-6"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={nextTestimonial}
                className="p-2 rounded-full bg-white shadow-md text-blue-700 hover:bg-blue-50 transition-all duration-150"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  
 


      {/* Book Now Section */}
      <section id="book-now" data-snap className="snap-start snap-always h-screen flex items-center bg-gradient-to-b from-white via-white/20 to-blue-500/50">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
        >
          <div className="overflow-hidden rounded-3xl shadow-2xl mt-16 ring-1 ring-black/5 bg-white">
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
                          <option key={doc.id} value={doc.id}>Dr. {doc.name}</option>
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

      {/* Contact Section */}
      <section id="contact" data-snap className="snap-start snap-always h-screen flex items-center bg-gradient-to-b from-white-50 to-blue-100">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-800 to-cyan-300 bg-clip-text text-transparent sm:text-4xl">Get In Touch</h2>
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
        </motion.div>
      </section>


    </main>
  );
}
