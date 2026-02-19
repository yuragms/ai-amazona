"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  updateOrderStatus,
  type AdminOrderListItem,
  type AdminOrderDetail,
  type AdminOrderFilters,
} from "@/app/actions/admin-orders"
import { ORDER_STATUSES } from "@/lib/order-constants"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import type { OrderStatus } from "@prisma/client"

function orderListParams(filters: AdminOrderFilters, orderId?: string): string {
  const p = new URLSearchParams()
  if (filters.status && filters.status !== "ALL") p.set("status", filters.status)
  if (filters.dateFrom) p.set("dateFrom", filters.dateFrom)
  if (filters.dateTo) p.set("dateTo", filters.dateTo)
  if (orderId) p.set("order", orderId)
  return p.toString()
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
}

type OrdersTableProps = {
  orders: AdminOrderListItem[]
  filters: AdminOrderFilters
  orderDetail: AdminOrderDetail | null
  detailId: string | null
}

export function OrdersTable({
  orders: initialOrders,
  filters,
  orderDetail,
  detailId,
}: OrdersTableProps) {
  const router = useRouter()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId)
    try {
      const result = await updateOrderStatus(orderId, status)
      if (result.ok) {
        toast.success("Status updated")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to update")
      }
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {initialOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No orders match the filters.
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
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {o.id.slice(0, 8)}…
                    </TableCell>
                    <TableCell>{o.customerName}</TableCell>
                    <TableCell>${o.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Select
                        value={o.status}
                        onValueChange={(v) =>
                          handleStatusChange(o.id, v as OrderStatus)
                        }
                        disabled={updatingId === o.id}
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABELS[s] ?? s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(o.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/orders?${orderListParams(filters, o.id)}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {orderDetail && detailId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Order {orderDetail.id.slice(0, 8)}…</CardTitle>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/admin/orders?${orderListParams(filters)}`}>
                <X className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <span className="text-muted-foreground">Customer:</span>{" "}
                {orderDetail.customerName}
                {orderDetail.customerEmail && (
                  <> ({orderDetail.customerEmail})</>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                {STATUS_LABELS[orderDetail.status] ?? orderDetail.status}
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>{" "}
                {new Date(orderDetail.createdAt).toLocaleString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span> $
                {orderDetail.total.toFixed(2)}
              </div>
            </div>
            {orderDetail.shippingAddress && (
              <div className="text-sm">
                <div className="font-medium text-muted-foreground mb-1">
                  Shipping address
                </div>
                <p>
                  {orderDetail.shippingAddress.street},{" "}
                  {orderDetail.shippingAddress.city},{" "}
                  {orderDetail.shippingAddress.state && `${orderDetail.shippingAddress.state}, `}
                  {orderDetail.shippingAddress.postalCode},{" "}
                  {orderDetail.shippingAddress.country}
                </p>
              </div>
            )}
            <div>
              <div className="font-medium text-muted-foreground mb-2">
                Items
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderDetail.orderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="hover:underline"
                        >
                          {item.productName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        ${item.priceAtPurchase.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        $
                        {(item.quantity * item.priceAtPurchase).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end">
              <Select
                value={orderDetail.status}
                onValueChange={(v) =>
                  handleStatusChange(orderDetail.id, v as OrderStatus)
                }
                disabled={updatingId === orderDetail.id}
              >
                <SelectTrigger className="w-[140px]">
                  {updatingId === orderDetail.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <SelectValue />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s] ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

