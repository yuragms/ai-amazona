import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserCircle, MapPin, Bell } from "lucide-react"

export default function DashboardSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Настройки</h1>

      <Card>
        <CardHeader>
          <CardTitle>Учётная запись</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <UserCircle className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Профиль</p>
                <p className="text-sm text-muted-foreground">Имя, email и данные для входа</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/profile">Перейти</Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Адреса доставки</p>
                <p className="text-sm text-muted-foreground">Сохранённые адреса для заказов</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/addresses">Перейти</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Уведомления</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-border p-4">
            <Bell className="size-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">Email-уведомления</p>
              <p className="text-sm text-muted-foreground">
                Уведомления о заказах и акциях (настраиваются при появлении функции).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
