import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CheckoutPage() {
  return (
    <div className="container max-w-2xl px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Checkout</h1>
      <p className="mt-4 text-muted-foreground">
        Checkout and payment integration (Stripe) will be implemented in a later
        step.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/cart">Back to Cart</Link>
      </Button>
    </div>
  )
}
