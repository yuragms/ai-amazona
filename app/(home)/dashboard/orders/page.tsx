import Link from "next/link"
import { getOrdersList } from "@/app/actions/order"
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

export default async function DashboardOrdersPage() {
  const orders = await getOrdersList()

  if (!orders?.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Заказы</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">У вас пока нет заказов.</p>
            <Button asChild className="mt-4">
              <Link href="/products">Перейти в каталог</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Заказы</h1>
      <Card>
        <CardHeader>
          <CardTitle>История заказов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 font-medium">Заказ</th>
                  <th className="pb-3 font-medium">Дата</th>
                  <th className="pb-3 font-medium">Статус</th>
                  <th className="pb-3 font-medium text-right">Сумма</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="py-3 font-mono text-muted-foreground">{order.id.slice(0, 12)}…</td>
                    <td className="py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 capitalize">{statusLabels[order.status] ?? order.status.toLowerCase()}</td>
                    <td className="py-3 text-right font-medium">${order.total.toFixed(2)}</td>
                    <td className="py-3 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/orders/${order.id}`}>Подробнее</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
