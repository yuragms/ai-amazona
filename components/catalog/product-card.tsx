import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type ProductWithCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  price: { toString(): string }
  images: string[]
  stock: number
  category: { id: string; name: string; slug: string }
  reviews?: { rating: number }[]
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const fullStars = Math.min(5, Math.round(rating))
  const emptyStars = 5 - fullStars

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: fullStars }, (_, i) => (
          <Star key={`full-${i}`} className="size-4 fill-amber-400 text-amber-400" />
        ))}
        {Array.from({ length: emptyStars }, (_, i) => (
          <Star key={`empty-${i}`} className="size-4 text-muted-foreground/50" />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">({reviewCount})</span>
    </div>
  )
}

export function ProductCard({ product }: { product: ProductWithCategory }) {
  const imageSrc = product.images[0]
  const price = Number(product.price)
  const reviews = product.reviews ?? []
  const reviewCount = reviews.length
  const rating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0

  return (
    <Card className="overflow-hidden">
      <Link href={`/products/${product.slug}`}>
        <CardHeader className="p-0">
          <div className="relative aspect-square w-full bg-muted">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 p-4">
          <h3 className="font-semibold text-foreground line-clamp-2">
            {product.name}
          </h3>
          {product.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {product.description}
            </p>
          ) : null}
          <StarRating rating={rating} reviewCount={reviewCount} />
          <p className="font-bold text-foreground">
            ${price.toFixed(2)}
          </p>
          {product.stock <= 0 && (
            <p className="text-xs text-muted-foreground">Out of stock</p>
          )}
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0">
        <Button
          asChild
          variant="default"
          className="w-full font-semibold"
          disabled={product.stock <= 0}
        >
          <Link href={`/products/${product.slug}`}>
            Add to Cart
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
