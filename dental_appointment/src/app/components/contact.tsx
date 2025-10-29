'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Mail } from 'lucide-react';

interface ContactProps {
  isMobile: boolean;
  animProps: (props: any) => any;
}

export default function Contact({ isMobile, animProps }: ContactProps) {
  return (
    <section id="contact" data-snap className="min-h-[calc(100vh-4rem)] md:snap-start md:snap-always md:h-screen flex items-center bg-gradient-to-b from-white-50 to-blue-100 py-16 md:py-0">
      <motion.div
        {...animProps({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: false, amount: 0.5 }, transition: { duration: 0.5, ease: "easeOut" } })}
        className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full"
      >
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-800 to-cyan-300 bg-clip-text text-transparent">Get In Touch</h2>
          <p className="mt-3 text-base md:text-xl text-gray-600">We'd love to hear from you</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <motion.div
            {...animProps({
              initial: { opacity: 0, y: 20 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: false, amount: 0.3 },
              transition: { duration: 0.6, ease: "easeOut" }
            })}
            className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-md ring-1 ring-black/5 text-center hover:-translate-y-1 transition-all"
          >
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-700 mb-4">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Location</h3>
            <p className="text-gray-600 leading-relaxed">123 Dental Avenue<br />Kathmandu, Nepal 44600</p>
          </motion.div>

          <motion.div
            {...animProps({
              initial: { opacity: 0, y: 20 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: false, amount: 0.3 },
              transition: { duration: 0.6, delay: 0.1, ease: "easeOut" }
            })}
            className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-md ring-1 ring-black/5 text-center hover:-translate-y-1 transition-all"
          >
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-700 mb-4">
              <Phone className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Number</h3>
            <p className="text-gray-600 leading-relaxed">+977-1-4123456<br />+977-9876543210</p>
          </motion.div>

          <motion.div
            {...animProps({
              initial: { opacity: 0, y: 20 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: false, amount: 0.3 },
              transition: { duration: 0.6, delay: 0.2, ease: "easeOut" }
            })}
            className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-md ring-1 ring-black/5 text-center hover:-translate-y-1 transition-all"
          >
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-700 mb-4">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Address</h3>
            <p className="text-gray-600 leading-relaxed">info@alfadental.com<br />appointments@alfadental.com</p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}