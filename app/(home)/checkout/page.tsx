import { auth } from "@/auth"
import { getCartItems } from "@/app/actions/cart"
import { getAddresses } from "@/app/actions/address"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { CheckoutGuestContent } from "@/components/checkout/checkout-guest-content"
import { redirect } from "next/navigation"

export default async function CheckoutPage() {
  const session = await auth()

  if (!session?.user) {
    return <CheckoutGuestContent />
  }

  const [items, addresses] = await Promise.all([
    getCartItems(),
    getAddresses(),
  ])

  if (!items?.length) {
    redirect("/cart")
  }

  const total = items.reduce(
    (sum, it) => sum + Number(it.product.price) * it.quantity,
    0
  )

  const serializedItems = items.map((it) => ({
    id: it.id,
    quantity: it.quantity,
    product: {
      id: it.product.id,
      name: it.product.name,
      slug: it.product.slug,
      price: Number(it.product.price),
      images: it.product.images,
      stock: it.product.stock,
    },
  }))

  return (
    <CheckoutForm
      items={serializedItems}
      addresses={addresses ?? []}
      total={total}
    />
  )
}
