"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { StripePaymentForm } from "@/components/checkout/stripe-payment-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type OrderSummaryState = {
  subtotal: number
  shipping: number
  tax: number
  total: number
}

const DEFAULT_SUMMARY: OrderSummaryState = {
  subtotal: 0,
  shipping: 10,
  tax: 0,
  total: 10,
}

export function PaymentPageClient({
  orderId,
  storageKey,
  summaryStorageKey,
  fallbackTotal,
}: {
  orderId: string
  storageKey: string
  summaryStorageKey: string
  fallbackTotal: number
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [summary, setSummary] = useState<OrderSummaryState>(DEFAULT_SUMMARY)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return
    const secret = sessionStorage.getItem(storageKey)
    setClientSecret(secret)

    try {
      const raw = sessionStorage.getItem(summaryStorageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as OrderSummaryState
        if (
          typeof parsed.subtotal === "number" &&
          typeof parsed.shipping === "number" &&
          typeof parsed.tax === "number" &&
          typeof parsed.total === "number"
        ) {
          setSummary(parsed)
          return
        }
      }
    } catch {
      // ignore
    }
    const shipping = 10
    const subtotal = Math.max(0, (fallbackTotal - 11) / 1.1)
    const tax = Math.round((subtotal + shipping) * 0.1 * 100) / 100
    setSummary({
      subtotal: Math.round(subtotal * 100) / 100,
      shipping,
      tax,
      total: fallbackTotal,
    })
  }, [mounted, storageKey, summaryStorageKey, fallbackTotal])

  if (!mounted) {
    return (
      <div className="py-12 text-center text-muted-foreground">Loading…</div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="space-y-4 md:col-span-2">
        <Card className="rounded-lg border border-border bg-zinc-100 shadow-sm dark:bg-zinc-900">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Payment session expired or invalid. Please return to checkout and
              click &quot;Continue to Payment&quot; again.
            </p>
            <Button asChild className="mt-4">
              <Link href="/checkout">Return to checkout</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {/* Left: Payment Information */}
      <Card className="rounded-lg border border-border bg-zinc-100 shadow-sm dark:bg-zinc-900">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-foreground">
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <StripePaymentForm
            clientSecret={clientSecret}
            orderId={orderId}
            onError={setError}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Right: Order Summary */}
      <Card className="h-fit rounded-lg border border-border bg-zinc-100 shadow-sm dark:bg-zinc-900">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-foreground">
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${summary.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>${summary.shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>${summary.tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>${summary.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
