"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { OrderStatus } from "@prisma/client"
import { ORDER_STATUSES } from "@/lib/order-constants"

export type AdminOrderListItem = {
  id: string
  status: OrderStatus
  total: number
  createdAt: Date
  customerName: string
  customerEmail: string | null
}

export type AdminOrderFilters = {
  status?: OrderStatus | "ALL"
  dateFrom?: string
  dateTo?: string
}

export async function getAdminOrders(
  filters?: AdminOrderFilters
): Promise<AdminOrderListItem[]> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return []
  }

  const where: Parameters<typeof prisma.order.findMany>[0]["where"] = {}
  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) {
      where.createdAt.gte = new Date(filters.dateFrom)
    }
    if (filters.dateTo) {
      const d = new Date(filters.dateTo)
      d.setHours(23, 59, 59, 999)
      where.createdAt.lte = d
    }
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  })

  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    total: Number(o.total),
    createdAt: o.createdAt,
    customerName: o.user.name ?? o.user.email ?? "—",
    customerEmail: o.user.email ?? null,
  }))
}

export type AdminOrderItemDetail = {
  id: string
  productName: string
  productSlug: string
  quantity: number
  priceAtPurchase: number
}

export type AdminOrderDetail = AdminOrderListItem & {
  orderItems: AdminOrderItemDetail[]
  shippingAddress: {
    street: string
    city: string
    state: string | null
    postalCode: string
    country: string
  } | null
  stripePaymentId: string | null
  stripeSessionId: string | null
}

export async function getAdminOrderDetail(
  orderId: string
): Promise<AdminOrderDetail | null> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      orderItems: {
        include: {
          product: { select: { name: true, slug: true } },
        },
      },
      shippingAddress: true,
    },
  })
  if (!order) return null

  return {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt,
    customerName: order.user.name ?? order.user.email ?? "—",
    customerEmail: order.user.email ?? null,
    orderItems: order.orderItems.map((item) => ({
      id: item.id,
      productName: item.product.name,
      productSlug: item.product.slug,
      quantity: item.quantity,
      priceAtPurchase: Number(item.priceAtPurchase),
    })),
    shippingAddress: order.shippingAddress
      ? {
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
        }
      : null,
    stripePaymentId: order.stripePaymentId,
    stripeSessionId: order.stripeSessionId,
  }
}

export type UpdateOrderStatusResult = { ok: true } | { ok: false; error: string }

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<UpdateOrderStatusResult> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  if (!ORDER_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid status" }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  })

  revalidatePath("/admin/orders")
  revalidatePath("/admin")
  return { ok: true }
}
