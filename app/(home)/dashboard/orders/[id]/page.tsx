import Link from "next/link"
import { notFound } from "next/navigation"
import { getOrderDetails } from "@/app/actions/order"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const statusLabels: Record<string, string> = {
  PENDING: "Ожидает",
  PAID: "Оплачен",
  PROCESSING: "В обработке",
  SHIPPED: "Отправлен",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
  REFUNDED: "Возврат",
}

export default async function DashboardOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrderDetails(id)

  if (!order) notFound()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Заказ #{order.id.slice(0, 8)}</h1>
          <p className="text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()} ·{" "}
            {statusLabels[order.status] ?? order.status}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/orders">← К списку заказов</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Товары</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {order.orderItems.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">× {item.quantity}</p>
                  </div>
                  <span className="font-medium">
                    ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Подытог</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Доставка</span>
                <span>${order.shipping.toFixed(2)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Налог</span>
                <span>${order.tax.toFixed(2)}</span>
              </p>
              <p className="flex justify-between font-bold">
                <span>Итого</span>
                <span>${order.total.toFixed(2)}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Адрес доставки</CardTitle>
          </CardHeader>
          <CardContent>
            {order.shippingAddress ? (
              <address className="not-italic text-sm">
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}
                  {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </address>
            ) : (
              <p className="text-muted-foreground">Адрес не указан.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
