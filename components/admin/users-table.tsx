"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateUserRole, type AdminUserListItem } from "@/app/actions/admin-users"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Role } from "@prisma/client"

const ROLE_LABELS: Record<Role, string> = {
  USER: "Customer",
  ADMIN: "Admin",
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

type UsersTableProps = {
  users: AdminUserListItem[]
}

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function handleRoleChange(userId: string, role: Role) {
    setUpdatingId(userId)
    try {
      const result = await updateUserRole(userId, role)
      if (result.ok) {
        toast.success("Role updated")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to update")
      }
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No users found.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name ?? "—"}</TableCell>
                  <TableCell>{u.email ?? "—"}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(v) => handleRoleChange(u.id, v as Role)}
                      disabled={updatingId === u.id}
                    >
                      <SelectTrigger className="h-8 w-[120px]">
                        {updatingId === u.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">
                          {ROLE_LABELS.USER}
                        </SelectItem>
                        <SelectItem value="ADMIN">
                          {ROLE_LABELS.ADMIN}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{u.orderCount}</TableCell>
                  <TableCell>{formatDate(u.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
