import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash("admin123", 10)
  const result = await prisma.user.updateMany({
    where: { email: "admin@example.com", role: "ADMIN" },
    data: { password: hash },
  })
  console.log("Updated", result.count, "admin user(s) with password admin123")
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
