import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, users, organizations, organizationMembers } from "@kage/db";
import { hashPassword, validatePasswordStrength } from "@kage/auth";
import { UserRole } from "@kage/shared";
import { eq } from "drizzle-orm";

const signupSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  organizationName: z.string().min(1).max(255),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, organizationName } = parsed.data;

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: "Weak password", details: passwordCheck.errors },
        { status: 400 }
      );
    }

    const db = getDb();

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        password_hash: passwordHash,
        email_verified: new Date(),
      })
      .returning();

    if (!user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const [org] = await db
      .insert(organizations)
      .values({
        name: organizationName,
        slug: `${slug}-${user.id.slice(0, 8)}`,
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

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
