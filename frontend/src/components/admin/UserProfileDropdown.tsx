"use client";

"use client";

import { useState, useEffect } from "react";
import { User, LogOut } from "lucide-react";
import { authService } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  phone_number?: string;
}

export function UserProfileDropdown() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = authService.getUser();
        if (userData && userData.id) {
          // If we have minimal user data from auth, we can enhance it with full user data
          const response = await apiClient.get(`/api/users/${userData.id}/`);
          if (response) {
            setUser(response as UserData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push("/admin/login");
  };

  if (!user) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
        <User className="h-5 w-5 text-gray-500" />
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
        >
          <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center">
            <User className="h-4 w-4 text-cyan-700" />
          </div>
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.is_staff ? "Administrator" : "Staff"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>Member since</span>
            <span className="text-gray-900 font-medium">
              {format(new Date(user.date_joined), "MMM d, yyyy")}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 focus:text-red-800 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
