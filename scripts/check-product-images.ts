/**
 * Проверка: какие картинки сохранены в БД у последних товаров.
 * Запуск: npx tsx scripts/check-product-images.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    take: 10,
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, slug: true, images: true, updatedAt: true },
  })
  console.log("Последние 10 товаров (по updatedAt):\n")
  for (const p of products) {
    console.log(`- ${p.name} (slug: ${p.slug})`)
    console.log(`  images: ${p.images.length > 0 ? p.images.join(", ") : "(пусто)"}`)
    if (p.images.length > 0) {
      p.images.forEach((url, i) => console.log(`    [${i}] ${url}`))
    }
    console.log("")
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
