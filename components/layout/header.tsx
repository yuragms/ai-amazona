"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
]

export function Header() {
  const router = useRouter()

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const q = new FormData(form).get("q") as string
    if (q?.trim()) router.push(`/products?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-4 px-4 md:gap-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold text-foreground"
        >
          <span className="text-xl">Amazona</span>
        </Link>

        <form
          onSubmit={handleSearch}
          className="relative hidden w-full max-w-sm flex-1 items-center md:flex"
        >
          <Search className="absolute left-3 size-4 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            placeholder="Search products..."
            className="pl-9 pr-4"
            aria-label="Search products"
          />
          <Button type="submit" variant="secondary" size="sm" className="ml-2">
            Search
          </Button>
        </form>

        <nav className="flex items-center gap-4 md:gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/cart"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="size-5" />
            <span className="hidden sm:inline">Cart</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
