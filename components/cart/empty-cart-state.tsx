import Link from "next/link"
import { Button } from "@/components/ui/button"

export function EmptyCartState() {
  return (
    <div className="w-full px-4 py-8 sm:px-6">
      <div className="w-full rounded-lg border border-border bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-2xl font-bold text-foreground">
          Your cart is empty
        </h1>
        <p className="mt-2 text-muted-foreground">
          Add some products to your cart to see them here.
        </p>
        <Button
          asChild
          className="mt-8 bg-black text-white hover:bg-black/90"
        >
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  )
}
