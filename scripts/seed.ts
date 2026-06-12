import { config } from "dotenv";
config({ path: "../.env" });

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import {
  users,
  organizations,
  organizationMembers,
  teams,
  teamMembers,
  prospects,
  campaigns,
  emailTemplates,
} from "../packages/db/src/schema";
import { hashPassword } from "../packages/auth/src/password";
import { UserRole, ProspectStatus, CampaignStatus } from "../packages/shared/src/enums";

async function main() {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const connection = postgres(databaseUrl);
  const db = drizzle(connection);

  console.log("Running migrations...");
  try {
    await migrate(db, { migrationsFolder: "./packages/db/migrations" });
    console.log("Migrations completed");
  } catch (error) {
    console.log("Migration skip (already applied or no changes):", error);
  }

  console.log("Seeding database...");

  const password = await hashPassword("Admin123!");

  const [user] = await db
    .insert(users)
    .values({
      email: "admin@kage.dev",
      name: "Admin User",
      password_hash: password,
      email_verified: new Date(),
    })
    .returning()
    .onConflictDoNothing();

  if (!user) {
    console.log("Admin user already exists, skipping seed");
    await connection.end();
    return;
  }

  const [org] = await db
    .insert(organizations)
    .values({
      name: "KAGE Demo",
      slug: "kage-demo",
    })
    .returning();

  if (org) {
    await db.insert(organizationMembers).values({
      organization_id: org.id,
      user_id: user.id,
      role: UserRole.OWNER,
      joined_at: new Date(),
    });

    const [salesUser] = await db
      .insert(users)
      .values({
        email: "sales@kage.dev",
        name: "Sales Rep",
        password_hash: await hashPassword("Sales123!"),
        email_verified: new Date(),
      })
      .returning()
      .onConflictDoNothing();

    if (salesUser) {
      await db.insert(organizationMembers).values({
        organization_id: org.id,
        user_id: salesUser.id,
        role: UserRole.SALES_REP,
        invited_at: new Date(),
      });

      await db.insert(teams).values({
        organization_id: org.id,
        name: "Enterprise Sales",
        description: "Handles enterprise-level accounts",
      });

      const [team] = await db
        .insert(teams)
        .values({
          organization_id: org.id,
          name: "SMB Sales",
          description: "Handles small and medium businesses",
        })
        .returning();

      if (team) {
        await db.insert(teamMembers).values({
          team_id: team.id,
          user_id: user.id,
          role: UserRole.MANAGER,
        });
        await db.insert(teamMembers).values({
          team_id: team.id,
          user_id: salesUser.id,
          role: UserRole.SALES_REP,
        });
      }
    }

    const sampleProspects = [
      {
        organization_id: org.id,
        company_name: "Acme Corp",
        company_domain: "acme.com",
        person_name: "John Smith",
        person_title: "VP of Engineering",
        email: "john.smith@example.com",
        industry: "Technology",
        company_size: "201-1000",
        status: ProspectStatus.NEW,
        created_by: user.id,
      },
      {
        organization_id: org.id,
        company_name: "TechStart Inc",
        company_domain: "techstart.io",
        person_name: "Sarah Johnson",
        person_title: "CTO",
        email: "sarah.j@example.com",
        industry: "SaaS",
        company_size: "51-200",
        status: ProspectStatus.RESEARCHED,
        created_by: user.id,
      },
    ];

    for (const p of sampleProspects) {
      await db.insert(prospects).values(p);
    }

    await db.insert(campaigns).values({
      organization_id: org.id,
      name: "Q1 Outreach Campaign",
      description: "Targeting tech companies in Series A-B",
      product_service: "AI Sales Platform",
      status: CampaignStatus.ACTIVE,
    });

    await db.insert(emailTemplates).values({
      organization_id: org.id,
      name: "Initial Outreach",
      channel: "EMAIL",
      subject: "Quick question about {{company_name}}",
      body: "Hi {{person_name}},\n\nI noticed {{trigger_event}} at {{company_name}}. We help companies like yours streamline their sales process.\n\nWould you be open to a quick chat?\n\nBest,\n{{sender_name}}",
      variables: ["company_name", "person_name", "trigger_event", "sender_name"],
      is_default: true,
    });

    await db.insert(emailTemplates).values({
      organization_id: org.id,
      name: "LinkedIn Connection Request",
      channel: "LINKEDIN",
      body: "Hi {{person_name}}, I see we're both in the {{industry}} space. I'd love to connect and share insights about how we're helping companies like {{company_name}}.",
      variables: ["person_name", "industry", "company_name"],
      is_default: false,
    });
  }

  console.log("Seed completed successfully");
  console.log("Admin: admin@kage.dev / Admin123!");
  console.log("Sales: sales@kage.dev / Sales123!");
  await connection.end();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
