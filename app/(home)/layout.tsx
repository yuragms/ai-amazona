import { auth } from "@/auth"
import { getCartCount } from "@/app/actions/cart"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default async function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth()
  const cartCount = session?.user ? await getCartCount() : 0

  return (
    <div className="flex min-h-screen flex-col">
      <Header cartCount={cartCount} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
