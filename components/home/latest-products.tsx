import { prisma } from "@/lib/db"
import { ProductCard } from "@/components/catalog/product-card"

const LATEST_COUNT = 8

export async function LatestProducts() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: LATEST_COUNT,
    include: {
      category: true,
      reviews: { select: { rating: true } },
    },
  })

  if (products.length === 0) {
    return (
      <section className="container px-4 py-10">
        <h2 className="text-2xl font-semibold text-foreground">
          Latest products
        </h2>
        <p className="mt-4 text-muted-foreground">
          No products yet. Run the seed to add sample products.
        </p>
      </section>
    )
  }

  return (
    <section className="container px-4 py-10">
      <h2 className="text-2xl font-semibold text-foreground">
        Latest products
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
