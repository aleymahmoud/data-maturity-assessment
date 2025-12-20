import bcrypt from 'bcryptjs'
import prisma from '../../../../lib/prisma.js'
import NextAuth from 'next-auth'

const authOptions = {
  providers: [
    {
      id: 'credentials',
      name: 'credentials',
      type: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.admin.findUnique({
            where: { username: credentials.username }
          })

          if (!user) {
            return null
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash)

          if (!isValidPassword) {
            return null
          }

          // Update last login (using updatedAt)
          await prisma.admin.update({
            where: { id: user.id },
            data: { updatedAt: new Date() }
          })

          return {
            id: user.id,
            username: user.username,
            fullName: user.username,
            email: user.email,
            role: user.role
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    }
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.fullName = user.fullName
        token.email = user.email
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        username: token.username,
        fullName: token.fullName,
        email: token.email,
        role: token.role
      }
      return session
    }
  },
  pages: {
    signIn: '/admin/login'
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here'
}

const handler = NextAuth.default ? NextAuth.default(authOptions) : NextAuth(authOptions)

export { handler as GET, handler as POST, authOptions }
