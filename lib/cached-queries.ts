import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"

const CATALOG_CATEGORIES_REVALIDATE = 300 // 5 min
const CATALOG_PRODUCTS_REVALIDATE = 60 // 1 min (search + filters)
const PRODUCT_PAGE_REVALIDATE = 60 // 1 min
const ADMIN_METRICS_REVALIDATE = 30 // 30 sec

const CATALOG_PAGE_SIZE = 12

export async function getCachedCatalogCategories() {
  return unstable_cache(
    async () =>
      prisma.category.findMany({
        where: { parentId: null },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: true } },
        },
      }),
    ["catalog-categories"],
    { tags: ["catalog"], revalidate: CATALOG_CATEGORIES_REVALIDATE }
  )()
}

export type CatalogProductsParams = {
  q: string | undefined
  categorySlug: string | undefined
  sort: string
  minPrice: number
  maxPrice: number
  page: number
}

export async function getCachedCatalogProducts(params: CatalogProductsParams) {
  const { q, categorySlug, sort, minPrice, maxPrice, page } = params
  const key = [
    "catalog-products",
    q ?? "",
    categorySlug ?? "",
    sort,
    String(minPrice),
    String(maxPrice),
    String(page),
  ] as const
  return unstable_cache(
    async () => {
      const orderBy =
        sort === "price_asc"
          ? [{ price: "asc" as const }]
          : sort === "price_desc"
            ? [{ price: "desc" as const }]
            : [{ createdAt: "desc" as const }]
      const where = {
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { description: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        price: { gte: minPrice, lte: maxPrice },
      }
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          skip: (page - 1) * CATALOG_PAGE_SIZE,
          take: CATALOG_PAGE_SIZE,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            reviews: { select: { rating: true } },
          },
        }),
        prisma.product.count({ where }),
      ])
      return { products, total }
    },
    key,
    { tags: ["catalog"], revalidate: CATALOG_PRODUCTS_REVALIDATE }
  )()
}

export async function getCachedProductBySlug(slug: string) {
  return unstable_cache(
    async () =>
      prisma.product.findUnique({
        where: { slug },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          reviews: {
            select: {
              id: true,
              rating: true,
              body: true,
              createdAt: true,
              user: { select: { name: true, image: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    ["product", slug],
    { tags: ["product", `product-${slug}`], revalidate: PRODUCT_PAGE_REVALIDATE }
  )()
}

export async function getCachedRelatedProducts(categoryId: string, excludeProductId: string) {
  return unstable_cache(
    async () =>
      prisma.product.findMany({
        where: {
          categoryId,
          id: { not: excludeProductId },
        },
        take: 8,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          reviews: { select: { rating: true } },
        },
      }),
    ["related-products", categoryId, excludeProductId],
    { tags: ["product"], revalidate: PRODUCT_PAGE_REVALIDATE }
  )()
}
