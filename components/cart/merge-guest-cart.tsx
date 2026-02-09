"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { mergeGuestCart } from "@/app/actions/cart"
import { useGuestCartStore } from "@/lib/store/guest-cart"

/**
 * When user is authenticated and guest cart has items, merges them into DB and clears guest store.
 */
export function MergeGuestCart() {
  const { status, data: session } = useSession()
  const merged = useRef(false)

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return
    const items = useGuestCartStore.getState().items
    if (items.length === 0 || merged.current) return
    merged.current = true
    mergeGuestCart(items).then(() => {
      useGuestCartStore.getState().clear()
    })
  }, [status, session?.user])

  return null
}
