'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import type { Testimonial } from '../types';

const testimonials: Testimonial[] = [
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

interface TestimonialsProps {
  isMobile: boolean;
  animProps: (props: any) => any;
}

export default function Testimonials({ isMobile, animProps }: TestimonialsProps) {
  return (
    <section
      id="testimonials"
      data-snap
      className="min-h-[calc(100vh-4rem)] md:snap-start md:snap-always md:h-screen flex items-center bg-gradient-to-b from-blue-50 to-white py-16 md:py-0"
    >
      <motion.div
        {...animProps({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: false, amount: 0.3 }, transition: { duration: 0.6, ease: 'easeOut' } })}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-cyan-400 bg-clip-text text-transparent">
            What Our Patients Say
          </h2>
          <p className="mt-3 text-base md:text-xl text-gray-600">
            Real experiences from our valued patients
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              {...animProps({
                initial: { opacity: 0, y: 20 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: false, amount: 0.3 },
                transition: { duration: 0.6, delay: index * 0.1, ease: 'easeOut' },
                whileHover: isMobile ? {} : { y: -5, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)' }
              })}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all"
            >
              <Quote className="h-8 w-8 text-blue-500 mb-4" />
              <p className="text-gray-600 mb-4">{testimonial.content}</p>
              <div className="flex items-center mt-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}