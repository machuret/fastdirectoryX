import NextAuth, { type NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma'; // Assuming prisma client is exported from here
import bcrypt from 'bcryptjs';
import type { Adapter } from 'next-auth/adapters';

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma) as Adapter, // Temporarily commented out
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) { 
        console.log('AUTHORIZE: Attempting login with credentials:', JSON.stringify(credentials, null, 2));

        if (!credentials?.email || !credentials?.password) {
          console.log('AUTHORIZE_ERROR: Missing email or password in credentials.');
          return null;
        }

        try {
          console.log(`AUTHORIZE: Searching for user with email: ${credentials.email}`);
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            console.log(`AUTHORIZE_ERROR: User not found for email: ${credentials.email}`);
            return null;
          }
          console.log('AUTHORIZE: User found in DB:', JSON.stringify(user, null, 2));

          if (!user.password) {
            console.log(`AUTHORIZE_ERROR: User ${credentials.email} found, but password is not set in the database.`);
            return null;
          }

          console.log(`AUTHORIZE: Comparing provided password with stored hash for user: ${user.email}`);
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          console.log(`AUTHORIZE: Password validation result for ${user.email}: ${isValidPassword}`);

          if (!isValidPassword) {
            console.log(`AUTHORIZE_ERROR: Invalid password for user: ${user.email}`);
            return null;
          }

          // Validate status (assuming UserStatus includes 'ACTIVE')
          if (user.status !== 'ACTIVE') {
            console.log(`AUTHORIZE_ERROR: User ${user.email} is not active. Status: ${user.status}`);
            return null;
          }

          // Validate role (assuming UserRole includes 'ADMIN', 'USER' and is non-null for token)
          if (user.role !== 'ADMIN' && user.role !== 'USER') {
            console.log(`AUTHORIZE_ERROR: User ${user.email} has an invalid or null role for session: ${user.role}`);
            return null;
          }

          console.log(`AUTHORIZE: Credentials valid. Returning user object for: ${user.email}`);
          // The returned object's 'status' and 'role' now conform to stricter types
          return {
            id: user.user_id.toString(), 
            name: user.name,
            email: user.email,
            image: user.image,
            status: user.status, // Now guaranteed 'ACTIVE' (which should be a UserStatus)
            role: user.role,     // Now guaranteed 'ADMIN' or 'USER' (which should be a UserRole)
          };
        } catch (error) {
          console.error('AUTHORIZE_EXCEPTION: An exception occurred during the authorization process:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) { 
      // 'user' object comes from 'authorize' and now has conforming status and role
      if (user) {
        token.id = user.id;
        token.status = user.status; // Assign directly, types should match JWT interface in next-auth.d.ts
        token.role = user.role;     // Assign directly, types should match JWT interface in next-auth.d.ts
        token.email = user.email;   // Assign directly, types should match JWT interface in next-auth.d.ts
      }
      return token;
    },
    async session({ session, token }) {
      // If next-auth.d.ts is correctly augmenting Session, these assignments should be type-safe.
      // The persistent errors on these lines indicate session.user is not being seen as augmented.
      if (session.user) { 
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role; 
        session.user.status = token.status; 
        session.user.isAdmin = token.role === 'ADMIN'; 
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    // error: '/auth/error', // Custom error page
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
