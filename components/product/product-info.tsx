import Link from "next/link"
import type { Decimal } from "@prisma/client/runtime/library"
import { StarRatingDisplay } from "@/components/product/star-rating"
import { ProductInfoActionsClient } from "@/components/product/product-info-actions"
import { Button } from "@/components/ui/button"

type ProductInfoProps = {
  product: {
    id: string
    name: string
    description: string | null
    price: Decimal
    stock: number
    category: { id: string; name: string; slug: string }
    rating?: number
    reviewCount?: number
  }
  session: { user?: { id: string } } | null
}

export function ProductInfo({ product, session }: ProductInfoProps) {
  const price = Number(product.price)
  const reviewCount = product.reviewCount ?? 0
  const hasReviews = reviewCount > 0

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/products?category=${product.category.slug}`}
          className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
        >
          {product.category.name}
        </Link>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {product.name}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <StarRatingDisplay rating={product.rating ?? 0} size="sm" />
          <span className="text-sm text-muted-foreground">
            {hasReviews
              ? `(${reviewCount} ${reviewCount === 1 ? "review" : "reviews"})`
              : "(0 reviews)"}
          </span>
        </div>
      </div>

      <p className="text-2xl font-bold text-foreground">${price.toFixed(2)}</p>

      {product.description ? (
        <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
          {product.description}
        </p>
      ) : null}

      <ProductInfoActions
        productId={product.id}
        stock={product.stock}
        isAuthenticated={!!session?.user}
      />
    </div>
  )
}

function ProductInfoActions({
  productId,
  stock,
  isAuthenticated,
}: {
  productId: string
  stock: number
  isAuthenticated: boolean
}) {
  if (stock <= 0) {
    return (
      <Button disabled className="w-full sm:w-auto">
        Out of stock
      </Button>
    )
  }
  return (
    <ProductInfoActionsClient
      productId={productId}
      stock={stock}
      isAuthenticated={isAuthenticated}
    />
  )
}
