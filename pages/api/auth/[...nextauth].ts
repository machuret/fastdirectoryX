import NextAuth, { NextAuthOptions, User as NextAuthUser, Session as NextAuthSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma'; 
import bcrypt from 'bcryptjs';
import type { Adapter } from 'next-auth/adapters';
import { JWT } from 'next-auth/jwt'; 
import { UserRole, UserStatus } from '@prisma/client'; // Import Prisma enums

// Define a type for the user object returned by the authorize callback
interface AuthorizeUser { // This should precisely match the object returned by your authorize function
  id: string;
  name?: string | null; // authorize returns name
  email?: string | null; // authorize returns email
  image?: string | null; // authorize returns image
  status: UserStatus; // authorize returns status (UserStatus enum)
  role: UserRole;   // authorize returns role (UserRole enum)
}

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
    async jwt({ token, user }: { token: JWT; user?: AuthorizeUser }) { 
      if (user) {
        token.id = user.id;
        token.name = user.name; // Pass name to token
        token.email = user.email; // Pass email to token
        token.image = user.image; // Pass image to token
        token.status = user.status; // Now UserStatus from AuthorizeUser
        token.role = user.role;     // Now UserRole from AuthorizeUser
      }
      return token;
    },
    async session({ session, token }: { session: NextAuthSession; token: JWT }) {
      if (session.user) { 
        // Assign from token to session.user, types should align with next-auth.d.ts
        session.user.id = token.id as string; // JWT 'id' is string | undefined from our types
        // session.user.name = token.name; // DefaultSession user has name, JWT has name
        // session.user.email = token.email; // DefaultSession user has email, JWT has email
        // session.user.image = token.image; // DefaultSession user has image, JWT has image
        
        // Custom properties from JWT (populated from AuthorizeUser)
        // These should align with the Session['user'] augmentation in next-auth.d.ts
        if (token.role) session.user.role = token.role as UserRole; // token.role is UserRole | undefined
        if (token.status) session.user.status = token.status as UserStatus; // token.status is UserStatus | undefined
        session.user.isAdmin = token.role === UserRole.ADMIN; 
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
