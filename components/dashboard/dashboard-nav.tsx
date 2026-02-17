"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, UserCircle, MapPin, Heart, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Обзор", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Заказы", icon: Package },
  { href: "/dashboard/profile", label: "Профиль", icon: UserCircle },
  { href: "/dashboard/addresses", label: "Адреса", icon: MapPin },
  { href: "/dashboard/wishlist", label: "Избранное", icon: Heart },
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-row flex-wrap gap-2 md:flex-col md:gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
