"use client";

import React, { useEffect, useRef, useState } from "react";
import { User, HelpCircle, Settings, LogOut } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        open &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="w-full px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">🦷</span>
          <span className="font-bold text-lg text-blue-700">DentalCare</span>
        </a>

        {/* Search bar (hidden on mobile) */}
        <div className="flex-1 px-6 hidden sm:flex justify-center">
          <input
            aria-label="Search dentists or services"
            placeholder="Search dentists, services or city"
            className="w-full max-w-xl px-4 py-2 rounded-lg border border-gray-200 shadow-sm"
          />
        </div>

        {/* Nav links + profile */}
        <div className="flex items-center gap-6">
          <a href="/services" className="text-sm text-gray-700">Our Services</a>
          <a href="/appointments" className="text-sm text-blue-600 font-medium">Book</a>
          <a href="/bookings" className="text-sm text-gray-700">My Bookings</a>
          <a href="/contact" className="text-sm text-gray-700">Contact</a>

          {/* Profile dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              ref={buttonRef}
              onClick={() => setOpen((s) => !s)}
              aria-haspopup="true"
              aria-expanded={open}
              className="ml-2 flex items-center gap-2 rounded-full px-2 py-1 hover:bg-gray-100 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
                JD
              </div>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                <a
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User className="h-4 w-4 text-gray-500" />
                  Your profile
                </a>

                <a
                  href="/help"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                  Help & Support
                </a>

                <a
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 text-gray-500" />
                  Settings & Privacy
                </a>

                <button
                  onClick={() => {
                    setOpen(false);
                    window.location.href = "/logout";
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4 text-gray-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
