"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DevLoginButton } from "@/components/auth/dev-login-button"
import { register } from "@/app/actions/register"

type Mode = "login" | "register"
type RoleOption = "USER" | "ADMIN"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>("login")
  const [role, setRole] = useState<RoleOption>("USER")
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const resetSuccess = searchParams.get("reset") === "ok"

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    setIsPending(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    const email = (formData.get("email") as string)?.trim()
    const password = formData.get("password") as string
    const name = (formData.get("name") as string)?.trim()

    try {
      if (!email) {
        setFormError("Введите email")
        return
      }
      if (!password) {
        setFormError("Введите пароль")
        return
      }
      if (mode === "register" && !name) {
        setFormError("Введите имя")
        return
      }

      if (mode === "register") {
        formData.set("role", role)
        const result = await register({ ok: true }, formData)
        if (!result.ok) {
          setFormError(result.error)
          return
        }
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        if (signInResult?.error) {
          setFormError("Регистрация прошла, но вход не удался. Попробуйте войти.")
          return
        }
        router.push("/")
        router.refresh()
        return
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (signInResult?.error) {
        setFormError("Неверный email или пароль")
        return
      }
      router.push("/")
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  const errorMessage = formError

  return (
    <Card className="w-full max-w-[480px] min-w-[320px] border-indigo-400/20 bg-white/90 shadow-2xl backdrop-blur-md dark:border-indigo-400/20 dark:bg-slate-900/90">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl">
          {mode === "login" ? "Вход" : "Регистрация"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mode">Режим</Label>
            <Select
              value={mode}
              onValueChange={(v) => {
                setMode(v as Mode)
                setFormError(null)
              }}
            >
              <SelectTrigger id="mode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="login">Вход</SelectItem>
                <SelectItem value="register">Регистрация</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="role">Роль</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as RoleOption)}
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Пользователь</SelectItem>
                  <SelectItem value="ADMIN">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Ваше имя"
                autoComplete="name"
                aria-invalid={!!errorMessage}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@example.com"
              autoComplete="email"
              aria-invalid={!!errorMessage}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Пароль</Label>
              {mode === "login" && (
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Забыли пароль?
                </Link>
              )}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={mode === "login" ? "Пароль" : "Придумайте пароль"}
              aria-invalid={!!errorMessage}
            />
          </div>

          {resetSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400" role="status">
              Пароль успешно изменён. Войдите с новым паролем.
            </p>
          )}
          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline hover:text-foreground">
            На главную
          </Link>
        </p>

        <DevLoginButton />
      </CardContent>
    </Card>
  )
}
