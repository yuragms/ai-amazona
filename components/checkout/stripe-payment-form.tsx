"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { Button } from "@/components/ui/button"

function PaymentFormFields({
  orderId,
  onSuccess,
  onError,
}: {
  orderId: string
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [placing, setPlacing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPlacing(true)
    onError("")
    try {
      const returnUrl = `${window.location.origin}/checkout/success?order_id=${orderId}`
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
      })
      if (error) {
        onError(error.message ?? "Payment failed")
        setPlacing(false)
        return
      }
      onSuccess()
    } catch {
      onError("Network error")
      setPlacing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border border-input bg-background shadow-xs">
        <PaymentElement />
      </div>
      <Button
        type="submit"
        disabled={!stripe || placing}
        className="w-full rounded-md bg-zinc-800 text-white hover:bg-zinc-900"
      >
        {placing ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Processing…
          </>
        ) : (
          "Pay Now"
        )}
      </Button>
    </form>
  )
}

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null

export function StripePaymentForm({
  clientSecret,
  orderId,
  onError,
}: {
  clientSecret: string
  orderId: string
  onError?: (msg: string) => void
}) {
  if (!stripePromise) {
    return (
      <p className="text-sm text-destructive">
        Stripe is not configured (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing).
      </p>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: { borderRadius: "6px" },
        },
      }}
    >
      <PaymentFormFields
        orderId={orderId}
        onSuccess={() => {}}
        onError={onError ?? (() => {})}
      />
    </Elements>
  )
}
