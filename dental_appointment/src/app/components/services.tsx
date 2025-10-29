'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, HeartPulse, Award, Shield, Clock } from 'lucide-react';
import type { Service } from '../types';

const services: Service[] = [
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

interface ServicesProps {
  isMobile: boolean;
  animProps: (props: any) => any;
}

export default function Services({ isMobile, animProps }: ServicesProps) {
  return (
    <section
      id="services"
      data-snap
      className="min-h-[calc(100vh-4rem)] md:snap-start md:snap-always md:h-screen flex items-center bg-gradient-to-b from-white via-white/20 to-cyan-500/50 py-16 md:py-0"
    >
      <motion.div
        {...animProps({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: false, amount: 0.3 }, transition: { duration: 0.6, ease: 'easeOut' } })}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div className="w-full lg:w-1/2 -mt-8 lg:mt-0">
            <motion.img
              {...animProps({ initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, whileHover: { scale: 1.02 }, transition: { duration: 0.6, ease: 'easeOut' }, viewport: { once: false, amount: 0.5 } })}
              src="/images/service.jpg"
              alt="Friendly dentist"
              className="rounded-2xl md:rounded-3xl object-cover w-full h-auto shadow-xl md:shadow-2xl"
            />
          </div>

          <motion.div
            {...animProps({ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: false, amount: 0.3 }, transition: { duration: 0.8, ease: 'easeOut' } })}
            className="w-full lg:w-1/2"
          >
            <div className="text-center lg:text-left mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-cyan-300 bg-clip-text text-transparent">
                Our Dental Services
              </h2>
              <p className="mt-3 text-base md:text-xl text-gray-500">
                Comprehensive dental care for the whole family
              </p>
            </div>

            <motion.div
              {...animProps({ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: false, amount: 0.3 }, transition: { duration: 0.8, delay: 0.2, ease: 'easeOut' } })}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6"
            >
              {services.map((service) => (
                <motion.div
                  key={service.id}
                  {...animProps({ initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: false, amount: 0.3 }, transition: { duration: 0.6, ease: 'easeOut' } })}
                  className={`group relative rounded-xl md:rounded-2xl bg-white/80 backdrop-blur-xl p-4 md:p-6 text-left shadow-md md:shadow-lg border border-white/30 touch-none ${isMobile ? 'active:bg-white/90' : 'hover:-translate-y-1 hover:shadow-xl transition-all duration-300'}`}
                >
                  <div className="inline-flex items-center justify-center rounded-lg md:rounded-xl p-2 md:p-3 mb-3 md:mb-4 bg-gradient-to-br from-blue-100 to-cyan-50 shadow-inner">
                    {service.icon}
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              {...animProps({ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: false, amount: 0.3 }, transition: { duration: 0.8, delay: 0.3, ease: 'easeOut' } })}
              className="flex justify-center pt-4 lg:justify-end mb-6"
            >
              <Link href="/services">
                <button className="flex items-center cursor-pointer text-blue-600 hover:text-blue-800 transition-colors font-medium">
                  <span className="mr-1">View all</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}