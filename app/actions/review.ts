"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type SubmitReviewResult =
  | { ok: true }
  | { ok: false; error: string }

export async function submitReview(
  productId: string,
  rating: number,
  body: string | null
): Promise<SubmitReviewResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to leave a review." }
  }
  if (rating < 1 || rating > 5) {
    return { ok: false, error: "Rating must be between 1 and 5." }
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true },
  })
  if (!product) {
    return { ok: false, error: "Product not found." }
  }

  await prisma.review.upsert({
    where: {
      userId_productId: { userId: session.user.id, productId },
    },
    create: {
      userId: session.user.id,
      productId,
      rating,
      body: body?.trim() || null,
    },
    update: {
      rating,
      body: body?.trim() || null,
    },
  })

  revalidatePath(`/products/${product.slug}`)
  return { ok: true }
}
