"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export type ReportData = {
  from: string
  to: string
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  orders: Array<{
    id: string
    createdAt: string
    status: string
    total: number
    customerName: string
    customerEmail: string | null
  }>
  salesByCategory: Array<{ categoryName: string; revenue: number; orderCount: number }>
}

export type SalesByCategoryRow = {
  categoryName: string
  revenue: number
  orderCount: number
}

export async function getSalesByCategory(
  fromDate: string,
  toDate: string
): Promise<SalesByCategoryRow[]> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return []
  }

  const from = new Date(fromDate)
  const to = new Date(toDate)
  to.setHours(23, 59, 59, 999)

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: from, lte: to },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
    },
    select: {
      quantity: true,
      priceAtPurchase: true,
      product: { select: { categoryId: true } },
    },
  })

  const categoryIds = [...new Set(orderItems.map((i) => i.product.categoryId))]
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  })
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  const byCategory = new Map<string, { revenue: number; orderCount: number }>()
  for (const item of orderItems) {
    const cid = item.product.categoryId
    const lineTotal = Number(item.priceAtPurchase) * item.quantity
    const cur = byCategory.get(cid) ?? { revenue: 0, orderCount: 0 }
    cur.revenue += lineTotal
    cur.orderCount += item.quantity
    byCategory.set(cid, cur)
  }

  return Array.from(byCategory.entries())
    .map(([categoryId, { revenue, orderCount }]) => ({
      categoryName: categoryMap.get(categoryId) ?? "Unknown",
      revenue,
      orderCount,
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

export async function getReportData(
  fromDate: string,
  toDate: string
): Promise<ReportData | null> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null
  }

  const from = new Date(fromDate)
  const to = new Date(toDate)
  to.setHours(23, 59, 59, 999)

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      status: { notIn: ["CANCELLED", "REFUNDED"] },
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  })

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0)
  const totalOrders = orders.length
  const averageOrderValue =
    totalOrders > 0 ? totalRevenue / totalOrders : 0

  const salesByCategory = await getSalesByCategory(fromDate, toDate)

  return {
    from: fromDate,
    to: toDate,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    orders: orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt.toISOString(),
      status: o.status,
      total: Number(o.total),
      customerName: o.user.name ?? "—",
      customerEmail: o.user.email,
    })),
    salesByCategory,
  }
}

export async function generateOrdersCsv(
  fromDate: string,
  toDate: string
): Promise<{ csv: string; filename: string } | null> {
  const data = await getReportData(fromDate, toDate)
  if (!data) return null

  const headers = [
    "Order ID",
    "Date",
    "Customer",
    "Email",
    "Status",
    "Total",
  ]
  const rows = data.orders.map((o) => [
    o.id,
    new Date(o.createdAt).toLocaleString(),
    o.customerName,
    o.customerEmail ?? "",
    o.status,
    o.total.toFixed(2),
  ])

  const escape = (v: string) => {
    const s = String(v)
    if (s.includes(",") || s.includes('"') || s.includes("\n"))
      return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const csv =
    headers.map(escape).join(",") +
    "\n" +
    rows.map((r) => r.map(escape).join(",")).join("\n")

  const filename = `orders-report-${fromDate}-to-${toDate}.csv`
  return { csv, filename }
}
