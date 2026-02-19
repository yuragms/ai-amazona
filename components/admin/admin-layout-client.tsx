"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminSidebarMobile } from "@/components/admin/admin-sidebar-mobile"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"

export function AdminLayoutClient({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isWide = useMediaQuery("(min-width: 768px)")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!isWide) setSidebarOpen(false)
  }, [isWide])

  const handleToggle = useCallback(() => {
    setSidebarOpen((v) => !v)
  }, [])

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {isWide && sidebarOpen && <AdminSidebar />}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
          <AdminSidebarMobile
            sidebarOpen={sidebarOpen}
            onToggle={handleToggle}
          />
          <Link
            href="/"
            className="font-semibold text-foreground hover:underline"
          >
            <span className="text-xl">Al Amazona</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="ml-auto gap-2">
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back to store</span>
            </Link>
          </Button>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
