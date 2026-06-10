import { Job } from "bullmq";
import { BaseWorker, type JobData, type JobResult } from "@kage/queue";
import { getDb, outreachMessages, gmailAccounts } from "@kage/db";
import { eq, and } from "drizzle-orm";
import { GmailService } from "@kage/gmail";
import { MessageStatus } from "@kage/shared";
import { createIdempotencyKey } from "@kage/shared";

export class SendEmailWorker extends BaseWorker {
  private gmailService: GmailService;

  constructor() {
    super({ queueName: "send-email", concurrency: 1 });
    this.gmailService = new GmailService();
  }

  async process(job: Job<JobData>): Promise<JobResult> {
    if (job.name !== "send_email") {
      return { success: false, error: `Unknown job type: ${job.name}` };
    }

    const { organizationId, messageId, gmailAccountId } = job.data as {
      organizationId: string;
      messageId: string;
      gmailAccountId: string;
    };

    const db = getDb();

    try {
      const [existingMessage] = await db
        .select()
        .from(outreachMessages)
        .where(
          and(
            eq(outreachMessages.id, messageId),
            eq(outreachMessages.organization_id, organizationId)
          )
        )
        .limit(1);

      if (!existingMessage) {
        return { success: false, error: "Message not found" };
      }

      if (existingMessage.status !== MessageStatus.APPROVED) {
        return { success: false, error: "Message must be approved before sending" };
      }

      if (!existingMessage.email) {
        return { success: false, error: "No recipient email address" };
      }

      const [gmailAccount] = await db
        .select()
        .from(gmailAccounts)
        .where(
          and(
            eq(gmailAccounts.id, gmailAccountId),
            eq(gmailAccounts.user_id, existingMessage.sent_by ?? "")
          )
        )
        .limit(1);

      if (!gmailAccount) {
        return { success: false, error: "Gmail account not found" };
      }

      if (!gmailAccount.access_token_encrypted || !gmailAccount.refresh_token_encrypted) {
        return { success: false, error: "Gmail tokens not available" };
      }

      const idempotencyKey = createIdempotencyKey("email", messageId, existingMessage.id);

      const [existingUpdate] = await db
        .select()
        .from(outreachMessages)
        .where(eq(outreachMessages.idempotency_key, idempotencyKey))
        .limit(1);

      if (existingUpdate) {
        return { success: true, data: { messageId: existingMessage.id, skipped: true } };
      }

      const result = await this.gmailService.sendEmail({
        accessTokenEncrypted: gmailAccount.access_token_encrypted,
        refreshTokenEncrypted: gmailAccount.refresh_token_encrypted,
        to: existingMessage.email,
        subject: existingMessage.subject ?? "",
        body: existingMessage.body,
        idempotencyKey,
      });

      if (result.success) {
        await db
          .update(outreachMessages)
          .set({
            status: MessageStatus.SENT,
            sent_at: new Date(),
            idempotency_key: idempotencyKey,
            send_result: { messageId: result.messageId } as any,
            updated_at: new Date(),
          })
          .where(eq(outreachMessages.id, messageId));
      } else {
        await db
          .update(outreachMessages)
          .set({
            send_result: { error: result.error } as any,
            updated_at: new Date(),
          })
          .where(eq(outreachMessages.id, messageId));

        return { success: false, error: result.error };
      }

      return {
        success: true,
        data: { messageId: result.messageId },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: message };
    }
  }
}
