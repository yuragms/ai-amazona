"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { Role } from "@prisma/client"

export type AdminUserListItem = {
  id: string
  name: string | null
  email: string | null
  role: Role
  createdAt: Date
  orderCount: number
}

export async function getAdminUsers(): Promise<AdminUserListItem[]> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return []
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
    },
  })

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    orderCount: u._count.orders,
  }))
}

export type UpdateUserRoleResult = { ok: true } | { ok: false; error: string }

export async function updateUserRole(
  userId: string,
  role: Role
): Promise<UpdateUserRoleResult> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  if (role !== "USER" && role !== "ADMIN") {
    return { ok: false, error: "Invalid role" }
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })
  if (!target) {
    return { ok: false, error: "User not found" }
  }

  if (target.id === session.user.id && role !== "ADMIN") {
    return { ok: false, error: "You cannot remove your own admin role." }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  })

  revalidatePath("/admin/users")
  revalidatePath("/admin")
  return { ok: true }
}
