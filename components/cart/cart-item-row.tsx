"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trash2 } from "lucide-react"
import { updateCartItemQuantity, removeFromCart } from "@/app/actions/cart"
import type { CartItemSerialized } from "@/app/actions/cart"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CartItemRowProps = {
  item: CartItemSerialized
}

export function CartItemRow({ item }: CartItemRowProps) {
  const [quantity, setQuantity] = useState(item.quantity)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  const price = item.product.price
  const lineTotal = price * quantity
  const maxQty = Math.max(1, item.product.stock)
  const options = Array.from({ length: maxQty }, (_, i) => i + 1)

  async function handleQuantityChange(value: string) {
    const newQty = Number(value)
    setQuantity(newQty)
    setError("")
    setPending(true)
    const result = await updateCartItemQuantity(item.id, newQty)
    setPending(false)
    if (!result.ok) setError(result.error)
  }

  async function handleRemove() {
    setError("")
    setPending(true)
    const result = await removeFromCart(item.id)
    setPending(false)
    if (!result.ok) setError(result.error)
  }

  const imageSrc = item.product.images[0]

  return (
    <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:gap-6">
      <Link
        href={`/products/${item.product.slug}`}
        className="relative aspect-square w-full shrink-0 overflow-hidden rounded-md bg-muted sm:w-24"
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={item.product.name}
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
          href={`/products/${item.product.slug}`}
          className="font-bold text-foreground hover:underline"
        >
          {item.product.name}
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          ${price.toFixed(2)}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Select
          value={String(quantity)}
          onValueChange={handleQuantityChange}
          disabled={pending}
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
          onClick={handleRemove}
          disabled={pending}
          aria-label="Remove from cart"
          className="h-9 w-9 shrink-0 rounded bg-red-500 text-white hover:bg-red-600"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive sm:col-span-full">{error}</p>
      )}
    </div>
  )
}
