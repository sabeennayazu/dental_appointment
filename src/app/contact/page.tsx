"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";

type Branch = {
  name: string;
  address: string;
  phone: string;
  email: string;
};

const branches: Branch[] = [
  {
    name: "Alfa Dental - Duwakot",
    address: "Duwakot, Bhaktapur, Nepal",
    phone: "+1 234 567 890",
    email: "downtown@alfadental.com",
  },
  {
    name: "Alfa Dental - Kamalbinayak",
    address: "Kamalbinayak, Bhaktapur, Nepal",
    phone: "+1 987 654 321",
    email: "uptown@alfadental.com",
  },
  {
    name: "Alfa Dental - Sallaghari",
    address: "Sallaghari, Bhaktapur, Nepal",
    phone: "+1 555 123 456",
    email: "suburb@alfadental.com",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", Number: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", form);
    setForm({ name: "", Number: "", message: "" });
    alert("Your message has been sent!");
  };

  return (
    <section className="w-full max-w-6xl mx-auto px-6 ">
      <h1 className="text-4xl font-bold text-center text-blue-700 mb-12">Contact Us</h1>

      {/* Branches */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {branches.map((branch, index) => (
          <div
            key={index}
            className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition-all duration-300"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">{branch.name}</h2>
            <div className="flex items-center mb-2 text-gray-700">
              <MapPin className="mr-2 h-5 w-5 text-blue-600" />
              <span>{branch.address}</span>
            </div>
            <div className="flex items-center mb-2 text-gray-700">
              <Phone className="mr-2 h-5 w-5 text-blue-600" />
              <span>{branch.phone}</span>
            </div>
            <div className="flex items-center mb-4 text-gray-700">
              <Mail className="mr-2 h-5 w-5 text-blue-600" />
              <span>{branch.email}</span>
            </div>
            {/* Social Links */}
            <div className="flex space-x-3 mt-2">
              <a href="#" className="text-blue-600 hover:text-blue-800">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-pink-500 hover:text-pink-700">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-blue-400 hover:text-blue-600">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Map & Contact Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Map Placeholder */}
        <div className="w-full h-104 rounded-xl overflow-hidden shadow-lg">
          <iframe
src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3533.2572890435627!2d85.43864221141197!3d27.678441726665806!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb05e94a75544b%3A0xfd8670bc865fa705!2sAlfa%20Dental%20Home!5e0!3m2!1sen!2snp!4v1759323946704!5m2!1sen!2snp"
            className="w-full h-full border-0"
            allowFullScreen
          ></iframe>
        </div>

        {/* Contact Form */}
        <div className="bg-blue-50 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Send us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="Number"
              name="Number"
              value={form.Number}
              onChange={handleChange}
              placeholder="Your Phone Number"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={5}
              placeholder="Your Message"
              className="w-full px-4  border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              className="w-full py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
