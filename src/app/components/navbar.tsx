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
    <header className="sticky top-0 z-40 w-full bg-white">
      <div className="w-full px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2 hover:scale-105 transition-transform">
          <span className="text-2xl">🦷</span>
          <span className="font-bold text-2xl text-blue-700">DentalCare</span>
        </a>

        {/* Nav links + profile */}
        <div className="flex items-center gap-6">
          {[
            { href: "/services", label: "Our Services" },
            { href: "/appointments", label: "Book" },
            { href: "/bookings", label: "My Bookings" },
            { href: "/contact", label: "Contact" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-black transition-all hover:underline hover:text-[#1E40AF] hover:scale-105"
            >
              {link.label}
            </a>
          ))}

          {/* Profile dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              ref={buttonRef}
              onClick={() => setOpen((s) => !s)}
              aria-haspopup="true"
              aria-expanded={open}
              className="ml-2 flex items-center gap-2 rounded-full px-2 py-1 focus:outline-none transition-transform hover:scale-105"
            >
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
                JD
              </div>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                {[
                  { href: "/profile", label: "Your profile", icon: <User className="h-4 w-4" /> },
                  { href: "/help", label: "Help & Support", icon: <HelpCircle className="h-4 w-4" /> },
                  { href: "/settings", label: "Settings & Privacy", icon: <Settings className="h-4 w-4" /> },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-black hover:underline hover:text-[#1E40AF] hover:scale-105 transition-all"
                  >
                    {item.icon}
                    {item.label}
                  </a>
                ))}
                <button
                  onClick={() => {
                    setOpen(false);
                    window.location.href = "/logout";
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-black hover:underline hover:text-[#1E40AF] hover:scale-105 transition-all"
                >
                  <LogOut className="h-4 w-4" />
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
