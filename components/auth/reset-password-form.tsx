"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("Пароли не совпадают")
      return
    }
    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов")
      return
    }
    if (!tokenFromUrl) {
      setError("Отсутствует ссылка для сброса. Запросите новую.")
      return
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromUrl, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Ошибка сброса пароля")
        return
      }
      router.push("/login?reset=ok")
      router.refresh()
    })
  }

  if (!tokenFromUrl) {
    return (
      <Card className="w-full min-w-[320px] border-indigo-400/20 bg-white/90 shadow-2xl backdrop-blur-md dark:border-indigo-400/20 dark:bg-slate-900/90">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">Сброс пароля</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Неверная или устаревшая ссылка. Запросите новую на странице восстановления пароля.
          </p>
          <Button asChild className="w-full">
            <Link href="/forgot-password">Запросить ссылку</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full min-w-[320px] border-indigo-400/20 bg-white/90 shadow-2xl backdrop-blur-md dark:border-indigo-400/20 dark:bg-slate-900/90">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl">Новый пароль</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Новый пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="Не менее 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Повторите пароль</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Повторите пароль"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              disabled={isPending}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Сохранение…" : "Сохранить пароль"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline hover:text-foreground">
            Назад к входу
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
