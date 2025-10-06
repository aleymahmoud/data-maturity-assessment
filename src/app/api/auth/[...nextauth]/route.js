import bcrypt from 'bcryptjs'
import { openDatabase } from '../../../../lib/database.js'
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

        let connection
        try {
          const pool = await openDatabase()
          connection = await pool.getConnection()

          const [rows] = await connection.execute(
            'SELECT * FROM admin_users WHERE username = ? AND is_active = 1',
            [credentials.username]
          )

          if (rows.length === 0) {
            return null
          }

          const user = rows[0]
          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash)

          if (!isValidPassword) {
            return null
          }

          await connection.execute(
            'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
          )

          return {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            email: user.email,
            role: user.role
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        } finally {
          if (connection) {
            connection.release()
          }
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

export { handler as GET, handler as POST }