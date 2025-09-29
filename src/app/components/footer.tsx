import { Facebook, Instagram, MapPin, Phone, Mail } from "lucide-react";
import { FaTiktok } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-blue-50 to-white pt-8 pb-8 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-3xl text-blue-600">🦷</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Alfa Dental
              </span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your trusted partner for exceptional dental care. We provide the highest quality services in a comfortable and welcoming environment.
            </p>
          </div>

          {/* Connect Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect</h3>
            

            {/* Social Media Icons */}
            <div className="flex space-x-4 mt-2">
              <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-8 w-8" />
              </a>
              <a href="#" className="text-pink-600 hover:text-pink-800 transition-colors">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-8 w-8" />
              </a>
              <a href="#" className="hover:text-gray-800">
  <span className="sr-only">TikTok</span>
  <FaTiktok size={30} />
</a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-600 text-sm">
                  123 Dental Avenue<br />
                  Kathmandu, Nepal 44600
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 text-blue-600 mr-3" />
                <a href="tel:+9771234567890" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  +977 1 2345678
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 text-blue-600 mr-3" />
                <a href="mailto:info@alfadental.com" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  info@alfadental.com
                </a>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Opening Hours</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex justify-between">
                <span>Sunday - Friday</span>
                <span>8:00 AM - 6:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Saturday</span>
                <span>9:00 AM - 4:00 PM</span>
              </li>
            </ul>
            <div className="mt-6">
              <a
                href="#book-now"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full text-center"
              >
                Book an Appointment
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-12 pt-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © {currentYear} Alfa Dental. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <p className="text-sm text-gray-500">Site Design by:</p>
            <a href="https://github.com/sabeennayazu" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
               Sabeen Nayazu
            </a>
            
          </div>
        </div>
      </div>
    </footer>
  );
}
