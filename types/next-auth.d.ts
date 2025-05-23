import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";
import { UserRole, UserStatus } from "@prisma/client"; // Assuming your enums are here

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: UserStatus;
      isAdmin?: boolean;
    } & DefaultSession["user"]; // Merge with default user properties (name, email, image)
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    role: UserRole;
    status: UserStatus;
    isAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    status: UserStatus;
    isAdmin?: boolean;
  }
}
