"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Only render after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  const navLinks = [
    { href: "/services", label: "Our Services" },
    { href: "/status", label: "Status" },
    { href: "/contact", label: "Contact" },
    
  ];

  if (!mounted) return null; // Avoid SSR mismatch

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-white shadow-md py-2" : "bg-white/95 backdrop-blur-sm py-4"
      }`}
    >
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2 group">
            <span className="text-3xl text-blue-600">🦷</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Alfa Dental
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <div key={link.href} className="relative group flex items-center">
                <a
                  href={link.href}
                  className={`
                    px-3 py-2 text-sm font-medium transition-colors
                    ${pathname === link.href ? "text-blue-600" : "text-gray-700 group-hover:text-blue-600"}
                  `}
                >
                  {link.label}
                </a>

                {/* Floating Underline */}
                <span
                  className={`
                    absolute bottom-[-6px] left-1/2 -translate-x-1/2 h-[2px] bg-blue-600 rounded-full
                    transition-transform duration-300 origin-center
                    ${pathname === link.href ? "w-full scale-x-100" : "w-full scale-x-0 group-hover:scale-x-100"}
                  `}
                ></span>
              </div>
            ))}

            <a
              href="/book-now"
              className="ml-4 inline-flex items-center px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Book Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${mobileOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/book-now"
            className="block w-full text-center mt-2 px-3 py-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium hover:from-blue-700 hover:to-cyan-600 transition-colors"
          >
            Book Now
          </a>
        </div>
      </div>
    </header>
  );
}
