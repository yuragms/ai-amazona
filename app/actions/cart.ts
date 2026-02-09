"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { Decimal } from "@prisma/client/runtime/library"

export type AddToCartResult = { ok: true } | { ok: false; error: string }
export type CartActionResult = { ok: true } | { ok: false; error: string }

export type CartItemWithProduct = {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    price: Decimal
    images: string[]
    stock: number
  }
}

export async function addToCart(productId: string, quantity: number = 1): Promise<AddToCartResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to add items to cart." }
  }
  if (quantity < 1) {
    return { ok: false, error: "Invalid quantity." }
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, stock: true },
  })
  if (!product) {
    return { ok: false, error: "Product not found." }
  }
  if (product.stock < 1) {
    return { ok: false, error: "Product is out of stock." }
  }

  const requested = Math.min(quantity, product.stock)

  await prisma.cartItem.upsert({
    where: {
      userId_productId: { userId: session.user.id, productId },
    },
    create: {
      userId: session.user.id,
      productId,
      quantity: requested,
    },
    update: {
      quantity: { increment: requested },
    },
  })

  revalidatePath("/cart")
  revalidatePath("/products/[slug]", "page")
  revalidatePath("/")
  return { ok: true }
}

export async function getCartItems(): Promise<CartItemWithProduct[] | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: { id: true, name: true, slug: true, price: true, images: true, stock: true },
      },
    },
    orderBy: { id: "asc" },
  })
  return items
}

export async function getCartCount(): Promise<number> {
  const session = await auth()
  if (!session?.user?.id) return 0

  const result = await prisma.cartItem.aggregate({
    where: { userId: session.user.id },
    _sum: { quantity: true },
  })
  return result._sum.quantity ?? 0
}

export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
): Promise<CartActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to update cart." }
  }
  if (quantity < 1) {
    return { ok: false, error: "Quantity must be at least 1." }
  }

  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId: session.user.id },
    include: { product: { select: { stock: true } } },
  })
  if (!cartItem) {
    return { ok: false, error: "Cart item not found." }
  }

  const newQuantity = Math.min(quantity, cartItem.product.stock)

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity: newQuantity },
  })

  revalidatePath("/cart")
  revalidatePath("/")
  return { ok: true }
}

export async function removeFromCart(cartItemId: string): Promise<CartActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to update cart." }
  }

  const deleted = await prisma.cartItem.deleteMany({
    where: { id: cartItemId, userId: session.user.id },
  })
  if (deleted.count === 0) {
    return { ok: false, error: "Cart item not found." }
  }

  revalidatePath("/cart")
  revalidatePath("/")
  return { ok: true }
}

export type ProductForCart = {
  id: string
  name: string
  slug: string
  price: Decimal
  images: string[]
  stock: number
}

export async function getProductsByIds(ids: string[]): Promise<ProductForCart[]> {
  if (ids.length === 0) return []
  const unique = [...new Set(ids)]
  const products = await prisma.product.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true, slug: true, price: true, images: true, stock: true },
  })
  return products
}

export type MergeGuestCartResult = { ok: true } | { ok: false; error: string }

export async function mergeGuestCart(
  items: { productId: string; quantity: number }[]
): Promise<MergeGuestCartResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." }
  }
  for (const { productId, quantity } of items) {
    if (quantity < 1) continue
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true },
    })
    if (!product || product.stock < 1) continue
    const requested = Math.min(quantity, product.stock)
    await prisma.cartItem.upsert({
      where: {
        userId_productId: { userId: session.user.id, productId },
      },
      create: {
        userId: session.user.id,
        productId,
        quantity: requested,
      },
      update: {
        quantity: { increment: requested },
      },
    })
  }
  revalidatePath("/cart")
  revalidatePath("/")
  return { ok: true }
}
