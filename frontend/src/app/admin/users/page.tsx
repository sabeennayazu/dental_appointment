"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { useUsers } from "@/hooks/useUsers";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const [mounted, setMounted] = useState(false);
  
  // Use client-side SWR hook instead of server-side fetching
  // This allows access to auth tokens from localStorage
  const {
    data: users = [],
    error: fetchError,
    isLoading,
    isValidating,
  } = useUsers(mounted);

  // Ensure component only renders after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const loading = isLoading || isValidating;
  const error = fetchError ? (fetchError as any).message : null;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Users</h1>
          <div className="flex items-center gap-2">
            {loading && (
              <span className="text-sm text-gray-500">
                <span className="inline-block animate-spin mr-2">⟳</span>
                Loading...
              </span>
            )}
            <Button>
              <Link href="/admin/users/new" >
                <span>Add user</span>
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="font-semibold">Error loading users</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-sm mt-2 text-gray-600">
              Make sure you are authenticated and have admin privileges.
            </p>
          </div>
        )}

        {!mounted ? (
          <div className="bg-white rounded-lg border p-4 text-center text-gray-500">
            Loading...
          </div>
        ) : (
          <div className="bg-white rounded-lg ">
            <DataTable 
              columns={columns} 
              data={users} 
              searchKey="username"
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
