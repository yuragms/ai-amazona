import Link from "next/link"
import { auth } from "@/auth"
import { getCartItems } from "@/app/actions/cart"
import { CartItemRow } from "@/components/cart/cart-item-row"
import { EmptyCartState } from "@/components/cart/empty-cart-state"
import { GuestCartContent } from "@/components/cart/guest-cart-content"
import { Button } from "@/components/ui/button"

export default async function CartPage() {
  const session = await auth()
  const items = await getCartItems()

  if (!session?.user) {
    return <GuestCartContent />
  }

  const safeItems = items ?? []

  if (safeItems.length === 0) {
    return <EmptyCartState />
  }

  const total = safeItems.reduce(
    (sum, it) => sum + Number(it.product.price) * it.quantity,
    0
  )

  return (
    <div className="w-full px-4 py-8 sm:px-6">
      <div className="w-full rounded-lg border border-border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-foreground">Shopping Cart</h1>
        <div className="mt-6 divide-y divide-border">
          {safeItems.map((item) => (
            <CartItemRow key={item.id} item={item} />
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
