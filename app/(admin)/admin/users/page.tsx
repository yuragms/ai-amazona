import { getAdminUsers } from "@/app/actions/admin-users"
import { UsersTable } from "@/components/admin/users-table"

export default async function AdminUsersPage() {
  const users = await getAdminUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Customer list, admin privileges, and user actions.
        </p>
      </div>

      <UsersTable users={users} />
    </div>
  )
}
