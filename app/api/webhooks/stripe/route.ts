import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe"
import { prisma } from "@/lib/db"
import type Stripe from "stripe"

export async function POST(request: Request) {
  let event: Stripe.Event
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
    }

    const stripe = getStripe()
    const secret = getStripeWebhookSecret()
    event = stripe.webhooks.constructEvent(body, signature, secret) as Stripe.Event
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown webhook error"
    console.error("Stripe webhook error:", message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    const orderId = session.client_reference_id ?? session.metadata?.orderId
    if (!orderId) {
      console.error("Stripe webhook: no orderId in session")
      return NextResponse.json({ error: "Missing order reference" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    })
    if (!order) {
      console.error("Stripe webhook: order not found", orderId)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ ok: true })
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent as { id?: string } | null)?.id ?? null

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: order.userId },
      include: {
        product: { select: { id: true, price: true, stock: true } },
      },
    })

    await prisma.$transaction(async (tx) => {
      for (const it of cartItems) {
        const priceAtPurchase = it.product.price
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: it.product.id,
            quantity: it.quantity,
            priceAtPurchase,
          },
        })
        await tx.product.update({
          where: { id: it.product.id },
          data: { stock: { decrement: it.quantity } },
        })
      }

      await tx.cartItem.deleteMany({
        where: { userId: order.userId },
      })

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          ...(paymentIntentId && { stripePaymentId: paymentIntentId }),
        },
      })
    })
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const orderId = paymentIntent.metadata?.orderId
    if (!orderId) {
      console.error("Stripe webhook: no orderId in payment_intent")
      return NextResponse.json({ received: true })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    })
    if (!order || order.status !== "PENDING") {
      return NextResponse.json({ received: true })
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: order.userId },
      include: {
        product: { select: { id: true, price: true, stock: true } },
      },
    })

    await prisma.$transaction(async (tx) => {
      for (const it of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: it.product.id,
            quantity: it.quantity,
            priceAtPurchase: it.product.price,
          },
        })
        await tx.product.update({
          where: { id: it.product.id },
          data: { stock: { decrement: it.quantity } },
        })
      }
      await tx.cartItem.deleteMany({ where: { userId: order.userId } })
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", stripePaymentId: paymentIntent.id },
      })
    })
  }

  return NextResponse.json({ received: true })
}
