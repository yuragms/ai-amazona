"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { LayoutDashboard, LogOut, Package, Search, ShoppingCart, User, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GuestCartCount } from "@/components/cart/guest-cart-count"
import { useGuestCartStore } from "@/lib/store/guest-cart"

type HeaderProps = {
  cartCount?: number
}

export function Header({ cartCount = 0 }: HeaderProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated" && !!session?.user

  const guestCount = useGuestCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  )
  const showGuestCount = !isAuthenticated
  const showAuthCount = isAuthenticated && cartCount > 0
  const cartAriaCount = isAuthenticated ? cartCount : guestCount

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
            className="relative flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={
              cartAriaCount > 0
                ? `Shopping cart, ${cartAriaCount} items`
                : "Shopping cart"
            }
          >
            <ShoppingCart className="size-5" />
            {showAuthCount && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
            {showGuestCount && <GuestCartCount />}
          </Link>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="User menu"
                >
                  <User className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">
                    <Package className="size-4" />
                    My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserCircle className="size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(e) => {
                    e.preventDefault()
                    signOut({ callbackUrl: "/" })
                  }}
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
