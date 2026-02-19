import { AdminLayoutClient } from "@/components/admin/admin-layout-client"

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
