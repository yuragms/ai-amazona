import Link from "next/link"
import {
  getOrderDetails,
  getOrderDetailsByStripeSessionId,
} from "@/app/actions/order"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

type Props = {
  searchParams: Promise<{ session_id?: string; order_id?: string }>
}

function formatAddressLine2(
  city: string,
  state: string | null,
  postalCode: string
): string {
  const parts = [city]
  if (state) parts.push(state)
  parts.push(postalCode)
  return parts.join(", ")
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id, order_id } = await searchParams
  let order = null
  if (order_id) {
    order = await getOrderDetails(order_id)
  } else if (session_id) {
    order = await getOrderDetailsByStripeSessionId(session_id)
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <Card className="overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          {/* Header: Order Confirmed! + Order # */}
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle className="size-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                Order Confirmed!
              </h1>
              {order && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Order #{order.id}
                </p>
              )}
            </div>
          </div>

          {order ? (
            <div className="mt-8 space-y-8">
              {/* Order Summary */}
              <section>
                <h2 className="text-base font-bold text-foreground">
                  Order Summary
                </h2>
                <div className="mt-3 space-y-3">
                  {order.orderItems.length > 0 ? (
                    order.orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {item.productName}
                          </p>
                          <p className="text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="shrink-0 font-medium text-foreground">
                          $
                          {(
                            item.priceAtPurchase * item.quantity
                          ).toFixed(2)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Order details are updating…
                    </p>
                  )}
                </div>
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>${order.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <section>
                  <h2 className="text-base font-bold text-foreground">
                    Shipping Address
                  </h2>
                  <address className="mt-3 text-sm not-italic text-muted-foreground">
                    <p>{order.shippingAddress.street}</p>
                    <p>
                      {formatAddressLine2(
                        order.shippingAddress.city,
                        order.shippingAddress.state,
                        order.shippingAddress.postalCode
                      )}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </address>
                </section>
              )}
            </div>
          ) : (
            <div className="mt-6">
              {session_id ? (
                <p className="text-sm text-muted-foreground">
                  Order details are updating. Refresh the page in a few seconds.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Order not found. Please check the link or contact support.
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/products">Continue shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
