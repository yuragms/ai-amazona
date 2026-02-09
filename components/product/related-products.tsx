"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ProductCard } from "@/components/catalog/product-card"

type ProductForCard = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number | string
  images: string[]
  stock: number
  category: { id: string; name: string; slug: string }
  reviews?: { rating: number }[]
}

type RelatedProductsProps = {
  products: ProductForCard[]
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className="text-xl font-semibold text-foreground">
        Related products
      </h2>
      <div className="mt-6">
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 sm:-ml-4">
            {products.map((product) => (
              <CarouselItem
                key={product.id}
                className="pl-2 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 sm:pl-4"
              >
                <ProductCard
                  product={{
                    ...product,
                    price:
                      typeof product.price === "string"
                        ? { toString: () => product.price as string }
                        : { toString: () => String(product.price) },
                  }}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 sm:left-0" />
          <CarouselNext className="right-0 sm:right-0" />
        </Carousel>
      </div>
    </section>
  )
}
