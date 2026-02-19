import { createRouteHandler } from "uploadthing/next"
import { NextRequest, NextResponse } from "next/server"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { ourFileRouter } from "./core"

function getTokenRaw(): string {
  const fromEnv = process.env.UPLOADTHING_TOKEN?.trim()
  if (fromEnv) return fromEnv
  try {
    for (const name of [".env", ".env.local"]) {
      const p = join(process.cwd(), name)
      if (!existsSync(p)) continue
      const content = readFileSync(p, "utf-8")
      for (const line of content.split("\n")) {
        const t = line.trim()
        if (!t.startsWith("UPLOADTHING_TOKEN=")) continue
        const value = t.slice("UPLOADTHING_TOKEN=".length).trim()
        const unquoted = value.replace(/^["']|["']$/g, "")
        if (unquoted) return unquoted
      }
    }
  } catch {
    // ignore
  }
  return ""
}

function validateToken(): { ok: true; token: string } | { ok: false; message: string; reason?: string } {
  const token = getTokenRaw()
  if (!token) {
    const msg =
      "UPLOADTHING_TOKEN is missing. Add it in .env (or .env.local) and restart the dev server. Get the token at https://uploadthing.com/dashboard → API Keys → V7."
    if (process.env.NODE_ENV === "development") {
      console.error("[uploadthing] UPLOADTHING_TOKEN is not set. Add it to .env and restart `npm run dev`.")
    }
    return { ok: false, message: msg, reason: "missing" }
  }
  let decoded: string
  try {
    decoded = Buffer.from(token, "base64").toString("utf-8")
  } catch {
    return {
      ok: false,
      message:
        "UPLOADTHING_TOKEN is not valid base64. Get a new token at https://uploadthing.com/dashboard (API Keys, V7).",
      reason: "invalid_base64",
    }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(decoded)
  } catch {
    return {
      ok: false,
      message:
        "UPLOADTHING_TOKEN decoded value is not JSON. Get a new token at https://uploadthing.com/dashboard (API Keys, V7).",
      reason: "invalid_json",
    }
  }
  if (typeof parsed !== "object" || parsed === null) {
    return {
      ok: false,
      message:
        "UPLOADTHING_TOKEN must be base64 JSON: { apiKey, appId, regions }. Get a new token at https://uploadthing.com/dashboard (API Keys, V7).",
      reason: "invalid_shape",
    }
  }
  const o = parsed as Record<string, unknown>
  if (typeof o.apiKey !== "string" || !o.apiKey.startsWith("sk_")) {
    if (process.env.NODE_ENV === "development") {
      console.error("[uploadthing] Token apiKey must start with 'sk_'. You may be using an old v6 secret. Use the V7 token from the dashboard.")
    }
    return {
      ok: false,
      message:
        "UPLOADTHING_TOKEN must contain apiKey starting with 'sk_'. Use the token from Uploadthing dashboard → API Keys → V7 (not the old secret).",
      reason: "invalid_apiKey",
    }
  }
  if (typeof o.appId !== "string" || o.appId.length === 0) {
    return {
      ok: false,
      message:
        "UPLOADTHING_TOKEN must contain non-empty appId. Get a new token at https://uploadthing.com/dashboard (API Keys, V7).",
      reason: "invalid_appId",
    }
  }
  if (!Array.isArray(o.regions) || o.regions.length === 0) {
    return {
      ok: false,
      message:
        "UPLOADTHING_TOKEN must contain non-empty regions array. Get a new token at https://uploadthing.com/dashboard (API Keys, V7).",
      reason: "invalid_regions",
    }
  }
  return { ok: true, token }
}

const { GET: rawGET, POST: rawPOST } = createRouteHandler({
  router: ourFileRouter,
})

async function errorResponse(message: string) {
  return NextResponse.json(
    {
      error: message,
      hint: "Get the token at https://uploadthing.com/dashboard → API Keys → V7. It must be base64 JSON with apiKey (sk_…), appId, and regions.",
    },
    { status: 500 }
  )
}

export async function GET(req: NextRequest) {
  const tokenValidation = validateToken()
  if (!tokenValidation.ok) {
    return errorResponse(tokenValidation.message)
  }
  const prevToken = process.env.UPLOADTHING_TOKEN
  process.env.UPLOADTHING_TOKEN = tokenValidation.token
  try {
    return await rawGET(req)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[uploadthing GET]", message)
    return errorResponse(message)
  } finally {
    process.env.UPLOADTHING_TOKEN = prevToken
  }
}

export async function POST(req: NextRequest) {
  const tokenValidation = validateToken()
  if (!tokenValidation.ok) {
    return errorResponse(tokenValidation.message)
  }
  const prevToken = process.env.UPLOADTHING_TOKEN
  process.env.UPLOADTHING_TOKEN = tokenValidation.token
  try {
    return await rawPOST(req)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[uploadthing POST]", message)
    return errorResponse(message)
  } finally {
    process.env.UPLOADTHING_TOKEN = prevToken
  }
}
