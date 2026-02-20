"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { getAdminLiveMetrics } from "@/app/actions/dashboard"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Package, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

const POLL_INTERVAL_MS = 30_000

export function AdminNotificationBell() {
  const [metrics, setMetrics] = useState<{
    orderCount: number
    lowStockCount: number
  } | null>(null)
  const [lastSeenOrderCount, setLastSeenOrderCount] = useState(0)
  const [lastSeenLowStockCount, setLastSeenLowStockCount] = useState(0)
  const [open, setOpen] = useState(false)

  const fetchMetrics = useCallback(async () => {
    const data = await getAdminLiveMetrics()
    if (!data) return
    setMetrics((prev) => {
      if (prev) {
        if (data.orderCount > prev.orderCount) {
          toast.info("New order received", { description: "View in Orders." })
        }
        if (data.lowStockCount > prev.lowStockCount) {
          toast.warning("Low stock alert", {
            description: "More products are low on stock.",
          })
        }
      }
      return data
    })
  }, [])

  useEffect(() => {
    fetchMetrics()
    const id = setInterval(fetchMetrics, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchMetrics])

  const newOrders = metrics
    ? Math.max(0, metrics.orderCount - lastSeenOrderCount)
    : 0
  const newLowStock = metrics
    ? Math.max(0, metrics.lowStockCount - lastSeenLowStockCount)
    : 0
  const badgeCount = newOrders + newLowStock

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next && metrics) {
      setLastSeenOrderCount(metrics.orderCount)
      setLastSeenLowStockCount(metrics.lowStockCount)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {badgeCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="p-2 text-sm font-medium text-muted-foreground">
          Notifications
        </div>
        <Link
          href="/admin/orders"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
        >
          <ShoppingCart className="size-4 shrink-0 text-muted-foreground" />
          <span>
            {metrics ? `${metrics.orderCount} orders` : "—"} total
            {newOrders > 0 && (
              <span className="ml-1 text-primary">({newOrders} new)</span>
            )}
          </span>
        </Link>
        <Link
          href="/admin"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
        >
          <Package className="size-4 shrink-0 text-muted-foreground" />
          <span>
            {metrics ? `${metrics.lowStockCount} low stock` : "—"} items
            {newLowStock > 0 && (
              <span className="ml-1 text-amber-600 dark:text-amber-500">
                ({newLowStock} new)
              </span>
            )}
          </span>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
