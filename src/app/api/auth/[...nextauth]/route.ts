// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import path from 'path'

const db = new Database(path.join(process.cwd(), 'data_maturity.db'))

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials: any) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // Check if admin exists in database by username first
          let admin = db.prepare('SELECT * FROM admins WHERE username = ? AND active = 1').get(credentials.username)
          
          // Fallback to email if username not found (for backward compatibility)
          if (!admin) {
            admin = db.prepare('SELECT * FROM admins WHERE email = ? AND active = 1').get(credentials.username)
          }
          
          if (!admin) {
            return null
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, admin.password)
          
          if (!isPasswordValid) {
            return null
          }

          // Update last login
          db.prepare('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(admin.id)

          return {
            id: admin.id.toString(),
            email: admin.email,
            name: admin.name,
            username: admin.username,
            role: 'admin'
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    async session({ session, token }: any) {
      session.user.role = token.role
      session.user.username = token.username
      return session
    }
  },
  pages: {
    signIn: '/admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST, authOptions }