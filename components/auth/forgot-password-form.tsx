"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("loading")
    setMessage(null)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus("error")
        setMessage(data.error ?? "Ошибка запроса")
        return
      }
      setStatus("success")
      setMessage(
        data.message ?? "Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля."
      )
    } catch {
      setStatus("error")
      setMessage("Ошибка сети. Попробуйте позже.")
    }
  }

  return (
    <Card className="w-full min-w-[320px] border-indigo-400/20 bg-white/90 shadow-2xl backdrop-blur-md dark:border-indigo-400/20 dark:bg-slate-900/90">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl">Восстановление пароля</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "success" ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={status === "loading"}
              />
            </div>
            {message && status === "error" && (
              <p className="text-sm text-destructive" role="alert">
                {message}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={status === "loading"}>
              {status === "loading" ? "Отправка…" : "Отправить ссылку для сброса"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
