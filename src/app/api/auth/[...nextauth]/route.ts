import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "ایمیل", type: "email" },
        password: { label: "رمز عبور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            banned: true,
            passwordHash: true,
          },
        });
        if (!user) return null;
        // Block banned users from logging in
        if (user.banned) {
          throw new Error("ACCOUNT_BANNED");
        }
        const ok = await compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as any).id as string;
        token.role = (user as any).role as string;
      }
      // Handle session update (e.g., ending impersonation)
      if (trigger === "update" && (token as any).update) {
        const update = (token as any).update;
        if (update.action === "endImpersonation") {
          // Restore the admin's original identity
          token.id = update.adminId;
          token.role = "ADMIN";
          delete (token as any).impersonating;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        if ((token as any).impersonating) {
          (session.user as any).impersonating = (token as any).impersonating;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me-in-production-roshdgar",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
