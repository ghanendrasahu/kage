import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@kage/db";

export const dynamic = "force-dynamic";

/**
 * Readiness probe: the process is up *and* its dependencies answer.
 *
 * Unlike `/api/health` (liveness), this one touches the database - a
 * container that cannot reach Postgres is not ready to serve traffic.
 */
export async function GET() {
  const checks: { database: string } = { database: "unknown" };
  let ready = true;

  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    checks.database = "up";
  } catch {
    checks.database = "down";
    ready = false;
  }

  return NextResponse.json(
    {
      status: ready ? "ready" : "unavailable",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
