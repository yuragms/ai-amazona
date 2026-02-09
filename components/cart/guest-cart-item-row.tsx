"use client"

import Image from "next/image"
import Link from "next/link"
import { Trash2 } from "lucide-react"
import { useGuestCartStore } from "@/lib/store/guest-cart"
import type { ProductForCart } from "@/app/actions/cart"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type GuestCartItemRowProps = {
  productId: string
  quantity: number
  product: ProductForCart
}

export function GuestCartItemRow({
  productId,
  quantity,
  product,
}: GuestCartItemRowProps) {
  const updateQuantity = useGuestCartStore((s) => s.updateQuantity)
  const removeItem = useGuestCartStore((s) => s.removeItem)

  const price = Number(product.price)
  const lineTotal = price * quantity
  const maxQty = Math.max(1, product.stock)
  const options = Array.from({ length: maxQty }, (_, i) => i + 1)

  const imageSrc = product.images[0]

  return (
    <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:gap-6">
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-square w-full shrink-0 overflow-hidden rounded-md bg-muted sm:w-24"
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No image
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${product.slug}`}
          className="font-bold text-foreground hover:underline"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          ${price.toFixed(2)}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Select
          value={String(quantity)}
          onValueChange={(v) => updateQuantity(productId, Number(v))}
        >
          <SelectTrigger className="w-20" aria-label="Quantity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="w-20 text-right font-medium sm:w-24">
          ${lineTotal.toFixed(2)}
        </span>
        <Button
          type="button"
          size="icon"
          onClick={() => removeItem(productId)}
          aria-label="Remove from cart"
          className="h-9 w-9 shrink-0 rounded bg-red-500 text-white hover:bg-red-600"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
