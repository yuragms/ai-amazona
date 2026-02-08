import NextAuth, { type DefaultSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import type { User } from "@prisma/client"
import bcrypt from "bcryptjs"
import Credentials from "next-auth/providers/credentials"
import authConfig from "./auth.config"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: "USER" | "ADMIN"
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string
    role?: "USER" | "ADMIN"
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  basePath: "/api/auth",
  session: { strategy: "jwt" },
  ...authConfig,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as User).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "USER" | "ADMIN"
        session.user.id = token.id as string
      }
      return session
    },
  },
})
