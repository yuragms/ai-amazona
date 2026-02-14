"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getProductsByIds } from "@/app/actions/cart"
import type { CartItemSerialized } from "@/app/actions/cart"
import { useGuestCartStore } from "@/lib/store/guest-cart"
import { CheckoutForm } from "@/components/checkout/checkout-form"

export function CheckoutGuestContent() {
  const router = useRouter()
  const guestItems = useGuestCartStore((s) => s.items)
  const [items, setItems] = useState<CartItemSerialized[] | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHydrated(true), 150)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (guestItems.length === 0) {
      router.replace("/cart")
      return
    }
    getProductsByIds(guestItems.map((i) => i.productId))
      .then((products) => {
        const productMap = new Map(products.map((p) => [p.id, p]))
        const list: CartItemSerialized[] = guestItems
          .filter((g) => productMap.has(g.productId))
          .map((g) => {
            const product = productMap.get(g.productId)!
            return {
              id: g.productId,
              quantity: g.quantity,
              product: {
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: Number(product.price),
                images: product.images,
                stock: product.stock,
              },
            }
          })
        setItems(list)
      })
      .catch(() => setItems([]))
  }, [guestItems, hydrated, router])

  if (items === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-muted-foreground">
        Загрузка…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-muted-foreground">В корзине нет доступных товаров.</p>
        <a href="/cart" className="mt-4 inline-block text-primary underline">
          Вернуться в корзину
        </a>
      </div>
    )
  }

  const total = items.reduce(
    (sum, it) => sum + it.product.price * it.quantity,
    0
  )

  return (
    <CheckoutForm
      items={items}
      addresses={[]}
      total={total}
      canPay={false}
    />
  )
}
