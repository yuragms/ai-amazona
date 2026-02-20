"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PeakOrderingHour } from "@/app/actions/dashboard"

type PeakOrderingChartProps = {
  data: PeakOrderingHour[]
}

export function PeakOrderingChart({ data }: PeakOrderingChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Peak ordering times</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No orders in the last 30 days.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Peak ordering times</CardTitle>
        <p className="text-xs text-muted-foreground">Orders by hour (last 30 days)</p>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] min-h-[200px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value: number | undefined) => [value ?? 0, "Orders"]}
                labelFormatter={(label) => `Hour ${label}`}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
