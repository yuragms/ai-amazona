import type { Metadata } from "next"
import { Suspense } from "react"
import { getCachedCatalogCategories, getCachedCatalogProducts } from "@/lib/cached-queries"
import { CatalogSidebar } from "@/components/catalog/catalog-sidebar"
import { ProductCard } from "@/components/catalog/product-card"
import { CatalogPagination } from "@/components/catalog/catalog-pagination"
import { ClearSearch } from "@/components/catalog/clear-search"

const PRICE_MIN = 0
const PRICE_MAX = 1000
const PAGE_SIZE = 12
const SEARCH_QUERY_MAX_LENGTH = 200

type SearchParams = {
  q?: string
  category?: string
  sort?: string
  minPrice?: string
  maxPrice?: string
  page?: string
}

function normalizeSearchQuery(q: string | undefined): string | undefined {
  const t = typeof q === "string" ? q.trim() : ""
  if (!t) return undefined
  return t.slice(0, SEARCH_QUERY_MAX_LENGTH) || undefined
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const params = await searchParams
  const q = normalizeSearchQuery(params.q)
  if (q) {
    return {
      title: `Search: "${q}" | Products | Amazona`,
      description: `Search results for "${q}". Browse products and find the best deals.`,
      openGraph: {
        title: `Search: "${q}" | Amazona`,
      },
    }
  }
  return {
    title: "Products | Amazona",
    description: "Browse our product catalog. Filter by category, search, and find the best deals.",
  }
}

export default async function ProductsCatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const q = normalizeSearchQuery(params.q)
  const categorySlug = typeof params.category === "string" ? params.category.trim() : undefined
  const sort = typeof params.sort === "string" ? params.sort : "price_asc"
  const minPrice = Math.max(PRICE_MIN, parseInt(params.minPrice ?? String(PRICE_MIN), 10) || PRICE_MIN)
  const maxPrice = Math.min(PRICE_MAX, parseInt(params.maxPrice ?? String(PRICE_MAX), 10) || PRICE_MAX)
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)

  const [categories, { products, total }] = await Promise.all([
    getCachedCatalogCategories(),
    getCachedCatalogProducts({ q, categorySlug, sort, minPrice, maxPrice, page }),
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
            <div className="flex flex-wrap items-center gap-1">
              <h1 className="text-2xl font-semibold text-foreground">
                {q ? `Search: "${q}"` : "Products"}
              </h1>
              <Suspense fallback={null}>
                <ClearSearch />
              </Suspense>
            </div>
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
