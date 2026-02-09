"use client"

import { useGuestCartStore } from "@/lib/store/guest-cart"

export function GuestCartCount() {
  const count = useGuestCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0)
  )
  if (count <= 0) return null
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  )
}
