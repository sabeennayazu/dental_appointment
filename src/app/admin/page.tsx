"use client";

import { useEffect } from "react";

export default function AdminRedirect() {
  useEffect(() => {
    window.location.href = "http://localhost:8000/admin/";
  }, []);

  return <p>Redirecting to admin...</p>;
}
