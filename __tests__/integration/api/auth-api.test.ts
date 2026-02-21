import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as forgotPasswordPost } from "@/app/api/auth/forgot-password/route"
import { POST as resetPasswordPost } from "@/app/api/auth/reset-password/route"

const mockUserFindUnique = vi.fn()
const mockVerificationTokenFindUnique = vi.fn()
const mockVerificationTokenDeleteMany = vi.fn()
const mockVerificationTokenCreate = vi.fn()
const mockVerificationTokenDelete = vi.fn()
const mockUserUpdate = vi.fn()
const mockTransaction = vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[]))
const mockSendPasswordResetEmail = vi.fn()

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    verificationToken: {
      findUnique: (...args: unknown[]) => mockVerificationTokenFindUnique(...args),
      deleteMany: (...args: unknown[]) => mockVerificationTokenDeleteMany(...args),
      create: (...args: unknown[]) => mockVerificationTokenCreate(...args),
      delete: (...args: unknown[]) => mockVerificationTokenDelete(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: (payload: unknown) => mockSendPasswordResetEmail(payload),
}))

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendPasswordResetEmail.mockResolvedValue({ ok: true })
  })

  it("returns 400 when body is not valid JSON", async () => {
    const req = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    })
    const res = await forgotPasswordPost(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Invalid JSON")
    expect(mockUserFindUnique).not.toHaveBeenCalled()
  })

  it("returns 400 when email is missing", async () => {
    const req = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    })
    const res = await forgotPasswordPost(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Email is required")
    expect(mockUserFindUnique).not.toHaveBeenCalled()
  })

  it("returns 200 with generic message when user not found (security)", async () => {
    mockUserFindUnique.mockResolvedValue(null)
    const req = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "unknown@example.com" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await forgotPasswordPost(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.message).toContain("If this email exists")
    expect(mockVerificationTokenCreate).not.toHaveBeenCalled()
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it("returns 200 with generic message when user has no password (OAuth only)", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "u1",
      email: "oauth@example.com",
      password: null,
    })
    const req = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "oauth@example.com" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await forgotPasswordPost(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.message).toContain("If this email exists")
    expect(mockVerificationTokenCreate).not.toHaveBeenCalled()
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it("creates token, sends email and returns 200 when user exists with password", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "u1",
      email: "user@example.com",
      password: "hashed",
    })
    mockVerificationTokenDeleteMany.mockResolvedValue({ count: 0 })
    mockVerificationTokenCreate.mockResolvedValue({})
    const req = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "  User@Example.com  " }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await forgotPasswordPost(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.message).toContain("If this email exists")
    expect(mockUserFindUnique).toHaveBeenCalledWith({ where: { email: "user@example.com" } })
    expect(mockVerificationTokenDeleteMany).toHaveBeenCalledWith({ where: { identifier: "user@example.com" } })
    expect(mockVerificationTokenCreate).toHaveBeenCalled()
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@example.com", resetUrl: expect.any(String) })
    )
  })

  it("returns 500 when email send fails", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "u1",
      email: "user@example.com",
      password: "hashed",
    })
    mockVerificationTokenDeleteMany.mockResolvedValue({ count: 0 })
    mockVerificationTokenCreate.mockResolvedValue({})
    mockSendPasswordResetEmail.mockResolvedValue({ ok: false, error: "Resend error" })
    const req = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await forgotPasswordPost(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toContain("Failed to send email")
  })
})

describe("POST /api/auth/reset-password", () => {
  const validToken = "valid-token-123"
  const futureExpiry = new Date(Date.now() + 60 * 60 * 1000)
  const user = { id: "u1", email: "user@example.com", password: "old-hash" }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUserUpdate.mockResolvedValue(user)
    mockVerificationTokenDelete.mockResolvedValue({})
  })

  it("returns 400 when body is not valid JSON", async () => {
    const req = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    })
    const res = await resetPasswordPost(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Invalid JSON")
    expect(mockVerificationTokenFindUnique).not.toHaveBeenCalled()
  })

  it("returns 400 when token is missing", async () => {
    const req = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ password: "newpass123" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await resetPasswordPost(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Token is required")
    expect(mockVerificationTokenFindUnique).not.toHaveBeenCalled()
  })

  it("returns 400 when password is shorter than 6 characters", async () => {
    const req = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: validToken, password: "12345" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await resetPasswordPost(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain("at least 6 characters")
    expect(mockVerificationTokenFindUnique).not.toHaveBeenCalled()
  })

  it("returns 400 when token is invalid or expired", async () => {
    mockVerificationTokenFindUnique.mockResolvedValue(null)
    const req = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: "bad-token", password: "newpass123" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await resetPasswordPost(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain("Invalid or expired")
  })

  it("returns 400 when token is expired", async () => {
    mockVerificationTokenFindUnique.mockResolvedValue({
      identifier: "user@example.com",
      token: validToken,
      expires: new Date(Date.now() - 1000),
    })
    const req = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: validToken, password: "newpass123" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await resetPasswordPost(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain("Invalid or expired")
  })

  it("resets password and returns 200 when token and password are valid", async () => {
    mockVerificationTokenFindUnique.mockResolvedValue({
      identifier: "user@example.com",
      token: validToken,
      expires: futureExpiry,
    })
    mockUserFindUnique.mockResolvedValue(user)
    const req = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: validToken, password: "newpass123" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await resetPasswordPost(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.message).toContain("Password has been reset")
    expect(mockVerificationTokenFindUnique).toHaveBeenCalledWith({ where: { token: validToken } })
    expect(mockUserFindUnique).toHaveBeenCalledWith({ where: { email: "user@example.com" } })
    expect(mockTransaction).toHaveBeenCalled()
  })
})
