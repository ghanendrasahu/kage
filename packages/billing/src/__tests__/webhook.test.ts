import type Stripe from "stripe";
import { describe, expect, it } from "vitest";

import { determinePlanName, mapStripeStatus } from "../webhook";

describe("mapStripeStatus", () => {
  it("maps the active states", () => {
    expect(mapStripeStatus("active")).toBe("ACTIVE");
    expect(mapStripeStatus("trialing")).toBe("TRIALING");
  });

  it("maps the delinquent states", () => {
    expect(mapStripeStatus("past_due")).toBe("PAST_DUE");
  });

  it("maps every terminal state to CANCELLED", () => {
    expect(mapStripeStatus("canceled")).toBe("CANCELLED");
    expect(mapStripeStatus("unpaid")).toBe("CANCELLED");
  });

  it("falls back to ACTIVE for an unknown status", () => {
    expect(mapStripeStatus("something_new")).toBe("ACTIVE");
    expect(mapStripeStatus("")).toBe("ACTIVE");
  });
});

describe("determinePlanName", () => {
  const subscription = (priceId: string | undefined): Stripe.Subscription =>
    ({
      items: {
        data: priceId ? [{ price: { id: priceId } }] : [],
      },
    }) as unknown as Stripe.Subscription;

  it("defaults to starter without line items", () => {
    expect(determinePlanName(subscription(undefined))).toBe("starter");
  });

  it("detects the scale plan", () => {
    expect(determinePlanName(subscription("price_scale_monthly"))).toBe("scale");
  });

  it("detects the growth plan", () => {
    expect(determinePlanName(subscription("price_growth_yearly"))).toBe("growth");
  });

  it("falls back to starter for an unknown price", () => {
    expect(determinePlanName(subscription("price_enterprise_2024"))).toBe("starter");
  });
});
