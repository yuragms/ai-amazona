"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

const TEST_EMAIL = "user@example.com"
const TEST_PASSWORD = "user123"

export function DevLoginButton() {
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  async function handleDevLogin() {
    await signIn("credentials", {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      callbackUrl: "/",
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleDevLogin}
      className="mt-4 border-amber-500/50 text-amber-700 dark:text-amber-400"
    >
      Войти как тестовый пользователь (user@example.com)
    </Button>
  )
}
