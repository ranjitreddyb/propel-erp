import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const { data } = await axios.post(`${API_URL}/api/v1/auth/login`, {
            email:    credentials.email,
            password: credentials.password,
          });
          if (data.success && data.token) {
            return {
              id:          data.user.id,
              email:       data.user.email,
              name:        `${data.user.firstName} ${data.user.lastName || ''}`.trim(),
              accessToken: data.token,
              company:     data.company,
              companies:   data.companies,
            };
          }
          return null;
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })
            ?.response?.data?.message || 'Login failed';
          throw new Error(msg);
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken: string }).accessToken;
        token.company     = (user as { company: unknown }).company;
        token.companies   = (user as { companies: unknown }).companies;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.company     = token.company as object;
      session.companies   = token.companies as object[];
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    error:  '/auth/login',
  },

  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
