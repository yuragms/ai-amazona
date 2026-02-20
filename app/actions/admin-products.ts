"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200).regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  description: z.string().max(5000).optional(),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().min(0),
  categoryId: z.string().min(1, "Category is required"),
  images: z.array(z.string().url()).default([]),
})

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export async function getCategories() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") return []
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  })
}

export async function getAdminProducts() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") return []
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true, slug: true } } },
  })
}

export type CreateProductResult = { ok: true; id: string } | { ok: false; error: string }

export async function createProduct(
  _prev: unknown,
  formData: FormData
): Promise<CreateProductResult> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  const raw = {
    name: (formData.get("name") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim() || slugify((formData.get("name") as string) ?? ""),
    description: (formData.get("description") as string)?.trim() || undefined,
    price: Number(formData.get("price")),
    stock: Number(formData.get("stock")),
    categoryId: formData.get("categoryId") as string,
    images: JSON.parse((formData.get("images") as string) || "[]") as string[],
  }

  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
    const first = Object.values(msg).flat()[0]
    return { ok: false, error: first ?? "Validation failed" }
  }

  const existing = await prisma.product.findUnique({
    where: { slug: parsed.data.slug },
  })
  if (existing) return { ok: false, error: "Product with this slug already exists" }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
  })
  if (!category) return { ok: false, error: "Category not found" }

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      stock: parsed.data.stock,
      categoryId: parsed.data.categoryId,
      images: parsed.data.images,
    },
  })

  revalidateTag("catalog", "max")
  revalidatePath("/admin/products")
  revalidatePath("/products")
  return { ok: true, id: product.id }
}

export type UpdateProductResult = { ok: true } | { ok: false; error: string }

export async function updateProduct(
  productId: string,
  _prev: unknown,
  formData: FormData
): Promise<UpdateProductResult> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }

  const raw = {
    name: (formData.get("name") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim(),
    description: (formData.get("description") as string)?.trim() || undefined,
    price: Number(formData.get("price")),
    stock: Number(formData.get("stock")),
    categoryId: formData.get("categoryId") as string,
    images: JSON.parse((formData.get("images") as string) || "[]") as string[],
  }

  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
    const first = Object.values(msg).flat()[0]
    return { ok: false, error: first ?? "Validation failed" }
  }

  const existing = await prisma.product.findFirst({
    where: { slug: parsed.data.slug, id: { not: productId } },
  })
  if (existing) return { ok: false, error: "Another product with this slug exists" }

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      stock: parsed.data.stock,
      categoryId: parsed.data.categoryId,
      images: parsed.data.images,
    },
  })

  revalidatePath("/admin/products")
  revalidatePath("/products")
  revalidatePath(`/products/${parsed.data.slug}`)
  revalidateTag(`product-${parsed.data.slug}`, "max")
  revalidateTag("product", "max")
  revalidateTag("catalog", "max")
  return { ok: true }
}

export async function deleteProduct(productId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  })
  await prisma.product.delete({ where: { id: productId } })
  if (product) {
    revalidateTag(`product-${product.slug}`, "max")
  }
  revalidateTag("product", "max")
  revalidateTag("catalog", "max")
  revalidatePath("/admin/products")
  revalidatePath("/products")
  return { ok: true }
}

export async function deleteProductsBulk(
  productIds: string[]
): Promise<{ ok: boolean; error?: string; deleted?: number }> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" }
  }
  if (productIds.length === 0) return { ok: true, deleted: 0 }
  const result = await prisma.product.deleteMany({
    where: { id: { in: productIds } },
  })
  revalidateTag("product", "max")
  revalidateTag("catalog", "max")
  revalidatePath("/admin/products")
  revalidatePath("/products")
  return { ok: true, deleted: result.count }
}
