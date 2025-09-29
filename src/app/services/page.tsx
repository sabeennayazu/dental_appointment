"use client";

import { useState } from "react";
import Image from "next/image";

type Service = {
  title: string;
  description: string;
  image: string;
  details: string;
};

const services: Service[] = [
  {
    title: "General Checkup",
    description: "Routine examination to ensure dental health and detect early issues.",
    image: "/images/general.jpg",
    details:
      "Our general checkups include oral examination, cavity detection, gum health assessment, and professional guidance for better hygiene.",
  },
  {
    title: "Dental Cleaning",
    description: "Professional scaling and polishing to remove plaque and tartar.",
    image: "/images/dental_cleaning.jpeg",
    details:
      "Deep cleaning reduces bad breath, prevents gum disease, and ensures long-term oral protection. Recommended twice a year.",
  },
  {
    title: "Dental Implants",
    description: "Permanent replacement for missing teeth with titanium posts.",
    image: "/images/dental_implants.jpg",
    details:
      "Implants are durable, natural-looking replacements. We offer single, multiple, and full-mouth implant solutions.",
  },
  {
    title: "Braces & Aligners",
    description: "Metal and invisible aligners to straighten your teeth perfectly.",
    image: "/images/braces.jpg",
    details:
      "Choose traditional braces or advanced clear aligners for a discreet smile correction journey.",
  },
  {
    title: "Root Canal Treatment",
    description: "Pain-relief procedure to remove infection from inside the tooth.",
    image: "/images/rct.jpg",
    details:
      "We use modern rotary tools for painless treatment and permanent restoration.",
  },
  {
    title: "Wisdom Tooth Removal",
    description: "Safe extraction of impacted or painful wisdom teeth.",
    image: "/images/wisdom.jpg",
    details:
      "Performed under anesthesia for a pain-free experience with quick healing.",
  },
  {
    title: "Cosmetic Dentistry",
    description: "Smile makeover with veneers, bonding & reshaping.",
    image: "/images/cosmetic.jpg",
    details:
      "Transform your smile using advanced cosmetic procedures tailored to your facial aesthetics.",
  },
  {
    title: "Dentures",
    description: "Comfortable removable teeth replacement options.",
    image: "/images/dentures.jpg",
    details:
      "We provide full and partial dentures with secure, natural-looking fit.",
  },
];

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-12 relative">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-blue-700 mb-10">
        Our Dental Services
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
            onClick={() => setSelectedService(service)}
          >
            <div className="relative w-full h-48">
              <Image src={service.image} alt={service.title} fill className="object-cover" />
            </div>
            <div className="p-5">
              <h2 className="text-lg font-semibold text-gray-900">{service.title}</h2>
              <p className="text-gray-600 text-sm mt-2">{service.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Popup */}
      {selectedService && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="bg-white w-[90%] max-w-lg rounded-xl shadow-lg p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}


            {/* Image */}
            <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
              <Image src={selectedService.image} alt={selectedService.title} fill className="object-cover" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedService.title}</h2>
            <p className="text-gray-700 text-sm">{selectedService.details}</p>
          </div>
        </div>
      )}
    </section>
  );
}
