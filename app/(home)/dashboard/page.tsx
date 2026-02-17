import Link from "next/link"
import { auth } from "@/auth"
import { getOrdersList } from "@/app/actions/order"
import { getAddresses } from "@/app/actions/address"
import { getWishlist } from "@/app/actions/wishlist"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, MapPin, Heart } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) return null

  const [orders, addresses, wishlist] = await Promise.all([
    getOrdersList(),
    getAddresses(),
    getWishlist(),
  ])

  const ordersCount = orders?.length ?? 0
  const addressesCount = addresses?.length ?? 0
  const wishlistCount = wishlist?.length ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Личный кабинет</h1>
        <p className="mt-1 text-muted-foreground">
          Добро пожаловать, {session.user.name || session.user.email || "пользователь"}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Заказы</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{ordersCount}</p>
            <Button variant="link" className="h-auto p-0 text-primary" asChild>
              <Link href="/dashboard/orders">Перейти к заказам</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Сохранённые адреса</CardTitle>
            <MapPin className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{addressesCount}</p>
            <Button variant="link" className="h-auto p-0 text-primary" asChild>
              <Link href="/dashboard/addresses">Управление адресами</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Избранное</CardTitle>
            <Heart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{wishlistCount}</p>
            <Button variant="link" className="h-auto p-0 text-primary" asChild>
              <Link href="/dashboard/wishlist">Перейти в избранное</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {orders && orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Последние заказы</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {orders.slice(0, 5).map((order) => (
                <li key={order.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                  <div>
                    <span className="font-mono text-sm text-muted-foreground">{order.id.slice(0, 8)}…</span>
                    <span className="ml-2 text-sm capitalize">{order.status.toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">${order.total.toFixed(2)}</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/orders/${order.id}`}>Подробнее</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/dashboard/orders">Все заказы</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
