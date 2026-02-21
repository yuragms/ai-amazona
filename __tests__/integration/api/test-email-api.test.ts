import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/test-email/route"

const mockSendOrderConfirmation = vi.fn()

vi.mock("@/lib/email", () => ({
  sendOrderConfirmation: (payload: unknown) => mockSendOrderConfirmation(payload),
}))

describe("GET /api/test-email", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendOrderConfirmation.mockResolvedValue({ ok: true })
  })

  it("returns 400 when query param 'to' is missing", async () => {
    const req = new Request("http://localhost/api/test-email")
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain("to=")
    expect(mockSendOrderConfirmation).not.toHaveBeenCalled()
  })

  it("returns 400 when 'to' is empty after trim", async () => {
    const req = new Request("http://localhost/api/test-email?to=   ")
    const res = await GET(req)
    expect(res.status).toBe(400)
    expect(mockSendOrderConfirmation).not.toHaveBeenCalled()
  })

  it("returns 200 and sends email when 'to' is provided", async () => {
    const req = new Request("http://localhost/api/test-email?to=dev@example.com")
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.message).toContain("dev@example.com")
    expect(mockSendOrderConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "dev@example.com",
        orderId: "test-order-123",
        total: "99.99",
      })
    )
  })

  it("returns 500 when sendOrderConfirmation fails", async () => {
    mockSendOrderConfirmation.mockResolvedValue({ ok: false, error: "Resend error" })
    const req = new Request("http://localhost/api/test-email?to=dev@example.com")
    const res = await GET(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe("Resend error")
  })
})
