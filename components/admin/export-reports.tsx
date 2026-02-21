"use client"

import { useState } from "react"
import { getReportData, generateOrdersCsv, type ReportData } from "@/app/actions/reports"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileDown, FileText, Loader2, Printer } from "lucide-react"

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function ExportReports() {
  const today = new Date()
  const defaultFrom = formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000))
  const defaultTo = formatDate(today)

  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)

  const presets = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
  ]

  function applyPreset(days: number) {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setFrom(formatDate(start))
    setTo(formatDate(end))
    setReport(null)
  }

  async function handleGenerate() {
    setLoading(true)
    setReport(null)
    try {
      const data = await getReportData(from, to)
      setReport(data ?? null)
    } finally {
      setLoading(false)
    }
  }

  async function handleExportCsv() {
    setCsvLoading(true)
    try {
      const result = await generateOrdersCsv(from, to)
      if (!result) return
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = result.filename
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setCsvLoading(false)
    }
  }

  function handlePrint() {
    if (!report) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    const fromEsc = escapeHtml(report.from)
    const toEsc = escapeHtml(report.to)
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Orders Report ${fromEsc} to ${toEsc}</title>
        <style>
          body { font-family: system-ui; padding: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          .summary { margin-bottom: 24px; }
          .summary p { margin: 4px 0; }
        </style></head>
        <body>
          <h1>Orders Report</h1>
          <p><strong>Period:</strong> ${fromEsc} to ${toEsc}</p>
          <div class="summary">
            <p><strong>Total Revenue:</strong> $${report.totalRevenue.toFixed(2)}</p>
            <p><strong>Total Orders:</strong> ${report.totalOrders}</p>
            <p><strong>Average Order Value:</strong> $${report.averageOrderValue.toFixed(2)}</p>
          </div>
          ${report.salesByCategory.length > 0 ? `
          <h2>Sales by category</h2>
          <table>
            <thead><tr><th>Category</th><th>Revenue</th><th>Units</th></tr></thead>
            <tbody>
              ${report.salesByCategory.map((r) => `<tr><td>${escapeHtml(r.categoryName)}</td><td>$${r.revenue.toFixed(2)}</td><td>${r.orderCount}</td></tr>`).join("")}
            </tbody>
          </table>
          ` : ""}
          <h2>Orders</h2>
          <table>
            <thead><tr>
              <th>Order ID</th><th>Date</th><th>Customer</th><th>Status</th><th>Total</th>
            </tr></thead>
            <tbody>
              ${report.orders
                .map(
                  (o) =>
                    `<tr>
                      <td>${escapeHtml(o.id.slice(0, 8))}…</td>
                      <td>${new Date(o.createdAt).toLocaleString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                      <td>${escapeHtml(o.customerName)}</td>
                      <td>${escapeHtml(statusLabels[o.status] ?? o.status)}</td>
                      <td>$${o.total.toFixed(2)}</td>
                    </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4" />
          Export and Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="report-from">From</Label>
            <Input
              id="report-from"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setReport(null)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-to">To</Label>
            <Input
              id="report-to"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setReport(null)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Preset</Label>
            <Select onValueChange={(v) => applyPreset(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((p) => (
                  <SelectItem key={p.days} value={String(p.days)}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin shrink-0" />}
            <span className="ml-2">Generate report</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={csvLoading}
          >
            {csvLoading ? (
              <Loader2 className="size-4 animate-spin shrink-0" />
            ) : (
              <FileDown className="size-4 shrink-0" />
            )}
            <span className="ml-2">Export CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={!report || report.orders.length === 0}
          >
            <Printer className="size-4" />
            <span className="ml-2">Print / Save as PDF</span>
          </Button>
        </div>

        {report && (
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-medium">Report summary</h3>
            <p className="text-sm text-muted-foreground">
              {report.from} – {report.to}
            </p>
            <ul className="grid gap-1 text-sm sm:grid-cols-3">
              <li>
                <strong>Total revenue:</strong> $
                {report.totalRevenue.toFixed(2)}
              </li>
              <li>
                <strong>Total orders:</strong> {report.totalOrders}
              </li>
              <li>
                <strong>Avg. order value:</strong> $
                {report.averageOrderValue.toFixed(2)}
              </li>
            </ul>
            {report.salesByCategory.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium mb-2">Sales by category</h4>
                <ul className="text-sm space-y-1">
                  {report.salesByCategory.map((row) => (
                    <li key={row.categoryName} className="flex justify-between gap-4">
                      <span>{row.categoryName}</span>
                      <span>
                        ${row.revenue.toFixed(2)} ({row.orderCount} units)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.orders.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {report.orders.length} order(s) in range.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
