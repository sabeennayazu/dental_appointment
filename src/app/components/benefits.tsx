'use client';

import { motion } from 'framer-motion';
import { Shield, Award, Star, Calendar } from 'lucide-react';
import type { Benefit } from '../types';

const benefits: Benefit[] = [
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

interface BenefitsProps {
  isMobile: boolean;
  animProps: (props: any) => any;
}

export default function Benefits({ isMobile, animProps }: BenefitsProps) {
  return (
    <section
      id="why-choose-us"
      data-snap
      className="min-h-[calc(100vh-4rem)] md:snap-start md:snap-always md:h-screen flex items-center bg-gradient-to-b from-white via-white-50 to-blue-500/40 overflow-hidden py-16 md:py-0"
    >
      <motion.div
        {...animProps({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: false, amount: 0.4 }, transition: { duration: 0.5, ease: "easeOut" } })}
        className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-8 md:gap-12 px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="space-y-6 md:space-y-10">
          <motion.div
            {...animProps({ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: false, amount: 0.5 }, transition: { duration: 0.8, ease: "easeOut" } })}
            className="text-left"
          >
            <h2 className="text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-cyan-400 bg-clip-text text-transparent">
              Why Choose Alfa Dental?
            </h2>
            <p className="mt-3 md:mt-4 max-w-2xl text-base md:text-lg text-gray-700 leading-relaxed">
              We're committed to providing exceptional dental care with a personal touch.
            </p>
            <div className="mt-4 h-1 w-20 md:w-24 bg-blue-500 rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {[benefits.slice(0, 2), benefits.slice(2)].map((col, colIdx) => (
              <div key={colIdx} className="space-y-4 md:space-y-6">
                {col.map((benefit, index) => {
                  const dir = isMobile ? { y: 20 } : {
                    x: [-80, -60, -100, -70][index % 4],
                    y: [-20, 15, -10, 20][index % 4],
                    rotate: [-4, -2, 2, 4][index % 4],
                  };

                  return (
                    <motion.div
                      key={index}
                      {...animProps({ 
                        initial: { opacity: 0, ...dir }, 
                        whileInView: { opacity: 1, x: 0, y: 0, rotate: 0 }, 
                        viewport: { once: false, amount: 0.4 }, 
                        transition: { duration: 0.6, delay: index * 0.1, ease: "easeOut" },
                        whileHover: isMobile ? {} : { scale: 1.03, y: -5, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }
                      })}
                      className="flex items-start gap-3 md:gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl bg-white/90 border border-blue-100 shadow-sm md:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-200 to-blue-100 text-blue-700 shadow-inner">
                        {benefit.icon}
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
                          {benefit.title}
                        </h3>
                        <p className="mt-1 text-sm md:text-base text-gray-600 leading-snug">
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
      </motion.div>
    </section>
  );
}