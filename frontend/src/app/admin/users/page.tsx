import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { getUsers } from "@/lib/api/users";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Users</h1>
          <Button  >
            <Link href="/admin/users/new" legacyBehavior passHref>
              <span>Add user</span>
            </Link>
          </Button>
        </div>
        
        <div className="bg-white rounded-lg border">
          <DataTable 
            columns={columns} 
            data={users} 
            searchKey="username"
          />
        </div>
      </div>
    </AdminLayout>
  );
}
