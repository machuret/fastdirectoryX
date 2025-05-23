import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';
import { UserRole, UserStatus } from '@prisma/client';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      status?: UserStatus;
      role?: UserRole;
      isAdmin?: boolean;
    } & DefaultSession['user']; 
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   * Also the shape of the user object returned by the `authorize` callback from credentials provider.
   */
  interface User extends DefaultUser {
    id: string;
    status?: UserStatus;
    role?: UserRole;
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    id?: string;
    status?: UserStatus;
    role?: UserRole;
  }
}
