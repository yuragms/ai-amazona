"use client"

import { useEffect } from "react"
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import { useGuestCartStore } from "@/lib/store/guest-cart"
import { MergeGuestCart } from "@/components/cart/merge-guest-cart"

interface SessionProviderProps {
  children: React.ReactNode
  session?: Session | null
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  useEffect(() => {
    useGuestCartStore.persist.rehydrate()
  }, [])

  return (
    <NextAuthSessionProvider session={session}>
      <MergeGuestCart />
      {children}
    </NextAuthSessionProvider>
  )
}
