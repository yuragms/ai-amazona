"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { addToCart } from "@/app/actions/cart"
import { useGuestCartStore } from "@/lib/store/guest-cart"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ProductInfoActionsClientProps = {
  productId: string
  stock: number
  isAuthenticated: boolean
}

export function ProductInfoActionsClient({
  productId,
  stock,
  isAuthenticated,
}: ProductInfoActionsClientProps) {
  const [quantity, setQuantity] = useState(1)
  const [status, setStatus] = useState<"idle" | "loading">("idle")
  const router = useRouter()
  const addGuestItem = useGuestCartStore((s) => s.addItem)

  const maxQty = Math.max(1, stock)
  const options = Array.from({ length: maxQty }, (_, i) => i + 1)

  function showAddedToast() {
    toast.success("Added to cart", {
      action: {
        label: "View cart",
        onClick: () => router.push("/cart"),
      },
    })
  }

  async function handleAddToCart() {
    setStatus("loading")
    if (isAuthenticated) {
      const result = await addToCart(productId, quantity)
      if (result.ok) {
        showAddedToast()
      } else {
        toast.error(result.error)
      }
    } else {
      addGuestItem(productId, quantity)
      showAddedToast()
    }
    setStatus("idle")
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="quantity" className="text-sm font-medium text-foreground">
          Quantity
        </Label>
        <Select
          value={String(quantity)}
          onValueChange={(v) => setQuantity(Number(v))}
          disabled={stock <= 0}
        >
          <SelectTrigger
            id="quantity"
            className="w-full max-w-[6rem] min-w-[4.5rem] rounded-md border border-gray-200 bg-white text-base dark:border-gray-700 dark:bg-gray-950"
          >
            <SelectValue placeholder="Qty" />
          </SelectTrigger>
          <SelectContent>
            {options.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p
        className={
          stock > 0
            ? "text-sm font-normal text-green-600 dark:text-green-500"
            : "text-sm font-normal text-destructive"
        }
      >
        {stock > 0 ? "In stock" : "Out of stock"}
      </p>
      <div className="pt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button
          onClick={handleAddToCart}
          disabled={status === "loading" || stock <= 0}
          className="w-full rounded-md bg-black px-6 py-2.5 text-sm font-normal text-white hover:bg-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
        >
          {status === "loading" ? "Adding…" : "Add to Cart"}
        </Button>
      </div>
    </div>
  )
}
