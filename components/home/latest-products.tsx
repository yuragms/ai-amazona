import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/db"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const LATEST_COUNT = 8

export async function LatestProducts() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: LATEST_COUNT,
    include: { category: true },
  })

  if (products.length === 0) {
    return (
      <section className="container px-4 py-10">
        <h2 className="text-2xl font-semibold text-black">
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
      <h2 className="text-2xl font-semibold text-black">
        Latest products
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => {
          const imageSrc = product.images[0]
          const price = Number(product.price)

          return (
            <Card key={product.id} className="overflow-hidden">
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
                <CardContent className="p-4">
                  <h3 className="font-medium text-black line-clamp-2">
                    {product.name}
                  </h3>
                  {product.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm font-semibold text-black">
                    ${price.toFixed(2)}
                  </p>
                </CardContent>
              </Link>
              <CardFooter className="p-4 pt-0">
                <Button asChild variant="default" className="w-full">
                  <Link href={`/products/${product.slug}`}>
                    View product
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
