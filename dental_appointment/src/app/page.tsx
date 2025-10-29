'use client';

import Hero from './components/hero';
import Services from './components/services';
import Benefits from './components/benefits';
import Testimonials from './components/testimonials';
import BookNow from '@/app/components/book-now';
import Contact from './components/contact';

export default function HomePage() {
  const animProps = () => ({});

  return (
    <main className="w-full h-screen overflow-y-scroll overflow-x-hidden scroll-smooth bg-gradient-to-b from-white via-blue-50 to-white text-gray-900 md:snap-y md:snap-mandatory">
      {/* Decorative background blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-blue-200 blur-3xl opacity-40" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-cyan-200 blur-3xl opacity-40" />
      </div>

      <section className="md:snap-start">
        <Hero isMobile={false} animProps={animProps} />
      </section>

      <section className="md:snap-start">
        <Services isMobile={false} animProps={animProps} />
      </section>

      <section className="md:snap-start">
        <Benefits isMobile={false} animProps={animProps} />
      </section>

      <section className="md:snap-start">
        <Testimonials isMobile={false} animProps={animProps} />
      </section>

      <section className="md:snap-start">
        <BookNow isMobile={false} animProps={animProps} />
      </section>

      <section className="md:snap-start">
        <Contact isMobile={false} animProps={animProps} />
      </section>
    </main>
  );
}
