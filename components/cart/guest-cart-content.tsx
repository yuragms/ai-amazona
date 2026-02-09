"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getProductsByIds } from "@/app/actions/cart"
import type { ProductForCart } from "@/app/actions/cart"
import { useGuestCartStore } from "@/lib/store/guest-cart"
import { EmptyCartState } from "@/components/cart/empty-cart-state"
import { GuestCartItemRow } from "@/components/cart/guest-cart-item-row"
import { Button } from "@/components/ui/button"

export function GuestCartContent() {
  const items = useGuestCartStore((s) => s.items)
  const [products, setProducts] = useState<ProductForCart[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (items.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }
    getProductsByIds(items.map((i) => i.productId))
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [items])

  if (items.length === 0 && !loading) {
    return <EmptyCartState />
  }

  if (loading) {
    return (
      <div className="w-full px-4 py-8 sm:px-6">
        <div className="w-full rounded-lg border border-border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">Shopping Cart</h1>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const productMap = new Map(products.map((p) => [p.id, p]))
  const validItems = items.filter((i) => productMap.has(i.productId))
  const total = validItems.reduce(
    (sum, it) => sum + Number(productMap.get(it.productId)!.price) * it.quantity,
    0
  )

  return (
    <div className="w-full px-4 py-8 sm:px-6">
      <div className="w-full rounded-lg border border-border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-foreground">Shopping Cart</h1>
        <div className="mt-6 divide-y divide-border">
          {validItems.map((item) => (
            <GuestCartItemRow
              key={item.productId}
              productId={item.productId}
              quantity={item.quantity}
              product={productMap.get(item.productId)!}
            />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <p className="text-lg font-bold text-foreground">
            Total: ${total.toFixed(2)}
          </p>
          <div className="flex gap-3">
            <Button
              asChild
              variant="outline"
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <Link href="/products">Continue Shopping</Link>
            </Button>
            <Button asChild className="bg-black text-white hover:bg-black/90">
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
