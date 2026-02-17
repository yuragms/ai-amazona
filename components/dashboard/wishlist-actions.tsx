"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { removeFromWishlist } from "@/app/actions/wishlist"
import { addToCart } from "@/app/actions/cart"
import { Button } from "@/components/ui/button"
import { Loader2, ShoppingCart, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

type WishlistActionsProps = {
  wishlistItemId: string
  productId: string
  productSlug: string
  disabled?: boolean
  className?: string
}

export function WishlistActions({
  wishlistItemId,
  productId,
  productSlug,
  disabled,
  className,
}: WishlistActionsProps) {
  const router = useRouter()
  const [removing, setRemoving] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  async function handleRemove() {
    setRemoving(true)
    await removeFromWishlist(wishlistItemId)
    setRemoving(false)
    router.refresh()
  }

  async function handleAddToCart() {
    setAddingToCart(true)
    await addToCart(productId, 1)
    setAddingToCart(false)
    router.refresh()
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || addingToCart}
        onClick={handleAddToCart}
      >
        {addingToCart ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <ShoppingCart className="size-4" />
            В корзину
          </>
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={removing}
        onClick={handleRemove}
      >
        {removing ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </Button>
      <Button variant="link" size="sm" className="h-auto p-0" asChild>
        <Link href={`/products/${productSlug}`}>Подробнее</Link>
      </Button>
    </div>
  )
}
