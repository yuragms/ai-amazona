"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

const POLL_INTERVAL_MS = 30_000

type DashboardLiveProps = {
  initialOrderCount: number
  initialLowStockCount: number
  children: React.ReactNode
}

export function DashboardLive({
  initialOrderCount,
  initialLowStockCount,
  children,
}: DashboardLiveProps) {
  const router = useRouter()
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date())
  const [prevOrderCount, setPrevOrderCount] = useState(initialOrderCount)
  const [prevLowStockCount, setPrevLowStockCount] = useState(initialLowStockCount)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = useCallback(() => {
    setIsRefreshing(true)
    router.refresh()
    setLastUpdated(new Date())
    setTimeout(() => setIsRefreshing(false), 500)
  }, [router])

  useEffect(() => {
    const id = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    if (prevOrderCount !== initialOrderCount && prevOrderCount >= 0) {
      if (initialOrderCount > prevOrderCount) {
        toast.info("New order received", { description: "Dashboard updated." })
      }
      setPrevOrderCount(initialOrderCount)
    }
    if (prevLowStockCount !== initialLowStockCount && prevLowStockCount >= 0) {
      if (initialLowStockCount > prevLowStockCount) {
        toast.warning("Low stock alert", {
          description: "More products are low on stock.",
        })
      }
      setPrevLowStockCount(initialLowStockCount)
    }
  }, [
    initialOrderCount,
    initialLowStockCount,
    prevOrderCount,
    prevLowStockCount,
  ])

  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const secondsAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 1000)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          Live • Updated {secondsAgo}s ago
        </span>
        <button
          type="button"
          onClick={refresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label="Refresh dashboard"
        >
          <RefreshCw
            className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>
      {children}
    </div>
  )
}
