'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface HeroProps {
  isMobile: boolean;
  animProps: (props: any) => any;
}

export default function Hero({ isMobile, animProps }: HeroProps) {
  const [patientsCount, setPatientsCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  // animate from 0 to target over durationMs using requestAnimationFrame
  function animateCount(target: number, durationMs = 1600) {
    const start = performance.now();
    const from = 0;

    function step(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / durationMs, 1); // 0..1
      // easeOutCubic for a quick, pleasing finish
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(from + (target - from) * eased);
      setPatientsCount(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        // ensure final value
        setPatientsCount(target);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }
    }

    // cancel any running animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
  }

  useEffect(() => {
    // start the quick count on mount (page reload)
    animateCount(500, 800); // target 500 in 800ms — adjust speed if you want faster/slower

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      id="hero"
      data-snap
      className="min-h-[calc(100vh-4rem)] md:snap-start md:snap-always md:h-screen flex items-center pt-8 md:pt-0"
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
        <div className="flex flex-col md:flex-row-reverse items-center gap-6 md:gap-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl md:rounded-3xl p-6 md:p-16 shadow-xl ring-1 ring-white/60">
          
          {/* Image */}
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

          {/* Text */}
          <div className="w-full md:w-1/2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1 text-sm shadow-sm ring-1 ring-black/5">
              <Check className="h-4 w-4 text-blue-600" /> Trusted dental care in Nepal
            </div>

            <h1 className="mt-4 text-3xl md:text-5xl lg:text-6xl font-bold text-blue-800 leading-tight">
              Your Perfect Smile Starts Here
            </h1>

            <p className="mt-4 text-base md:text-xl text-slate-700">
              Experience <span className="font-semibold text-blue-700">modern, pain-free</span> dental care 
              backed by technology and a passion for perfection.
            </p>

            {/* Visual stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center items-center">
              <div>
                <p className="text-3xl md:text-4xl font-extrabold text-blue-700">
                  {patientsCount}+
                </p>
                <p className="text-sm md:text-base text-slate-600">Happy Patients</p>
              </div>

              <div>
                <p className="text-3xl md:text-4xl font-extrabold text-blue-700">20+</p>
                <p className="text-sm md:text-base text-slate-600">Experienced Dentists</p>
              </div>

              <div>
                <p className="text-3xl md:text-4xl font-extrabold text-blue-700">100%</p>
                <p className="text-sm md:text-base text-slate-600">Personalized Treatment</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href="#book-now"
                className="w-full sm:w-auto flex justify-center items-center px-6 md:px-8 py-3 md:py-4 rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Book Your Appointment
              </a>

              <a
                href="#services"
                className="w-full sm:w-auto flex justify-center items-center px-6 md:px-8 py-3 md:py-4 rounded-full text-blue-700 bg-white hover:bg-blue-100 shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Our Services
              </a>
            </div>
          </div>

        </div>
      </motion.div>
    </section>
  );
}
