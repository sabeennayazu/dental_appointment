"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verify authentication and superuser status
        const isValid = await authService.verifyAuth();
        
        if (!isValid) {
          router.push("/admin/login");
        } else {
          router.push("/admin/dashboard");
        }
      } catch (error) {
        router.push("/admin/login");
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying admin access...</p>
      </div>
    </div>
  );
}
