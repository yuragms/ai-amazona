"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type AddToCartResult = { ok: true } | { ok: false; error: string }

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

  revalidatePath("/products/[slug]", "page")
  revalidatePath("/")
  return { ok: true }
}
