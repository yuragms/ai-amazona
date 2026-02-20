import { ParticlesBackground } from "@/components/auth/particles-background"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center p-6">
      <ParticlesBackground />
      <div className="flex w-full max-w-[480px] flex-col items-center gap-4">
        <ForgotPasswordForm />
        <Link
          href="/login"
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          Назад к входу
        </Link>
      </div>
    </main>
  )
}
