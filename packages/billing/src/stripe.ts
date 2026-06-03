import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env["STRIPE_SECRET_KEY"];
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    _stripe = new Stripe(secretKey);
  }
  return _stripe;
}

export class StripeService {
  async createCustomer(params: {
    email: string;
    name: string;
    organizationId: string;
  }): Promise<Stripe.Customer> {
    const stripe = getStripe();
    return stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        organizationId: params.organizationId,
      },
    });
  }

  async createSubscription(params: {
    customerId: string;
    priceId: string;
    trialDays?: number;
  }): Promise<Stripe.Subscription> {
    const stripe = getStripe();
    return stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      trial_period_days: params.trialDays ?? 14,
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const stripe = getStripe();
    return stripe.subscriptions.cancel(subscriptionId);
  }

  async createPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    const stripe = getStripe();
    return stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });
  }

  async constructWebhookEvent(
    payload: Buffer,
    signature: string
  ): Promise<Stripe.Event> {
    const stripe = getStripe();
    const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is required");
    }
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
