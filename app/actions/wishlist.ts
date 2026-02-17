"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type WishlistItemRecord = {
  id: string
  productId: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: string[]
    stock: number
  }
}

export async function getWishlist(): Promise<WishlistItemRecord[] | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  if (!hasWishlistModel()) return null

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: true,
          stock: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return items.map((item) => ({
    id: item.id,
    productId: item.productId,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: Number(item.product.price),
      images: item.product.images,
      stock: item.product.stock,
    },
  }))
}

export type ToggleWishlistResult =
  | { ok: true; added: boolean }
  | { ok: false; error: string }

function hasWishlistModel(): boolean {
  const delegate = (prisma as { wishlistItem?: { findMany?: unknown } }).wishlistItem
  return typeof delegate?.findMany === "function"
}

export async function toggleWishlist(productId: string): Promise<ToggleWishlistResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: "Войдите в аккаунт." }
  }
  if (!hasWishlistModel()) {
    return { ok: false, error: "Сервис избранного временно недоступен." }
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: { userId: session.user.id, productId },
    },
  })

  if (existing) {
    await prisma.wishlistItem.delete({
      where: { id: existing.id },
    })
    revalidatePath("/dashboard/wishlist")
    revalidatePath("/products")
    return { ok: true, added: false }
  }

  await prisma.wishlistItem.create({
    data: {
      userId: session.user.id,
      productId,
    },
  })
  revalidatePath("/dashboard/wishlist")
  revalidatePath("/products")
  return { ok: true, added: true }
}

export async function removeFromWishlist(wishlistItemId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: "Войдите в аккаунт." }
  }
  if (!hasWishlistModel()) {
    return { ok: false, error: "Сервис избранного временно недоступен." }
  }

  await prisma.wishlistItem.deleteMany({
    where: {
      id: wishlistItemId,
      userId: session.user.id,
    },
  })
  revalidatePath("/dashboard/wishlist")
  return { ok: true }
}

export async function isInWishlist(productId: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) return false
  if (!hasWishlistModel()) return false

  const item = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: { userId: session.user.id, productId },
    },
  })
  return !!item
}
