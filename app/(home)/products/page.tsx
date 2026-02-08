import type { Metadata } from "next"
import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { CatalogSidebar } from "@/components/catalog/catalog-sidebar"
import { ProductCard } from "@/components/catalog/product-card"
import { CatalogPagination } from "@/components/catalog/catalog-pagination"

const PAGE_SIZE = 12

export const metadata: Metadata = {
  title: "Products | Amazona",
  description: "Browse our product catalog. Filter by category, search, and find the best deals.",
}

const PRICE_MIN = 0
const PRICE_MAX = 1000

type SearchParams = {
  q?: string
  category?: string
  sort?: string
  minPrice?: string
  maxPrice?: string
  page?: string
}

export default async function ProductsCatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const q = typeof params.q === "string" ? params.q.trim() : undefined
  const categorySlug = typeof params.category === "string" ? params.category.trim() : undefined
  const sort = typeof params.sort === "string" ? params.sort : "price_asc"
  const minPrice = Math.max(PRICE_MIN, parseInt(params.minPrice ?? String(PRICE_MIN), 10) || PRICE_MIN)
  const maxPrice = Math.min(PRICE_MAX, parseInt(params.maxPrice ?? String(PRICE_MAX), 10) || PRICE_MAX)
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { products: true } },
    },
  })

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
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        reviews: { select: { rating: true } },
      },
    }),
    prisma.product.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const searchParamsForLinks = {
    q: q ?? undefined,
    category: categorySlug ?? undefined,
    sort: sort !== "price_asc" ? sort : undefined,
    minPrice: minPrice > PRICE_MIN ? String(minPrice) : undefined,
    maxPrice: maxPrice < PRICE_MAX ? String(maxPrice) : undefined,
  }

  return (
    <div className="container px-4 py-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <Suspense fallback={<div className="w-64 shrink-0 animate-pulse rounded-md bg-muted" />}>
          <CatalogSidebar categories={categories} />
        </Suspense>

        <div className="min-w-0 flex-1">
          <header className="mb-4">
            <h1 className="text-2xl font-semibold text-foreground">
              {q ? `Search: "${q}"` : "Products"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {total} {total === 1 ? "product" : "products"} found
            </p>
          </header>

          {products.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No products match your filters. Try changing the category or search query.
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <CatalogPagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseSearchParams={searchParamsForLinks}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
