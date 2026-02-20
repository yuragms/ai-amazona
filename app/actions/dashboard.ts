"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { unstable_cache } from "next/cache"

const LOW_STOCK_THRESHOLD = 10
const ADMIN_METRICS_REVALIDATE = 30

function subDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

export async function getDashboardMetrics() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null
  }

  return unstable_cache(
    async () => {
      const [totalRevenue, totalOrders, totalCustomers, lowStockCount] =
        await Promise.all([
          prisma.order.aggregate({
            where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
            _sum: { total: true },
          }),
          prisma.order.count({
            where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
          }),
          prisma.user.count({ where: { role: "USER" } }),
          prisma.product.count({ where: { stock: { lt: LOW_STOCK_THRESHOLD } } }),
        ])
      const revenue = Number(totalRevenue._sum.total ?? 0)
      const aov = totalOrders > 0 ? revenue / totalOrders : 0
      return {
        totalRevenue: revenue,
        totalOrders,
        totalCustomers,
        averageOrderValue: aov,
        lowStockCount,
      }
    },
    ["admin-dashboard-metrics"],
    { revalidate: ADMIN_METRICS_REVALIDATE }
  )()
}

export type LiveMetrics = { orderCount: number; lowStockCount: number }

export async function getAdminLiveMetrics(): Promise<LiveMetrics | null> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null
  }
  const [orderCount, lowStockCount] = await Promise.all([
    prisma.order.count({
      where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
    }),
    prisma.product.count({ where: { stock: { lt: LOW_STOCK_THRESHOLD } } }),
  ])
  return { orderCount, lowStockCount }
}

export type RevenueDataPoint = { date: string; revenue: number; orders: number }

export async function getRevenueChartData(period: "7d" | "30d" | "90d" = "30d") {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return []
  }

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
  const start = subDays(new Date(), days)
  const end = new Date()

  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      createdAt: { gte: start, lte: end },
    },
    select: { total: true, createdAt: true },
  })

  const byDate = new Map<string, { revenue: number; orders: number }>()
  for (let i = 0; i <= days; i++) {
    const d = subDays(end, days - i)
    const key = d.toISOString().slice(0, 10)
    byDate.set(key, { revenue: 0, orders: 0 })
  }

  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10)
    const current = byDate.get(key)
    if (current) {
      current.revenue += Number(o.total)
      current.orders += 1
    }
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { revenue, orders }]) => ({ date, revenue, orders }))
}

export type PeakOrderingHour = { hour: number; count: number; label: string }

export async function getPeakOrderingTimes(days: number = 30): Promise<PeakOrderingHour[]> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return []
  }

  const start = subDays(new Date(), days)
  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      createdAt: { gte: start },
    },
    select: { createdAt: true },
  })

  const byHour = new Map<number, number>()
  for (let h = 0; h < 24; h++) byHour.set(h, 0)
  for (const o of orders) {
    const h = o.createdAt.getHours()
    byHour.set(h, (byHour.get(h) ?? 0) + 1)
  }

  return Array.from(byHour.entries())
    .sort(([a], [b]) => a - b)
    .map(([hour, count]) => ({
      hour,
      count,
      label: `${hour.toString().padStart(2, "0")}:00`,
    }))
}

export type OrderStatusCount = { status: string; count: number }

export async function getOrderStatusDistribution() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return []
  }

  return unstable_cache(
    async () => {
      const result = await prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      })
      return result.map((r) => ({ status: r.status, count: r._count.id }))
    },
    ["admin-order-status"],
    { revalidate: ADMIN_METRICS_REVALIDATE }
  )()
}

export async function getRecentOrders(limit = 10) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return []
  }

  const orders = await prisma.order.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  })

  return orders.map((o) => ({
    id: o.id,
    total: Number(o.total),
    status: o.status,
    createdAt: o.createdAt,
    customerName: o.user.name ?? o.user.email ?? "—",
  }))
}

export async function getLowStockProducts(limit = 5) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return []
  }

  return prisma.product.findMany({
    where: { stock: { lt: LOW_STOCK_THRESHOLD } },
    orderBy: { stock: "asc" },
    take: limit,
    select: { id: true, name: true, stock: true, slug: true },
  })
}

export async function getTopProducts(limit = 5) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return []
  }

  const items = await prisma.orderItem.findMany({
    select: { productId: true, priceAtPurchase: true, quantity: true },
  })

  const byProduct = new Map<string, number>()
  for (const i of items) {
    const rev = Number(i.priceAtPurchase) * i.quantity
    byProduct.set(i.productId, (byProduct.get(i.productId) ?? 0) + rev)
  }

  const sorted = Array.from(byProduct.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  const productIds = sorted.map(([id]) => id)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, slug: true, stock: true },
  })

  const byId = new Map(products.map((p) => [p.id, p]))
  return productIds
    .map((id) => {
      const p = byId.get(id)
      if (!p) return null
      return {
        ...p,
        revenue: byProduct.get(id) ?? 0,
      }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
}

export type TopProduct = Awaited<ReturnType<typeof getTopProducts>>[number]

// --- Customer Insights ---

export type NewVsReturning = { newCustomers: number; returningCustomers: number }

export async function getNewVsReturningCustomers(): Promise<NewVsReturning | null> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null
  }

  const ordersByUser = await prisma.order.groupBy({
    by: ["userId"],
    where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
    _count: { id: true },
  })

  let newCustomers = 0
  let returningCustomers = 0
  for (const row of ordersByUser) {
    if (row._count.id === 1) newCustomers++
    else if (row._count.id >= 2) returningCustomers++
  }
  return { newCustomers, returningCustomers }
}

export type AcquisitionDataPoint = { date: string; newCustomers: number }

export async function getCustomerAcquisitionData(
  days: number = 90
): Promise<AcquisitionDataPoint[]> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return []
  }

  const start = subDays(new Date(), days)
  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      createdAt: { gte: start },
    },
    select: { userId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const firstOrderByUser = new Map<string, string>()
  for (const o of orders) {
    const key = o.userId
    const dateKey = o.createdAt.toISOString().slice(0, 10)
    if (!firstOrderByUser.has(key)) firstOrderByUser.set(key, dateKey)
  }

  const byDate = new Map<string, number>()
  const end = new Date()
  for (let i = 0; i <= days; i++) {
    const d = subDays(end, days - i)
    byDate.set(d.toISOString().slice(0, 10), 0)
  }
  for (const dateKey of firstOrderByUser.values()) {
    if (byDate.has(dateKey)) {
      byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + 1)
    }
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, newCustomers]) => ({ date, newCustomers }))
}

export type TopCustomer = {
  userId: string
  name: string | null
  email: string | null
  revenue: number
  orderCount: number
}

export async function getTopCustomersByRevenue(
  limit: number = 10
): Promise<TopCustomer[]> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return []
  }

  const orders = await prisma.order.findMany({
    where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
    select: { userId: true, total: true },
  })

  const byUser = new Map<string, { revenue: number; orderCount: number }>()
  for (const o of orders) {
    const rev = Number(o.total)
    const cur = byUser.get(o.userId) ?? { revenue: 0, orderCount: 0 }
    cur.revenue += rev
    cur.orderCount += 1
    byUser.set(o.userId, cur)
  }

  const sorted = Array.from(byUser.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, limit)

  const userIds = sorted.map(([id]) => id)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, role: "USER" },
    select: { id: true, name: true, email: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  return sorted
    .map(([userId, { revenue, orderCount }]) => {
      const u = userMap.get(userId)
      if (!u) return null
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        revenue,
        orderCount,
      }
    })
    .filter((r): r is TopCustomer => r !== null)
}
