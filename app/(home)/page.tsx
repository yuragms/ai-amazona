import { BannerCarousel } from "@/components/home/banner-carousel"
import { LatestProducts } from "@/components/home/latest-products"

export default function HomePage() {
  return (
    <div>
      <BannerCarousel />
      <div className="container px-4 py-8">
        <section className="text-center py-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Welcome to Amazona
          </h1>
          <p className="mt-2 text-muted-foreground">
            Discover great products and deals. Browse our catalog to get started.
          </p>
        </section>
      </div>
      <LatestProducts />
    </div>
  )
}
