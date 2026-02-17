import { getAddresses } from "@/app/actions/address"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddressesList } from "@/components/dashboard/addresses-list"
import { AddressFormDialog } from "@/components/dashboard/address-form-dialog"
import { Button } from "@/components/ui/button"

export default async function DashboardAddressesPage() {
  const addresses = await getAddresses()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Адреса доставки</h1>
        <AddressFormDialog trigger={<Button>Добавить адрес</Button>} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Сохранённые адреса</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressesList addresses={addresses ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}
