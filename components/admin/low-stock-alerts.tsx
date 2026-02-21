"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateProductStock } from "@/app/actions/admin-products"

export type LowStockProduct = {
  id: string
  name: string
  stock: number
  slug: string
}

interface LowStockAlertsProps {
  products: LowStockProduct[]
}

export function LowStockAlerts({ products }: LowStockAlertsProps) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [stockInputs, setStockInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(products.map((p) => [p.id, String(p.stock)]))
  )

  async function handleRestock(productId: string) {
    const raw = stockInputs[productId] ?? ""
    const value = parseInt(raw, 10)
    if (Number.isNaN(value) || value < 0) {
      toast.error("Enter a valid non-negative number")
      return
    }
    setPendingId(productId)
    const result = await updateProductStock(productId, value)
    setPendingId(null)
    if (result.ok) {
      toast.success("Stock updated")
      setStockInputs((prev) => ({ ...prev, [productId]: String(value) }))
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        All products are well stocked.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {products.map((p) => (
        <li
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 text-sm"
        >
          <Link
            href={`/products/${p.slug}`}
            className="font-medium hover:underline"
          >
            {p.name}
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={
                p.stock < 5
                  ? "font-medium text-destructive"
                  : "text-muted-foreground"
              }
            >
              {p.stock} left
            </span>
            <Input
              type="number"
              min={0}
              step={1}
              className="h-8 w-16 text-right"
              value={stockInputs[p.id] ?? p.stock}
              onChange={(e) =>
                setStockInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
              }
              aria-label={`New stock for ${p.name}`}
            />
            <Button
              variant="secondary"
              size="sm"
              className="h-8"
              onClick={() => handleRestock(p.id)}
              disabled={pendingId === p.id}
            >
              {pendingId === p.id ? "…" : "Set"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
