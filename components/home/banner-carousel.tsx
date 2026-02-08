"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

const BANNERS = [
  { src: "/images/banner1.jpg", alt: "Banner 1" },
  { src: "/images/banner2.jpg", alt: "Banner 2" },
  { src: "/images/banner3.jpg", alt: "Banner 3" },
]

const AUTOPLAY_DELAY_MS = 5000

export function BannerCarousel() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
    api.on("select", () => setCurrent(api.selectedScrollSnap()))
  }, [api])

  useEffect(() => {
    if (!api) return
    const id = setInterval(() => api.scrollNext(), AUTOPLAY_DELAY_MS)
    return () => clearInterval(id)
  }, [api])

  return (
    <section className="w-full bg-muted pt-8 pb-6 md:pt-10 md:pb-8">
      <div className="container relative px-4">
        <Carousel
          setApi={setApi}
          opts={{ align: "start", loop: true }}
          className="w-full"
        >
          <CarouselContent>
            {BANNERS.map((banner, i) => (
              <CarouselItem key={banner.src} className="basis-full pl-0">
                <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg md:aspect-[3/1]">
                  <Image
                    src={banner.src}
                    alt={banner.alt}
                    fill
                    className="object-cover"
                    priority={i === 0}
                    sizes="(min-width: 1024px) 1280px, 100vw"
                  />
                  <div className="absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent md:from-black/60 md:via-transparent" />
                  <div className="absolute bottom-6 left-4 z-10 max-w-md md:bottom-8 md:left-8">
                    <div className="rounded-lg bg-black/50 px-4 py-3 backdrop-blur-sm md:px-5 md:py-4">
                      <h2 className="text-xl font-bold text-white md:text-2xl">
                        New Arrivals
                      </h2>
                      <p className="mt-1 text-sm text-white/90 md:text-base">
                        Check out our latest collection of amazing products
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2 top-1/2 border-0 bg-white/90 shadow-md hover:bg-white md:left-4" />
          <CarouselNext className="right-2 top-1/2 border-0 bg-white/90 shadow-md hover:bg-white md:right-4" />
        </Carousel>

        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 flex justify-center gap-2 px-4">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === current ? "bg-primary" : "bg-primary/50 hover:bg-primary/70"
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
