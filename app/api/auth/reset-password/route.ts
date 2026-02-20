import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  let body: { token?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const token = typeof body.token === "string" ? body.token.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
  }

  const verification = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!verification || verification.expires < new Date()) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
  }

  const email = verification.identifier
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    }),
  ])

  return NextResponse.json({ message: "Password has been reset. You can sign in now." })
}
