import { NextResponse } from "next/server"
import { auth } from "@/auth"

const loginUrl = "/login"

export default auth((req) => {
  const { nextUrl } = req
  const pathname = nextUrl.pathname
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const url = new URL(loginUrl, nextUrl.origin)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl.origin))
    }
  }

  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const url = new URL(loginUrl, nextUrl.origin)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
