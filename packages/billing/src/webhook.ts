import type Stripe from "stripe";
import { getDb, subscriptions } from "@kage/db";
import { eq } from "drizzle-orm";

export async function handleWebhook(event: Stripe.Event): Promise<void> {
  const db = getDb();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const existing = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripe_subscription_id, subscription.id),
      });

      const status = mapStripeStatus(subscription.status);

      if (existing) {
        await db
          .update(subscriptions)
          .set({
            status,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            updated_at: new Date(),
          })
          .where(eq(subscriptions.id, existing.id));
      } else {
        const metadata = subscription.metadata as Record<string, string>;
        const organizationId = metadata["organizationId"];

        if (organizationId) {
          await db.insert(subscriptions).values({
            organization_id: organizationId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            plan_name: determinePlanName(subscription),
            status,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
          });
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      await db
        .update(subscriptions)
        .set({
          status: "CANCELLED",
          cancelled_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(subscriptions.stripe_subscription_id, subscription.id));
      break;
    }

    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      break;
    }
  }
}

function mapStripeStatus(
  status: string
): "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIALING" {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
      return "CANCELLED";
    case "trialing":
      return "TRIALING";
    default:
      return "ACTIVE";
  }
}

function determinePlanName(subscription: Stripe.Subscription): string {
  const items = subscription.items.data;
  if (items.length === 0) return "starter";

  const priceId = items[0]?.price?.id ?? "";
  if (priceId.includes("scale")) return "scale";
  if (priceId.includes("growth")) return "growth";
  return "starter";
}
