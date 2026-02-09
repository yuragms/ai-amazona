import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { ProductGallery } from "@/components/product/product-gallery"
import { ProductInfo } from "@/components/product/product-info"
import { ReviewsSection } from "@/components/product/reviews-section"
import { RelatedProducts } from "@/components/product/related-products"
import { auth } from "@/auth"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true, images: true },
  })
  if (!product) return { title: "Product | Amazona" }
  const image = product.images[0]
  return {
    title: `${product.name} | Amazona`,
    description: product.description ?? undefined,
    openGraph: image ? { images: [image] } : undefined,
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      reviews: {
        select: {
          id: true,
          rating: true,
          body: true,
          createdAt: true,
          user: { select: { name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!product) notFound()

  const relatedRows = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 8,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      reviews: { select: { rating: true } },
    },
  })
  const relatedProducts = relatedRows.map((p) => ({
    ...p,
    price: Number(p.price),
  }))

  return (
    <div className="container px-4 py-6">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} />
        <ProductInfo
          product={{
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category,
            rating:
              product.reviews.length > 0
                ? product.reviews.reduce((s, r) => s + r.rating, 0) /
                  product.reviews.length
                : 0,
            reviewCount: product.reviews.length,
          }}
          session={session}
        />
      </div>

      <ReviewsSection
        productId={product.id}
        productSlug={product.slug}
        reviews={product.reviews}
        session={session}
      />

      <RelatedProducts products={relatedProducts} />
    </div>
  )
}
