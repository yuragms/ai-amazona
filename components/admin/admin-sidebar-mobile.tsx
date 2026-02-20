"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, LayoutDashboard, Menu, Package, ShoppingCart, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
]

type AdminSidebarMobileProps = {
  sidebarOpen: boolean
  onToggle: () => void
}

export function AdminSidebarMobile({ sidebarOpen, onToggle }: AdminSidebarMobileProps) {
  const pathname = usePathname()
  const isNarrow = useMediaQuery("(max-width: 767px)")

  const handleToggle = () => {
    onToggle()
  }

  return (
    <>
      {/* Нативная кнопка — всегда кликабельна, ничего не перекрывает на десктопе */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        className="relative z-[100] flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
      >
        <Menu className="size-5" />
      </button>
      {/* Overlay только на узком экране; ниже по z-index, чтобы не перехватывать клики по панели */}
      {isNarrow && sidebarOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/50"
          onClick={handleToggle}
          aria-hidden
        />
      )}
      {/* Панель выше overlay (z-[60]), чтобы клики по пунктам меню срабатывали */}
      {isNarrow && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-[60] w-56 transform border-r border-border bg-card transition-transform",
            sidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
          )}
        >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link href="/admin" className="font-semibold" onClick={handleToggle}>
            Admin
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </Button>
        </div>
        <nav className="space-y-0.5 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleToggle}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      )}
    </>
  )
}
