'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface HeroProps {
  isMobile: boolean;
  animProps: (props: any) => any;
}

export default function Hero({ isMobile, animProps }: HeroProps) {
  return (
    <section
      id="hero"
      data-snap
      className="min-h-[calc(100vh-4rem)] md:snap-start md:snap-always md:h-screen flex items-center pt-16 md:pt-0"
    >
      <motion.div
        {...animProps({
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: false, amount: 0.5 },
          transition: { duration: 0.5, ease: 'easeOut' }
        })}
        className="relative max-w-7xl mx-auto w-full px-4 py-6 md:p-16"
      >
        {/* On mobile: column with image first. On desktop: row-reverse so text appears left */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-6 md:gap-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl md:rounded-3xl p-6 md:p-16 shadow-xl ring-1 ring-white/60">
          
          {/* Image first in DOM */}
          <div className="w-full md:w-1/2 flex justify-center">
            <Image
              src="/images/general.jpg"
              alt="Dental care"
              width={500}
              height={500}
              className="rounded-2xl shadow-lg object-cover max-h-[350px] md:max-h-none"
              priority
            />
          </div>

          {/* Text second in DOM */}
          <div className="w-full md:w-1/2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1 text-sm shadow-sm ring-1 ring-black/5">
              <Check className="h-4 w-4 text-blue-600" /> Trusted dental care in Nepal
            </div>

            <h1 className="mt-4 text-3xl md:text-5xl lg:text-6xl font-extrabold text-blue-800 leading-tight">
              Your Perfect Smile Starts Here
            </h1>
            <p className="mt-4 text-base md:text-xl text-slate-700">
              Experience gentle, professional dental care in a comfortable environment.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <a
                href="#book-now"
                className="w-full sm:w-auto flex justify-center items-center px-6 md:px-8 py-3 md:py-4 rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-height-[44px]"
              >
                Book Your Appointment
              </a>
            </div>
          </div>

        </div>
      </motion.div>
    </section>
  );
}
