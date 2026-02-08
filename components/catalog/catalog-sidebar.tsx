"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

const PRICE_MIN = 0
const PRICE_MAX = 1000

const SORT_OPTIONS = [
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
] as const

type Category = { id: string; name: string; slug: string; _count: { products: number } }

type CatalogSidebarProps = {
  categories: Category[]
}

function buildSearchString(params: Record<string, string>) {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, v)
  }
  const s = search.toString()
  return s ? `?${s}` : ""
}

export function CatalogSidebar({ categories }: CatalogSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const q = searchParams.get("q") ?? ""
  const categoryFromUrl = searchParams.get("category") ?? ""
  const sortFromUrl = searchParams.get("sort") ?? "price_asc"
  const minPriceFromUrl = Math.max(PRICE_MIN, parseInt(searchParams.get("minPrice") ?? String(PRICE_MIN), 10) || PRICE_MIN)
  const maxPriceFromUrl = Math.min(PRICE_MAX, parseInt(searchParams.get("maxPrice") ?? String(PRICE_MAX), 10) || PRICE_MAX)

  const [category, setCategory] = useState(categoryFromUrl)
  const [sort, setSort] = useState(sortFromUrl)
  const [priceRange, setPriceRange] = useState<[number, number]>([minPriceFromUrl, maxPriceFromUrl])

  useEffect(() => {
    setCategory(categoryFromUrl)
    setSort(sortFromUrl)
    setPriceRange([minPriceFromUrl, maxPriceFromUrl])
  }, [categoryFromUrl, sortFromUrl, minPriceFromUrl, maxPriceFromUrl])

  const applyFilters = useCallback(() => {
    const params: Record<string, string> = {}
    if (q) params.q = q
    if (category) params.category = category
    if (sort && sort !== "newest") params.sort = sort
    if (priceRange[0] > PRICE_MIN) params.minPrice = String(priceRange[0])
    if (priceRange[1] < PRICE_MAX) params.maxPrice = String(priceRange[1])
    router.push(`/products${buildSearchString(params)}`)
  }, [q, category, sort, priceRange, router])

  const resetFilters = useCallback(() => {
    const params: Record<string, string> = {}
    if (q) params.q = q
    router.push(`/products${buildSearchString(params)}`)
  }, [q, router])

  return (
    <aside className="w-full shrink-0 space-y-6 lg:w-64">
      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Category
        </label>
        <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Price Range
        </label>
        <div className="px-1">
          <Slider
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={10}
            value={priceRange}
            onValueChange={(v) => setPriceRange(v as [number, number])}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Sort By
        </label>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={applyFilters} className="w-full">
          Apply Filters
        </Button>
        <Button onClick={resetFilters} variant="outline" className="w-full">
          Reset Filters
        </Button>
      </div>
    </aside>
  )
}
