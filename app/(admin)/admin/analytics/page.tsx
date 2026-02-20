import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getPeakOrderingTimes,
  getRevenueChartData,
  getCustomerAcquisitionData,
} from "@/app/actions/dashboard"
import { getSalesByCategory } from "@/app/actions/reports"
import { PeakOrderingChart } from "@/components/admin/peak-ordering-chart"
import { RevenueChart } from "@/components/admin/revenue-chart"
import { CustomerAcquisitionChart } from "@/components/admin/customer-acquisition-chart"
import { ExportReports } from "@/components/admin/export-reports"
import { FileText } from "lucide-react"

const DEFAULT_DAYS = 30

function subDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

export default async function AdminAnalyticsPage() {
  const end = new Date()
  const start = subDays(end, DEFAULT_DAYS)
  const fromStr = start.toISOString().slice(0, 10)
  const toStr = end.toISOString().slice(0, 10)

  const [peakOrderingData, revenueData, acquisitionData, salesByCategory] =
    await Promise.all([
      getPeakOrderingTimes(DEFAULT_DAYS),
      getRevenueChartData("30d"),
      getCustomerAcquisitionData(DEFAULT_DAYS),
      getSalesByCategory(fromStr, toStr),
    ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Peak times, revenue trends, and sales by category. Export reports below.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PeakOrderingChart data={peakOrderingData} />
        <RevenueChart data={revenueData} />
      </div>

      <CustomerAcquisitionChart data={acquisitionData} />

      {salesByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales by category (last 30 days)</CardTitle>
            <p className="text-xs text-muted-foreground">
              {fromStr} – {toStr}
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {salesByCategory.map((row) => (
                <li
                  key={row.categoryName}
                  className="flex justify-between rounded-md border px-3 py-2"
                >
                  <span className="font-medium">{row.categoryName}</span>
                  <span className="text-muted-foreground">
                    ${row.revenue.toFixed(2)} · {row.orderCount} units
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4" />
            Export and reports
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Custom date range, CSV download, and print/save as PDF with sales by category.
          </p>
        </CardHeader>
        <CardContent>
          <ExportReports />
        </CardContent>
      </Card>
    </div>
  )
}
