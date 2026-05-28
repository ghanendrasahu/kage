import NextAuth from "next-auth";
import type { NextAuthResult } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb, users, organizations, organizationMembers } from "@kage/db";
import { UserRole } from "@kage/shared";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      organizationId?: string;
      role?: UserRole;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string | null;
  }
}

declare module "next-auth" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    organizationId?: string;
    role?: UserRole;
  }
}

const nextAuthResult: NextAuthResult = NextAuth({
  adapter: DrizzleAdapter(getDb()) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env["GOOGLE_CLIENT_ID"]!,
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"]!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const db = getDb();
        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user || !user.password_hash) {
          return null;
        }

        if (!user.email_verified) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token["id"] = user.id;
        token["email"] = user.email;
        token["name"] = user.name;

        const db = getDb();
        const membership = await db.query.organizationMembers.findFirst({
          where: eq(organizationMembers.user_id, user.id),
        });

        if (membership) {
          token["organizationId"] = membership.organization_id;
          token["role"] = membership.role as UserRole;
        }
      }

      if (trigger === "update" && token["id"]) {
        const db = getDb();
        const userId = token["id"] as string;
        const membership = await db.query.organizationMembers.findFirst({
          where: eq(organizationMembers.user_id, userId),
        });

        if (membership) {
          token["organizationId"] = membership.organization_id;
          token["role"] = membership.role as UserRole;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token["id"] as string;
        session.user.email = token["email"] as string;
        session.user.name = token["name"] as string;
        session.user.organizationId = token["organizationId"] as string | undefined;
        session.user.role = token["role"] as UserRole | undefined;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return;

      const db = getDb();
      const orgSlug = `org-${user.id.slice(0, 8)}`;

      const [org] = await db
        .insert(organizations)
        .values({
          name: `${user.name}'s Organization`,
          slug: orgSlug,
        })
        .returning();

      if (org) {
        await db.insert(organizationMembers).values({
          organization_id: org.id,
          user_id: user.id,
          role: UserRole.OWNER,
          joined_at: new Date(),
        });
      }
    },
  },
});

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireOrganization() {
  const user = await requireAuth();
  if (!user.organizationId) {
    throw new Error("No organization found");
  }
  return {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role!,
  };
}

export const { handlers, signIn, signOut, auth } = nextAuthResult;
