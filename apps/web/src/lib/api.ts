import { NextRequest, NextResponse } from "next/server";
import { auth } from "@kage/auth";
import { createAuditLog } from "@kage/db";
import { AuditAction } from "@kage/shared";
import { z } from "zod";

export type ApiContext = {
  userId: string;
  organizationId: string;
  role: string;
};

type AuthenticatedHandler = (request: NextRequest, context: ApiContext) => Promise<NextResponse>;

export function withAuth(
  handler: AuthenticatedHandler
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      const session = await auth();

      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (!session.user.organizationId) {
        return NextResponse.json({ error: "No organization" }, { status: 403 });
      }

      return handler(request, {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        role: session.user.role ?? "",
      });
    } catch (error) {
      console.error("API error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest): Promise<T> => {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      throw new ValidationError(result.error.flatten().fieldErrors);
    }

    return result.data;
  };
}

export class ValidationError extends Error {
  public fieldErrors: Record<string, string[]>;
  
  constructor(fieldErrors: Record<string, string[] | undefined>) {
    super("Validation error");
    this.name = "ValidationError";
    this.fieldErrors = Object.fromEntries(
      Object.entries(fieldErrors).filter((entry): entry is [string, string[]] => entry[1] !== undefined)
    );
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.fieldErrors },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    switch (error.message) {
      case "Unauthorized":
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      case "Forbidden":
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      case "Not found":
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      default:
        console.error("Unhandled error:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
    }
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

/**
 * Audit writes must never take down the action they describe. A failed log is
 * noisy but harmless, so it is reported and swallowed.
 */
export async function recordAudit(
  context: ApiContext,
  action: AuditAction,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await createAuditLog(
      context.organizationId,
      context.userId,
      action,
      resourceType,
      resourceId,
      details
    );
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
