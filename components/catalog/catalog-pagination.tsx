import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type CatalogPaginationProps = {
  currentPage: number
  totalPages: number
  baseSearchParams: Record<string, string | undefined>
}

function buildQueryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, v)
  }
  const s = search.toString()
  return s ? `?${s}` : ""
}

export function CatalogPagination({
  currentPage,
  totalPages,
  baseSearchParams,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null

  const prevPage = currentPage > 1 ? currentPage - 1 : null
  const nextPage = currentPage < totalPages ? currentPage + 1 : null

  const pages: number[] = []
  const showPages = 5
  let start = Math.max(1, currentPage - Math.floor(showPages / 2))
  let end = Math.min(totalPages, start + showPages - 1)
  if (end - start + 1 < showPages) start = Math.max(1, end - showPages + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (start > 1 && pages[0] !== 1) pages.unshift(1)
  if (end < totalPages && pages[pages.length - 1] !== totalPages) pages.push(totalPages)

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 py-6"
      aria-label="Catalog pagination"
    >
      {prevPage ? (
        <Button variant="outline" size="sm" asChild>
          <Link
            href={buildQueryString({ ...baseSearchParams, page: String(prevPage) })}
            className="gap-1"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled className="gap-1">
          <ChevronLeft className="size-4" />
          Previous
        </Button>
      )}

      <div className="flex items-center gap-1">
        {pages.map((p) => {
          const isCurrent = p === currentPage
          return (
            <Button
              key={p}
              variant={isCurrent ? "default" : "outline"}
              size="icon-sm"
              asChild={!isCurrent}
              disabled={isCurrent}
              className={cn(isCurrent && "pointer-events-none")}
            >
              {isCurrent ? (
                <span>{p}</span>
              ) : (
                <Link href={buildQueryString({ ...baseSearchParams, page: String(p) })}>
                  {p}
                </Link>
              )}
            </Button>
          )
        })}
      </div>

      {nextPage ? (
        <Button variant="outline" size="sm" asChild>
          <Link
            href={buildQueryString({ ...baseSearchParams, page: String(nextPage) })}
            className="gap-1"
          >
            Next
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled className="gap-1">
          Next
          <ChevronRight className="size-4" />
        </Button>
      )}
    </nav>
  )
}
