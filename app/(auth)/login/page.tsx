import { ParticlesBackground } from "@/components/auth/particles-background"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center p-6">
      <ParticlesBackground />
      <LoginForm />
    </main>
  )
}
