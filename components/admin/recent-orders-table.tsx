"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from "lucide-react"
export type RecentOrderRow = {
  id: string
  total: number
  status: string
  createdAt: Date | string
  customerName: string
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
] as const

type SortKey = keyof RecentOrderRow
type SortOrder = "asc" | "desc"

function compare(
  a: RecentOrderRow,
  b: RecentOrderRow,
  key: SortKey,
  order: SortOrder
): number {
  const mult = order === "asc" ? 1 : -1
  let aVal: string | number | Date = a[key]
  let bVal: string | number | Date = b[key]
  if (key === "createdAt") {
    aVal = new Date(aVal as string).getTime()
    bVal = new Date(bVal as string).getTime()
  }
  if (typeof aVal === "string" && typeof bVal === "string") {
    return mult * aVal.localeCompare(bVal, undefined, { numeric: true })
  }
  if (typeof aVal === "number" && typeof bVal === "number") {
    return mult * (aVal - bVal)
  }
  return 0
}

interface RecentOrdersTableProps {
  orders: RecentOrderRow[]
  statusLabels: Record<string, string>
}

export function RecentOrdersTable({ orders, statusLabels }: RecentOrdersTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const filtered = useMemo(() => {
    if (statusFilter === "all") return orders
    return orders.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => compare(a, b, sortKey, sortOrder))
  }, [filtered, sortKey, sortOrder])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder(key === "createdAt" ? "desc" : "asc")
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) {
      return <ArrowUpDownIcon className="ml-1 size-3.5 opacity-50" />
    }
    return sortOrder === "asc" ? (
      <ArrowUpIcon className="ml-1 size-3.5" />
    ) : (
      <ArrowDownIcon className="ml-1 size-3.5" />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[140px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-sm">
          {sorted.length} of {orders.length} orders
        </span>
      </div>
      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {orders.length === 0 ? "No orders yet." : "No orders match the selected filter."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8 font-medium"
                  onClick={() => handleSort("id")}
                >
                  Order ID
                  <SortIcon column="id" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8 font-medium"
                  onClick={() => handleSort("customerName")}
                >
                  Customer
                  <SortIcon column="customerName" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8 font-medium"
                  onClick={() => handleSort("total")}
                >
                  Total
                  <SortIcon column="total" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8 font-medium"
                  onClick={() => handleSort("status")}
                >
                  Status
                  <SortIcon column="status" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8 font-medium"
                  onClick={() => handleSort("createdAt")}
                >
                  Date
                  <SortIcon column="createdAt" />
                </Button>
              </TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {o.id.slice(0, 8)}…
                </TableCell>
                <TableCell>{o.customerName}</TableCell>
                <TableCell>${o.total.toFixed(2)}</TableCell>
                <TableCell>{statusLabels[o.status] ?? o.status}</TableCell>
                <TableCell>
                  {new Date(o.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
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
    </div>
  )
}
