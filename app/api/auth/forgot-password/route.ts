import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "crypto"

const TOKEN_EXPIRY_HOURS = 1

export async function POST(request: Request) {
  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user || !user.password) {
    return NextResponse.json({ message: "If this email exists, you will receive a reset link." })
  }

  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`

  const result = await sendPasswordResetEmail({ to: email, resetUrl })
  if (!result.ok) {
    return NextResponse.json(
      { error: "Failed to send email. Try again later." },
      { status: 500 }
    )
  }

  return NextResponse.json({ message: "If this email exists, you will receive a reset link." })
}
