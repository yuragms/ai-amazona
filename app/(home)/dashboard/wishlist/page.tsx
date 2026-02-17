import Link from "next/link"
import Image from "next/image"
import { getWishlist } from "@/app/actions/wishlist"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WishlistActions } from "@/components/dashboard/wishlist-actions"

export default async function DashboardWishlistPage() {
  const items = await getWishlist()

  if (!items?.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Избранное</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">В избранном пока ничего нет.</p>
            <Button asChild className="mt-4">
              <Link href="/products">Перейти в каталог</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Избранное</h1>
      <Card>
        <CardHeader>
          <CardTitle>Товары ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col overflow-hidden rounded-lg border border-border"
              >
                <Link
                  href={`/products/${item.product.slug}`}
                  className="relative block aspect-square w-full bg-muted"
                >
                  {item.product.images[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-muted-foreground">
                      Нет изображения
                    </span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col justify-between p-3">
                  <div>
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-1 text-sm font-medium">${item.product.price.toFixed(2)}</p>
                    {item.product.stock <= 0 && (
                      <p className="text-sm text-destructive">Нет в наличии</p>
                    )}
                  </div>
                  <WishlistActions
                    wishlistItemId={item.id}
                    productId={item.product.id}
                    productSlug={item.product.slug}
                    disabled={item.product.stock <= 0}
                    className="mt-2"
                  />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
