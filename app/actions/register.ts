"use server"

import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { Role } from "@prisma/client"

const registerSchema = z.object({
  email: z.string().min(1, "Введите email").email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
  name: z.string().min(1, "Введите имя").max(100, "Слишком длинное имя"),
  role: z.enum(["USER", "ADMIN"]),
})

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: string; field?: keyof z.infer<typeof registerSchema> }

export async function register(
  _prev: unknown,
  formData: FormData
): Promise<RegisterResult> {
  const raw = {
    email: (formData.get("email") as string)?.trim(),
    password: formData.get("password") as string,
    name: (formData.get("name") as string)?.trim(),
    role: formData.get("role") as string,
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const field = (Object.keys(first)[0] || "email") as keyof z.infer<typeof registerSchema>
    const message = first[field]?.[0] ?? "Ошибка валидации"
    return { ok: false, error: message, field }
  }

  const { email, password, name, role } = parsed.data

  const existing = await prisma.user.findUnique({
    where: { email },
  })
  if (existing) {
    return { ok: false, error: "Пользователь с таким email уже зарегистрирован", field: "email" }
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role as Role,
    },
  })

  return { ok: true }
}
