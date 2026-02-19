import Link from "next/link"
import {
  getDashboardMetrics,
  getRevenueChartData,
  getOrderStatusDistribution,
  getRecentOrders,
  getLowStockProducts,
  getTopProducts,
  getNewVsReturningCustomers,
  getCustomerAcquisitionData,
  getTopCustomersByRevenue,
} from "@/app/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { RevenueChart } from "@/components/admin/revenue-chart"
import { OrderStatusChart } from "@/components/admin/order-status-chart"
import { CustomerAcquisitionChart } from "@/components/admin/customer-acquisition-chart"
import { DashboardLive } from "@/components/admin/dashboard-live"
import { ExportReports } from "@/components/admin/export-reports"
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  Package,
  UserPlus,
  UserCheck,
} from "lucide-react"

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
}

export default async function AdminPage() {
  const [
    metrics,
    revenueData,
    orderStatusData,
    recentOrders,
    lowStockProducts,
    topProducts,
    newVsReturning,
    acquisitionData,
    topCustomers,
  ] = await Promise.all([
    getDashboardMetrics(),
    getRevenueChartData("90d"),
    getOrderStatusDistribution(),
    getRecentOrders(10),
    getLowStockProducts(10),
    getTopProducts(5),
    getNewVsReturningCustomers(),
    getCustomerAcquisitionData(90),
    getTopCustomersByRevenue(10),
  ])

  if (!metrics) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    )
  }

  return (
    <DashboardLive
      initialOrderCount={metrics.totalOrders}
      initialLowStockCount={metrics.lowStockCount}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground">
            Key metrics and analytics for your store.
          </p>
        </div>

        {/* Key Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.averageOrderValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={revenueData} />
        <OrderStatusChart data={orderStatusData} />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Recent Orders</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/orders">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No orders yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {o.id.slice(0, 8)}…
                    </TableCell>
                    <TableCell>{o.customerName}</TableCell>
                    <TableCell>${o.total.toFixed(2)}</TableCell>
                    <TableCell>{statusLabels[o.status] ?? o.status}</TableCell>
                    <TableCell>
                      {new Date(o.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/orders?order=${o.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

        {/* Customer Insights */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Customer Insights</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  New Customers
                </CardTitle>
                <UserPlus className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {newVsReturning?.newCustomers ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  One order only
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Returning Customers
                </CardTitle>
                <UserCheck className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {newVsReturning?.returningCustomers ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  2+ orders
                </p>
              </CardContent>
            </Card>
          </div>
          <CustomerAcquisitionChart data={acquisitionData} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Customers by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {topCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No customer data yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.map((c) => (
                      <TableRow key={c.userId}>
                        <TableCell>
                          {c.name ?? c.email ?? "—"}
                        </TableCell>
                        <TableCell>{c.orderCount}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${c.revenue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Export and Reports */}
        <ExportReports />

        {/* Low Stock & Top Products */}
        <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
            {metrics.lowStockCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                {metrics.lowStockCount} items
              </span>
            )}
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All products are well stocked.
              </p>
            ) : (
              <ul className="space-y-2">
                {lowStockProducts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border p-2 text-sm"
                  >
                    <Link
                      href={`/products/${p.slug}`}
                      className="font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                    <span
                      className={
                        p.stock < 5
                          ? "font-medium text-destructive"
                          : "text-muted-foreground"
                      }
                    >
                      {p.stock} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sales data yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {topProducts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border p-2 text-sm"
                  >
                    <Link
                      href={`/products/${p.slug}`}
                      className="font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                    <span className="text-muted-foreground">
                      ${p.revenue.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLive>
  )
}
