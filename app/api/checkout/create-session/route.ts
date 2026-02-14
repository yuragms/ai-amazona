import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getCartItems } from "@/app/actions/cart"
import { prisma } from "@/lib/db"
import { getStripe } from "@/lib/stripe"
import { headers } from "next/headers"
import { z } from "zod"
import type Stripe from "stripe"

function toNumber(value: unknown): number {
  if (value == null) return 0
  if (typeof value === "number" && !Number.isNaN(value)) return value
  if (typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber()
  }
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}

const bodySchema = z.object({
  addressId: z.string().min(1, "Выберите адрес доставки"),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Необходимо войти в аккаунт" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues?.[0]
      const msg = first?.message ?? "Неверные данные"
      return NextResponse.json({ error: String(msg) }, { status: 400 })
    }

    const { addressId } = parsed.data

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: session.user.id },
    })
    if (!address) {
      return NextResponse.json(
        { error: "Адрес не найден или не принадлежит вам" },
        { status: 400 }
      )
    }

    const items = await getCartItems()
    if (!items?.length) {
      return NextResponse.json(
        { error: "Корзина пуста" },
        { status: 400 }
      )
    }

    let totalCents = 0
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    for (const it of items) {
      const price = toNumber(it.product.price)
      if (price < 0 || it.product.stock < it.quantity) {
        return NextResponse.json(
          { error: `Товар "${it.product.name}" недоступен в нужном количестве` },
          { status: 400 }
        )
      }
      const amountCents = Math.round(price * 100)
      totalCents += amountCents * it.quantity
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: it.product.name,
            images: it.product.images.length ? [it.product.images[0]] : undefined,
            metadata: { productId: it.product.id },
          },
        },
        quantity: it.quantity,
      })
    }

    if (totalCents < 50) {
      return NextResponse.json(
        { error: "Минимальная сумма заказа $0.50" },
        { status: 400 }
      )
    }

    const totalDecimal = totalCents / 100
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
        total: totalDecimal.toFixed(2),
        shippingAddressId: address.id,
      },
    })

    const stripe = getStripe()
    const headersList = await headers()
    const origin =
      headersList.get("x-forwarded-host") ||
      headersList.get("host") ||
      "localhost:3000"
    const protocol = headersList.get("x-forwarded-proto") || "http"
    const baseUrl = `${protocol}://${origin}`

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
      metadata: { orderId: order.id },
      client_reference_id: order.id,
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: stripeSession.id },
    })

    if (!stripeSession.url) {
      await prisma.order.delete({ where: { id: order.id } })
      return NextResponse.json(
        { error: "Не удалось создать сессию оплаты" },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: stripeSession.url })
  } catch (e) {
    console.error("Checkout create-session error:", e)
    return NextResponse.json(
      { error: "Ошибка при создании сессии оплаты" },
      { status: 500 }
    )
  }
}
