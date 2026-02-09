"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type GuestCartItem = {
  productId: string
  quantity: number
}

type GuestCartState = {
  items: GuestCartItem[]
  addItem: (productId: string, quantity: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  getTotalCount: () => number
}

function mergeItem(
  items: GuestCartItem[],
  productId: string,
  delta: number
): GuestCartItem[] {
  const existing = items.find((i) => i.productId === productId)
  if (existing) {
    const newQty = Math.max(0, existing.quantity + delta)
    if (newQty === 0) return items.filter((i) => i.productId !== productId)
    return items.map((i) =>
      i.productId === productId ? { ...i, quantity: newQty } : i
    )
  }
  if (delta <= 0) return items
  return [...items, { productId, quantity: delta }]
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productId, quantity) =>
        set((state) => ({
          items: mergeItem(state.items, productId, quantity),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity < 1) {
            return { items: state.items.filter((i) => i.productId !== productId) }
          }
          const existing = state.items.find((i) => i.productId === productId)
          if (!existing) return state
          return {
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          }
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      clear: () => set({ items: [] }),
      getTotalCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "guest-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
)
