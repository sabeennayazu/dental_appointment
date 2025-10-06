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
    title: "Scaling & Polishing (Oral Prophylaxis)",
    description: "Gentle yet effective cleaning experience with advanced ultrasonic scalers and air polisher.",
    image: "/images/scaling.jpg",
    details:
      "At our clinic, we use advanced ultrasonic scalers and air polisher for a gentle yet effective cleaning experience. Whether you're due for a routine cleaning or have early signs of plaque buildup, our professional cleaning ensures your teeth stay healthy and bright.",
  },
  {
    title: "Teeth Whitening (Bleaching)",
    description: "Professional teeth bleaching for a brighter, whiter smile.",
    image: "/images/teeth-whitening.jpg",
    details:
      "Brighten your smile with professional teeth bleaching at Alfa Dental Home. We offer vital and non-vital tooth bleaching. Experience quick & dramatic results with our high-quality bleaching solutions performed by experts.",
  },
  {
    title: "Tooth-colored Fillings & Aesthetic Corrections",
    description: "Restore your teeth with natural-looking composite materials.",
    image: "/images/fillings.jpg",
    details:
      "We use high-quality tooth-colored composite materials that blend seamlessly with your natural teeth, restoring the strength, function & beauty of your teeth whether you have cavities or need minor aesthetic corrections.",
  },
  {
    title: "Crowns & Veneers",
    description: "Custom-made crowns & veneers for beauty, strength & durability.",
    image: "/images/crowns_veneers.jpg",
    details:
      "Revive your smile with custom-made crowns & veneers designed for beauty, strength & long-lasting function. Veneers are thin, custom designed shells placed on the front surface of your teeth to enhance appearance.",
  },
  {
    title: "Implants",
    description: "Single, multiple, or full-mouth dental implant solutions.",
    image: "/images/implants.jpg",
    details:
      "We offer single tooth implants, multiple tooth implants / implant bridges, full mouth implant solutions (All-on-4 / All-on-6), and implant supported dentures with digital planning for precision and long-term success.",
  },
  {
    title: "Extraction (Tooth Removal)",
    description: "Safe and comfortable tooth extractions using modern anesthesia.",
    image: "/images/extraction.jpg",
    details:
      "At our clinic, we perform extractions with precision and patient comfort as our top priority. Using advanced techniques and modern anesthesia, we ensure a safe, painless, and efficient procedure.",
  },
  {
    title: "Dental Prosthesis",
    description: "Custom prosthetic solutions for missing teeth.",
    image: "/images/prosthesis.jpg",
    details:
      "Whether you're missing one tooth or several, our prosthetic options are designed to match your unique needs and lifestyle. We combine digital planning & expert craftsmanship for optimal results.",
  },
  {
    title: "Braces & Aligners",
    description: "Straighten your teeth and improve bite with orthodontics.",
    image: "/images/braces_aligners.jpg",
    details:
      "Straighten your teeth and improve your bite with expert orthodontic care. Braces and aligners are more than cosmetic—they help align teeth, correct jaw positioning & promote overall oral health.",
  },
  {
    title: "Root Canal Treatment",
    description: "Treat infected or damaged tooth pulp while preserving teeth.",
    image: "/images/rct.jpg",
    details:
      "RCT is a safe & effective procedure used to treat infected or damaged tooth pulp while preserving the original tooth structure. At our clinic, we use modern techniques & materials for a pain-free experience.",
  },
  {
    title: "Periodontal (Gum) Treatment",
    description: "Comprehensive gum care to protect teeth and oral health.",
    image: "/images/periodontal.jpg",
    details:
      "We provide comprehensive gum care using advanced techniques and a gentle approach to protect your teeth and overall oral health. Services include scaling, root planing, and periodontal maintenance.",
  },
  {
    title: "Pediatric Treatment",
    description: "Specialized dentistry for infants, children, and teens.",
    image: "/images/pediatric.jpg",
    details:
      "At Alfa Dental Home, we offer specialized pediatric dentistry designed to meet the unique needs of children—from infants to teens. We create a welcoming, playful, and calm environment for young patients.",
  },
];

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-12 relative bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
      <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent mb-10">
        Our Dental Services
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
            onClick={() => setSelectedService(service)}
          >
            <Image
              src={service.image}
              alt={service.title}
              width={400}
              height={192}
              className="object-cover w-full h-48"
            />
            <div className="p-5">
              <h2 className="text-lg font-semibold text-gray-900">{service.title}</h2>
              <p className="text-gray-600 text-sm mt-2">{service.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Popup */}
      {typeof window !== "undefined" && selectedService && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="bg-white w-[90%] max-w-lg rounded-xl shadow-lg p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={() => setSelectedService(null)}
            >
              ✕
            </button>

            {/* Image */}
            <Image
              src={selectedService.image}
              alt={selectedService.title}
              width={400}
              height={192}
              className="object-cover w-full h-48 mb-4 rounded-lg"
            />

            <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedService.title}</h2>
            <p className="text-gray-700 text-sm">{selectedService.details}</p>
          </div>
        </div>
      )}
    </section>
  );
}
