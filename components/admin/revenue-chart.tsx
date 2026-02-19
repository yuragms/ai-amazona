"use client"

import { useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { RevenueDataPoint } from "@/app/actions/dashboard"

type RevenueChartProps = {
  data: RevenueDataPoint[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d")
  const displayedData =
    period === "7d"
      ? data.slice(-7)
      : period === "30d"
        ? data.slice(-30)
        : data

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Revenue</CardTitle>
        <div className="flex gap-1">
          <Button
            variant={period === "7d" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPeriod("7d")}
          >
            7d
          </Button>
          <Button
            variant={period === "30d" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPeriod("30d")}
          >
            30d
          </Button>
          <Button
            variant={period === "90d" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPeriod("90d")}
          >
            90d
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] min-h-[200px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
            <AreaChart
              data={displayedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => {
                  const d = new Date(v)
                  return `${d.getMonth() + 1}/${d.getDate()}`
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value: number | undefined) => [
                  `$${(value ?? 0).toFixed(2)}`,
                  "Revenue",
                ]}
                labelFormatter={(v) => new Date(v).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fill="url(#revenueGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
