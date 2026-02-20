import { Suspense } from "react"
import { ParticlesBackground } from "@/components/auth/particles-background"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center p-6">
      <ParticlesBackground />
      <Suspense
        fallback={
          <Card className="w-full min-w-[320px] border-indigo-400/20 bg-white/90 shadow-2xl backdrop-blur-md dark:border-indigo-400/20 dark:bg-slate-900/90">
            <CardHeader className="space-y-1 pb-4">
              <div className="h-7 w-40 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-10 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  )
}
