import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Health check for load balancers and monitoring.
 * GET /api/health → 200 { status: "ok" }
 * GET /api/health?db=1 → 200 with DB ping or 503 if DB unreachable
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const checkDb = searchParams.get("db") === "1"

  if (!checkDb) {
    return NextResponse.json({ status: "ok" })
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: "ok", database: "connected" })
  } catch {
    return NextResponse.json(
      { status: "error", database: "disconnected" },
      { status: 503 }
    )
  }
}
