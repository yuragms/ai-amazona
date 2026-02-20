import { NextResponse } from "next/server"
import { sendOrderConfirmation } from "@/lib/email"

/**
 * Только для разработки: отправить тестовое письмо подтверждения заказа.
 * GET /api/test-email?to=your@email.com
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const to = searchParams.get("to")?.trim()
  if (!to) {
    return NextResponse.json(
      { error: "Add ?to=your@email.com to send a test order confirmation email" },
      { status: 400 }
    )
  }

  const result = await sendOrderConfirmation({
    to,
    userName: "Тестовый Покупатель",
    orderId: "test-order-123",
    total: "99.99",
    items: [
      { name: "Тестовый товар 1", quantity: 2, price: "29.99" },
      { name: "Тестовый товар 2", quantity: 1, price: "39.01" },
    ],
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json({ message: "Test email sent to " + to })
}
