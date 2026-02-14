"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export type OrderConfirmation = {
  id: string
  status: string
  total: number
  createdAt: Date
}

export type OrderItemDetail = {
  id: string
  productName: string
  quantity: number
  priceAtPurchase: number
}

export type AddressDetail = {
  street: string
  city: string
  state: string | null
  postalCode: string
  country: string
}

export type OrderDetails = OrderConfirmation & {
  orderItems: OrderItemDetail[]
  shippingAddress: AddressDetail | null
  subtotal: number
  shipping: number
  tax: number
}

const SHIPPING_FEE = 10

export async function getOrderByStripeSessionId(
  stripeSessionId: string
): Promise<OrderConfirmation | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const order = await prisma.order.findFirst({
    where: {
      stripeSessionId,
      userId: session.user.id,
    },
    select: { id: true, status: true, total: true, createdAt: true },
  })
  if (!order) return null

  return {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt,
  }
}

export async function getOrderById(
  orderId: string
): Promise<OrderConfirmation | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    select: { id: true, status: true, total: true, createdAt: true },
  })
  if (!order) return null

  return {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt,
  }
}

export async function getOrderDetails(
  orderId: string
): Promise<OrderDetails | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: {
      orderItems: {
        include: {
          product: { select: { name: true } },
        },
      },
      shippingAddress: true,
    },
  })
  if (!order) return null

  const total = Number(order.total)
  const orderItems: OrderItemDetail[] = order.orderItems.map((item) => ({
    id: item.id,
    productName: item.product.name,
    quantity: item.quantity,
    priceAtPurchase: Number(item.priceAtPurchase),
  }))
  const subtotal = orderItems.reduce(
    (sum, it) => sum + it.priceAtPurchase * it.quantity,
    0
  )
  const shipping = SHIPPING_FEE
  const tax = Math.round((total - subtotal - shipping) * 100) / 100

  return {
    id: order.id,
    status: order.status,
    total,
    createdAt: order.createdAt,
    orderItems,
    shippingAddress: order.shippingAddress
      ? {
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
        }
      : null,
    subtotal,
    shipping,
    tax,
  }
}

export async function getOrderDetailsByStripeSessionId(
  stripeSessionId: string
): Promise<OrderDetails | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const order = await prisma.order.findFirst({
    where: {
      stripeSessionId,
      userId: session.user.id,
    },
    include: {
      orderItems: {
        include: {
          product: { select: { name: true } },
        },
      },
      shippingAddress: true,
    },
  })
  if (!order) return null

  const total = Number(order.total)
  const orderItems: OrderItemDetail[] = order.orderItems.map((item) => ({
    id: item.id,
    productName: item.product.name,
    quantity: item.quantity,
    priceAtPurchase: Number(item.priceAtPurchase),
  }))
  const subtotal = orderItems.reduce(
    (sum, it) => sum + it.priceAtPurchase * it.quantity,
    0
  )
  const shipping = SHIPPING_FEE
  const tax = Math.round((total - subtotal - shipping) * 100) / 100

  return {
    id: order.id,
    status: order.status,
    total,
    createdAt: order.createdAt,
    orderItems,
    shippingAddress: order.shippingAddress
      ? {
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
        }
      : null,
    subtotal,
    shipping,
    tax,
  }
}
