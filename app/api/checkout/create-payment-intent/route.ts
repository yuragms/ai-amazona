import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getStripe } from "@/lib/stripe"
import { z } from "zod"

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

    const userId = session.user.id
    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, name: true, price: true, stock: true },
        },
      },
      orderBy: { id: "asc" },
    })
    if (!items?.length) {
      return NextResponse.json(
        { error: "Корзина пуста" },
        { status: 400 }
      )
    }

    let totalCents = 0
    for (const it of items) {
      const price = toNumber(it.product.price)
      if (price < 0 || it.product.stock < it.quantity) {
        return NextResponse.json(
          { error: `Товар "${it.product.name}" недоступен в нужном количестве` },
          { status: 400 }
        )
      }
      totalCents += Math.round(price * 100) * it.quantity
    }

    if (totalCents < 50) {
      return NextResponse.json(
        { error: "Минимальная сумма заказа $0.50" },
        { status: 400 }
      )
    }

    const SHIPPING_CENTS = 1000
    const TAX_RATE = 0.1
    const shippingPlusSubtotal = totalCents + SHIPPING_CENTS
    const taxCents = Math.round(shippingPlusSubtotal * TAX_RATE)
    const totalWithFeesCents = totalCents + SHIPPING_CENTS + taxCents
    const totalDecimal = totalWithFeesCents / 100

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey || !stripeSecretKey.startsWith("sk_")) {
      return NextResponse.json(
        {
          error:
            "STRIPE_SECRET_KEY не задан или неверный. Используйте секретный ключ (начинается с sk_) из Stripe Dashboard.",
        },
        { status: 500 }
      )
    }

    const order = await prisma.order.create({
      data: {
        userId,
        status: "PENDING",
        total: totalDecimal.toFixed(2),
        shippingAddressId: address.id,
      },
    })

    const stripe = getStripe()
    const amountInteger = Math.round(totalWithFeesCents)
    if (amountInteger < 50) {
      await prisma.order.delete({ where: { id: order.id } })
      return NextResponse.json(
        { error: "Сумма платежа меньше минимальной" },
        { status: 400 }
      )
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInteger,
      currency: "usd",
      metadata: { orderId: order.id },
      payment_method_types: ["card"],
    })

    if (!paymentIntent.client_secret) {
      await prisma.order.delete({ where: { id: order.id } })
      return NextResponse.json(
        { error: "Не удалось создать платёж" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    console.error("Create payment intent error:", e)

    const isInvalidStripeKey =
      /invalid api key|invalid_api_key|Invalid API Key/i.test(message) ||
      (e && typeof e === "object" && "type" in e && (e as { type?: string }).type === "StripeAuthenticationError")

    if (isInvalidStripeKey) {
      return NextResponse.json(
        {
          error:
            "Неверный ключ Stripe. В .env укажите корректный STRIPE_SECRET_KEY (секретный ключ sk_test_... из Stripe Dashboard → Developers → API keys).",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? `Ошибка при создании платежа: ${message}`
            : "Ошибка при создании платежа",
      },
      { status: 500 }
    )
  }
}
