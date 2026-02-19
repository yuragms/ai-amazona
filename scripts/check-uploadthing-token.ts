/**
 * Checks UPLOADTHING_TOKEN in .env / .env.local without printing the token.
 * Run: npx tsx scripts/check-uploadthing-token.ts
 */

import { readFileSync, existsSync } from "fs"
import { join } from "path"

function parseTokenFromContent(content: string): string {
  let token = ""
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (trimmed.startsWith("UPLOADTHING_TOKEN=")) {
      const value = trimmed.slice("UPLOADTHING_TOKEN=".length).trim()
      token = value.startsWith('"') && value.endsWith('"')
        ? value.slice(1, -1)
        : value
      break
    }
  }
  return token
}

const envPaths = [join(process.cwd(), ".env.local"), join(process.cwd(), ".env")]
let token = ""
let usedFile = ""
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8")
    token = parseTokenFromContent(content)
    if (token) {
      usedFile = envPath
      break
    }
  }
}

if (!token) {
  console.error("ERROR: UPLOADTHING_TOKEN is missing or empty in .env and .env.local")
  console.error("Add in .env: UPLOADTHING_TOKEN=<token from https://uploadthing.com/dashboard>")
  process.exit(1)
}

try {
  const decoded = Buffer.from(token, "base64").toString("utf-8")
  const parsed = JSON.parse(decoded) as unknown
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("apiKey" in parsed) ||
    !("appId" in parsed) ||
    !("regions" in parsed)
  ) {
    console.error(
      "ERROR: Token decoded but invalid structure. Expected JSON with apiKey, appId, regions."
    )
    process.exit(1)
  }
  const obj = parsed as { apiKey: unknown; appId: unknown; regions: unknown }
  if (typeof obj.apiKey !== "string" || obj.apiKey.length === 0) {
    console.error("ERROR: Token apiKey is missing or not a non-empty string")
    process.exit(1)
  }
  if (typeof obj.appId !== "string" || obj.appId.length === 0) {
    console.error("ERROR: Token appId is missing or not a non-empty string")
    process.exit(1)
  }
  if (!Array.isArray(obj.regions) || obj.regions.length === 0) {
    console.error("ERROR: Token regions must be a non-empty array")
    process.exit(1)
  }
  console.log("OK: UPLOADTHING_TOKEN is set and format is valid (base64 JSON with apiKey, appId, regions).")
  if (usedFile) console.log("(Read from " + usedFile.split("/").pop() + ")")
} catch (e) {
  const err = e instanceof Error ? e.message : String(e)
  if (err.includes("JSON")) {
    console.error("ERROR: Token is not valid base64 or decoded value is not JSON:", err)
  } else {
    console.error("ERROR:", err)
  }
  process.exit(1)
}
