// src/types/next-auth.d.ts
import NextAuth from 'next-auth'
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      role: string
      profileImage?: string
      firstName?: string
      lastName?: string
    } & DefaultSession["user"]
  }

  interface User {
    username: string
    role: string
    profileImage?: string
    firstName?: string
    lastName?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username: string
    role: string
  }
}