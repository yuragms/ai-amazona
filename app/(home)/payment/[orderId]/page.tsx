import Link from "next/link"
import { getOrderById } from "@/app/actions/order"
import { PaymentPageClient } from "@/components/checkout/payment-page-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const PAYMENT_STORAGE_PREFIX = "payment_"
const PAYMENT_SUMMARY_PREFIX = "payment_summary_"

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params

  if (!orderId?.trim()) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Invalid link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Order ID is missing. Please start from checkout.
            </p>
            <Button asChild>
              <Link href="/checkout">Go to checkout</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const order = await getOrderById(orderId)
  const orderTotal = order?.total ?? 0

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">
        Payment
      </h1>
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_340px]">
        <PaymentPageClient
          orderId={orderId}
          storageKey={`${PAYMENT_STORAGE_PREFIX}${orderId}`}
          summaryStorageKey={`${PAYMENT_SUMMARY_PREFIX}${orderId}`}
          fallbackTotal={orderTotal}
        />
      </div>
      <div className="mt-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/checkout">Back to checkout</Link>
        </Button>
      </div>
    </div>
  )
}
