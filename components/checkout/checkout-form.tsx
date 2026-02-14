"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { createAddress } from "@/app/actions/address"
import type { AddressRecord } from "@/app/actions/address"
/** Сериализованный элемент корзины (price как number для передачи в Client Component) */
export type CartItemSerialized = {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: string[]
    stock: number
  }
}
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

const shippingSchema = z.object({
  fullName: z.string().min(1, "Укажите имя"),
  email: z.string().email("Некорректный email"),
  street: z.string().min(1, "Укажите адрес"),
  city: z.string().min(1, "Укажите город"),
  state: z.string().optional(),
  postalCode: z.string().min(1, "Укажите индекс"),
  country: z.string().min(1, "Укажите страну"),
})

type ShippingValues = z.infer<typeof shippingSchema>

type CheckoutFormProps = {
  items: CartItemSerialized[]
  addresses: AddressRecord[]
  total: number
  canPay?: boolean
}

const SHIPPING_FEE = 10
const TAX_RATE = 0.1

function OrderSummarySidebar({
  items,
  subtotal,
  shipping,
  tax,
  total,
}: {
  items: CartItemSerialized[]
  subtotal: number
  shipping: number
  tax: number
  total: number
}) {
  return (
    <Card className="h-fit rounded-lg border border-border bg-zinc-100 shadow-sm dark:bg-zinc-900">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-foreground">
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <ul className="space-y-4">
          {items.map((it) => (
            <li key={it.id} className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-background">
                {it.product.images[0] ? (
                  <Image
                    src={it.product.images[0]}
                    alt={it.product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{it.product.name}</p>
                <p className="text-sm text-muted-foreground">
                  Qty: {it.quantity}
                </p>
                <p className="text-right text-sm font-medium">
                  ${(Number(it.product.price) * it.quantity).toFixed(2)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <p className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </p>
          <p className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>${shipping.toFixed(2)}</span>
          </p>
          <p className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>${tax.toFixed(2)}</span>
          </p>
        </div>
        <p className="flex justify-between border-t border-zinc-200 pt-4 text-lg font-bold dark:border-zinc-700">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </p>
      </CardContent>
    </Card>
  )
}

function PaymentFormInner({
  orderId,
  onSuccess,
  onError,
  disabled,
}: {
  orderId: string
  onSuccess: () => void
  onError: (msg: string) => void
  disabled?: boolean
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardholderName, setCardholderName] = useState("")
  const [placing, setPlacing] = useState(false)

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPlacing(true)
    onError("")
    try {
      const returnUrl = `${window.location.origin}/checkout/success?order_id=${orderId}`
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: {
            billing_details: {
              name: cardholderName || undefined,
            },
          },
        },
      })
      if (error) {
        onError(error.message ?? "Ошибка оплаты")
        setPlacing(false)
        return
      }
      onSuccess()
    } catch {
      onError("Ошибка сети")
      setPlacing(false)
    }
  }

  return (
    <form onSubmit={handlePlaceOrder} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Card number
        </label>
        <div className="rounded-md border border-input bg-background px-3 py-2 shadow-xs">
          <PaymentElement />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Name on card
        </label>
        <Input
          placeholder="John Doe"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          className="rounded-md border border-input"
        />
      </div>
      <Button
        type="submit"
        disabled={!stripe || placing || disabled}
        className="w-full bg-black text-white hover:bg-black/90"
      >
        {placing ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Processing…
          </>
        ) : (
          "Place Order"
        )}
      </Button>
    </form>
  )
}

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null

const PAYMENT_STORAGE_PREFIX = "payment_"

export function CheckoutForm({
  items,
  addresses,
  total,
  canPay = true,
}: CheckoutFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<"shipping" | "payment">("shipping")
  const addressList = Array.isArray(addresses) ? addresses : []
  const [addressId, setAddressId] = useState<string | null>(() => {
    const defaultAddr = addressList.find((a) => a?.isDefault)
    const first = addressList[0]
    return defaultAddr?.id ?? first?.id ?? null
  })
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  const shippingForm = useForm<ShippingValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: "",
      email: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States",
    },
  })

  const subtotal = total
  const shipping = SHIPPING_FEE
  const tax = Math.round((subtotal + shipping) * TAX_RATE * 100) / 100
  const totalWithFees = subtotal + shipping + tax

  async function handleContinueToPayment(values: ShippingValues) {
    setError("")
    setPending(true)
    try {
      const result = await createAddress({
        street: values.street,
        city: values.city,
        state: values.state || undefined,
        postalCode: values.postalCode,
        country: values.country,
      })
      if (!result.ok) {
        setPending(false)
        setError(result.error ?? "Ошибка сохранения адреса")
        return
      }
      const aid = result.addressId
      if (!aid || typeof aid !== "string") {
        setPending(false)
        setError("Не удалось сохранить адрес")
        return
      }
      setAddressId(aid)

      const res = await fetch("/api/checkout/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId: aid }),
      })
      let data: { error?: string; clientSecret?: string; orderId?: string }
      try {
        data = await res.json()
      } catch {
        setError("Ошибка ответа сервера")
        setPending(false)
        return
      }
      if (!res.ok) {
        setPending(false)
        setError(data?.error ?? "Ошибка создания платежа")
        return
      }
      const secret = data?.clientSecret
      const oid = data?.orderId
      if (!secret || typeof secret !== "string" || !oid || typeof oid !== "string") {
        setPending(false)
        setError("Неверный ответ сервера: отсутствуют данные платежа")
        return
      }
      try {
        sessionStorage.setItem(`${PAYMENT_STORAGE_PREFIX}${oid}`, secret)
        sessionStorage.setItem(
          `payment_summary_${oid}`,
          JSON.stringify({
            subtotal,
            shipping,
            tax,
            total: totalWithFees,
          })
        )
      } catch {
        setPending(false)
        setError("Не удалось сохранить сессию оплаты")
        return
      }
      setPending(false)
      router.push(`/payment/${oid}`)
    } catch {
      setError("Ошибка сети")
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">Checkout</h1>

      {/* Две колонки: слева форма + карточка оплаты снизу, справа Order Summary (с md уже в две колонки) */}
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_340px]">
        {/* Левая колонка: Shipping + Payment Method карточка снизу */}
        <div className="flex flex-col gap-8">
          {/* Shipping Information */}
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">
              Shipping Information
            </h2>
            <Form {...shippingForm}>
              <form
                onSubmit={shippingForm.handleSubmit(handleContinueToPayment)}
                className="mt-4 space-y-4"
              >
                <FormField
                  control={shippingForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          className="rounded-md border border-input"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={shippingForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          className="rounded-md border border-input"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={shippingForm.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Main St"
                          className="rounded-md border border-input"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={shippingForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="New York"
                            className="rounded-md border border-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={shippingForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="NY"
                            className="rounded-md border border-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={shippingForm.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="10001"
                            className="rounded-md border border-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={shippingForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="United States"
                            className="rounded-md border border-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  type="submit"
                  disabled={pending || !canPay}
                  className="w-full bg-black text-white hover:bg-black/90"
                >
                  {pending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    "Continue to Payment"
                  )}
                </Button>
              </form>
            </Form>
          </section>

          {/* Payment Method — показывается только после Continue to Payment (заказ создан) */}
          {step === "payment" && clientSecret && orderId && stripePromise && (
            <Card className="rounded-lg border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: {
                        borderRadius: "6px",
                      },
                    },
                  }}
                >
                  <PaymentFormInner
                    orderId={orderId}
                    onSuccess={() => setError("")}
                    onError={setError}
                    disabled={!canPay}
                  />
                </Elements>
                {error && (
                  <p className="mt-2 text-sm text-destructive">{error}</p>
                )}
              </CardContent>
            </Card>
          )}

          {step === "shipping" && !canPay && (
            <p className="text-sm text-muted-foreground">
              Sign in to complete payment.
            </p>
          )}
        </div>

        {/* Правая колонка: Order Summary */}
        <aside className="md:sticky md:top-8 md:self-start">
          <OrderSummarySidebar
            items={items}
            subtotal={subtotal}
            shipping={shipping}
            tax={tax}
            total={totalWithFees}
          />
        </aside>
      </div>

      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href="/cart">Back to cart</Link>
        </Button>
      </div>
    </div>
  )
}
