import { Suspense } from "react"
import { getAdminOrders, getAdminOrderDetail } from "@/app/actions/admin-orders"
import type { AdminOrderFilters } from "@/app/actions/admin-orders"
import { OrdersFilters } from "@/components/admin/orders-filters"
import { OrdersTable } from "@/components/admin/orders-table"
import { Card, CardContent } from "@/components/ui/card"

type PageProps = {
  searchParams: Promise<{ status?: string; dateFrom?: string; dateTo?: string; order?: string }>
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const filters: AdminOrderFilters = {
    status: params.status === "ALL" || !params.status ? undefined : (params.status as AdminOrderFilters["status"]),
    dateFrom: params.dateFrom ?? undefined,
    dateTo: params.dateTo ?? undefined,
  }

  const [orders, orderDetail] = await Promise.all([
    getAdminOrders(filters),
    params.order ? getAdminOrderDetail(params.order) : Promise.resolve(null),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
        <p className="text-muted-foreground">
          Process orders, update status, and handle refunds.
        </p>
      </div>

      <Suspense fallback={<Card><CardContent className="py-4">Loading filters…</CardContent></Card>}>
        <OrdersFilters />
      </Suspense>

      <OrdersTable
        orders={orders}
        filters={filters}
        orderDetail={orderDetail}
        detailId={params.order ?? null}
      />
    </div>
  )
}
