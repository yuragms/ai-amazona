"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ORDER_STATUSES } from "@/lib/order-constants"
import type { AdminOrderFilters } from "@/app/actions/admin-orders"

const STATUS_LABELS: Record<string, string> = {
  ALL: "All statuses",
  PENDING: "Pending",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
}

export function OrdersFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const status = searchParams.get("status") ?? "ALL"
  const dateFrom = searchParams.get("dateFrom") ?? ""
  const dateTo = searchParams.get("dateTo") ?? ""

  function apply(filters: AdminOrderFilters) {
    const p = new URLSearchParams()
    if (filters.status && filters.status !== "ALL") p.set("status", filters.status)
    if (filters.dateFrom) p.set("dateFrom", filters.dateFrom)
    if (filters.dateTo) p.set("dateTo", filters.dateTo)
    router.push(`/admin/orders?${p.toString()}`)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const dateFromVal = (form.elements.namedItem("dateFrom") as HTMLInputElement)?.value ?? ""
    const dateToVal = (form.elements.namedItem("dateTo") as HTMLInputElement)?.value ?? ""
    apply({
      status: status === "ALL" ? undefined : status,
      dateFrom: dateFromVal || undefined,
      dateTo: dateToVal || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <Label htmlFor="filter-status">Status</Label>
        <Select
          value={status}
          onValueChange={(v) =>
            apply({
              status: v === "ALL" ? "ALL" : v,
              dateFrom: dateFrom || undefined,
              dateTo: dateTo || undefined,
            })
          }
        >
          <SelectTrigger id="filter-status" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{STATUS_LABELS.ALL}</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dateFrom">From</Label>
        <Input
          id="dateFrom"
          name="dateFrom"
          type="date"
          defaultValue={dateFrom}
          className="w-[140px]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dateTo">To</Label>
        <Input
          id="dateTo"
          name="dateTo"
          type="date"
          defaultValue={dateTo}
          className="w-[140px]"
        />
      </div>
      <Button type="submit" variant="secondary" size="sm">
        Apply
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => router.push("/admin/orders")}
      >
        Clear
      </Button>
    </form>
  )
}
