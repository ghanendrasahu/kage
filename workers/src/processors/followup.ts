import { getDb, followUpSteps, followUpSequences, outreachMessages, prospects } from "@kage/db";
import { eq, and, lte } from "drizzle-orm";
import { MessageStatus, ProspectStatus } from "@kage/shared";

export async function processFollowUp(jobData: { organizationId: string; sequenceId: string }) {
  const db = getDb();

  const sequence = await db.query.followUpSequences.findFirst({
    where: eq(followUpSequences.id, jobData.sequenceId),
  });

  if (!sequence) {
    throw new Error(`Follow-up sequence ${jobData.sequenceId} not found`);
  }

  if (sequence.status !== "ACTIVE") {
    return { skipped: true, reason: "Sequence not active" };
  }

  const prospect = await db.query.prospects.findFirst({
    where: eq(prospects.id, sequence.prospect_id),
  });

  if (!prospect || prospect.status === ProspectStatus.REPLIED || prospect.status === ProspectStatus.CLOSED) {
    await db
      .update(followUpSequences)
      .set({ status: "CANCELLED", updated_at: new Date() })
      .where(eq(followUpSequences.id, jobData.sequenceId));
    return { skipped: true, reason: "Prospect replied or closed" };
  }

  const steps = await db.query.followUpSteps.findMany({
    where: and(
      eq(followUpSteps.sequence_id, jobData.sequenceId),
      eq(followUpSteps.status, MessageStatus.DRAFT)
    ),
    orderBy: (fields, { asc }) => [asc(fields.step_number)],
  });

  const now = new Date();
  let sent = 0;

  for (const step of steps) {
    const scheduledTime = new Date(sequence.created_at);
    scheduledTime.setDate(scheduledTime.getDate() + step.delay_days);

    if (now >= scheduledTime) {
      await db
        .update(followUpSteps)
        .set({
          status: MessageStatus.HUMAN_REVIEW,
          sent_at: now,
          updated_at: now,
        })
        .where(eq(followUpSteps.id, step.id));

      sent++;
    }
  }

  return { processed: steps.length, sent };
}
