"use client";

import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't apply layout to login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return <>{children}</>;
}
