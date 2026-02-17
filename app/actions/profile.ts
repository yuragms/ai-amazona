"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type ProfileRecord = {
  name: string | null
  email: string | null
  image: string | null
}

export async function getProfile(): Promise<ProfileRecord | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  })
  return user
}

export type UpdateProfileInput = {
  name?: string
  email?: string
}

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: string }

export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: "Войдите в аккаунт." }
  }

  const email = input.email?.trim()
  if (email !== undefined && email !== null) {
    if (!email) {
      return { ok: false, error: "Email не может быть пустым." }
    }
    const existing = await prisma.user.findFirst({
      where: {
        email,
        id: { not: session.user.id },
      },
    })
    if (existing) {
      return { ok: false, error: "Этот email уже используется." }
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(input.name !== undefined && { name: input.name?.trim() || null }),
      ...(input.email !== undefined && { email: email || null }),
    },
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/profile")
  return { ok: true }
}
