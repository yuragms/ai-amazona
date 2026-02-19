import { getAdminProducts, getCategories } from "@/app/actions/admin-products"
import { ProductsTable } from "@/components/admin/products-table"

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getAdminProducts(),
    getCategories(),
  ])

  const serializedProducts = products.map((p) => ({
    ...p,
    price: Number(p.price),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Management</h1>
        <p className="text-muted-foreground">
          CRUD operations, bulk actions, and image uploads (Uploadthing).
        </p>
      </div>
      <ProductsTable
        products={serializedProducts}
        categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
      />
    </div>
  )
}
