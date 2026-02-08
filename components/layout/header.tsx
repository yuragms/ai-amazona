"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Header() {
  const router = useRouter()

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const q = new FormData(form).get("q") as string
    if (q?.trim()) router.push(`/products?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container flex h-14 items-center justify-between gap-6 px-6 md:px-8">
        <div className="flex shrink-0 items-center gap-6">
          <Link
            href="/"
            className="font-semibold text-foreground"
          >
            <span className="text-xl">Al Amazona</span>
          </Link>
          <Link
            href="/products"
            className="text-sm font-medium text-foreground transition-colors hover:underline"
          >
            Products
          </Link>
        </div>

        <form
          onSubmit={handleSearch}
          className="relative mx-6 flex min-w-0 flex-1 items-center max-w-md"
        >
          <Search className="absolute left-3 size-4 shrink-0 text-muted-foreground pointer-events-none" />
          <Input
            name="q"
            type="search"
            placeholder="Search products..."
            className="h-9 w-full pl-9 pr-9"
            aria-label="Search products"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Search"
          >
            <Search className="size-4" />
          </button>
        </form>

        <div className="flex shrink-0 items-center gap-4">
          <Link
            href="/cart"
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="size-5" />
          </Link>
          <Button variant="default" size="sm" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
