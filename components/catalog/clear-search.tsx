"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ClearSearch() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q")?.trim()
  if (!q) return null

  const params = new URLSearchParams(searchParams)
  params.delete("q")
  params.delete("page")
  const href = params.toString() ? `/products?${params.toString()}` : "/products"

  return (
    <Button variant="ghost" size="sm" className="ml-2 h-auto gap-1 px-2 py-1 text-muted-foreground hover:text-foreground" asChild>
      <Link href={href} title="Remove search keyword">
        <X className="size-4" />
        Clear search
      </Link>
    </Button>
  )
}
