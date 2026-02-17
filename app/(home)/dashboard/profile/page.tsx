import { getProfile } from "@/app/actions/profile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileForm } from "@/components/dashboard/profile-form"

export default async function DashboardProfilePage() {
  const profile = await getProfile()

  if (!profile) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Профиль</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Не удалось загрузить профиль.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Профиль</h1>
      <Card>
        <CardHeader>
          <CardTitle>Личные данные</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultName={profile.name ?? ""}
            defaultEmail={profile.email ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  )
}
