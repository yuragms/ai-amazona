import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

async function main() {
  // Clear existing data (optional - comment out if you want to preserve data)
  await prisma.cartItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  // Don't delete users — use upsert so admin/user are created or kept

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create regular user
  const userPassword = await hash("user123", 12);
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "Regular User",
      password: userPassword,
      role: "USER",
    },
  });

  console.log("Upserted users:", admin.email, user.email);
  console.log("Admin password: admin123, User password: user123");

  // Categories with images from public/images
  const tshirts = await prisma.category.create({
    data: {
      name: "T-Shirts",
      slug: "t-shirts",
      image: "/images/c-tshirts.jpg",
    },
  });

  const jeans = await prisma.category.create({
    data: {
      name: "Jeans",
      slug: "jeans",
      image: "/images/c-jeans.jpg",
    },
  });

  const shoes = await prisma.category.create({
    data: {
      name: "Shoes",
      slug: "shoes",
      image: "/images/c-shoes.jpg",
    },
  });

  console.log("Created categories: T-Shirts, Jeans, Shoes");

  // Products with images from public/images
  const products = [
    {
      name: "Classic Cotton T-Shirt",
      slug: "classic-cotton-tshirt",
      description: "Comfortable cotton t-shirt for everyday wear.",
      price: 24.99,
      images: ["/images/p11-1.jpg", "/images/p11-2.jpg"],
      stock: 50,
      categoryId: tshirts.id,
    },
    {
      name: "Premium Graphic Tee",
      slug: "premium-graphic-tee",
      description: "Soft fabric with a modern graphic print.",
      price: 29.99,
      images: ["/images/p12-1.jpg", "/images/p12-2.jpg"],
      stock: 30,
      categoryId: tshirts.id,
    },
    {
      name: "Slim Fit Jeans",
      slug: "slim-fit-jeans",
      description: "Modern slim fit jeans with stretch comfort.",
      price: 59.99,
      images: ["/images/p21-1.jpg", "/images/p21-2.jpg"],
      stock: 40,
      categoryId: jeans.id,
    },
    {
      name: "Regular Fit Denim",
      slug: "regular-fit-denim",
      description: "Classic regular fit denim jeans.",
      price: 54.99,
      images: ["/images/p22-1.jpg", "/images/p22-2.jpg"],
      stock: 35,
      categoryId: jeans.id,
    },
    {
      name: "Running Sneakers",
      slug: "running-sneakers",
      description: "Lightweight running shoes with cushioning.",
      price: 89.99,
      images: ["/images/p31-1.jpg", "/images/p31-2.jpg"],
      stock: 25,
      categoryId: shoes.id,
    },
    {
      name: "Casual Loafers",
      slug: "casual-loafers",
      description: "Comfortable casual loafers for daily wear.",
      price: 74.99,
      images: ["/images/p32-1.jpg", "/images/p32-2.jpg"],
      stock: 20,
      categoryId: shoes.id,
    },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log("Created", products.length, "products");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
