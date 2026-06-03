export interface PlanLimits {
  monthlyProspects: number;
  aiCredits: number;
  teamSeats: number;
  campaigns: number;
  integrations: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  limits: PlanLimits;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For individual sales reps getting started",
    priceMonthly: 49,
    priceYearly: 470,
    stripePriceIdMonthly: "price_starter_monthly",
    stripePriceIdYearly: "price_starter_yearly",
    limits: {
      monthlyProspects: 100,
      aiCredits: 200,
      teamSeats: 1,
      campaigns: 5,
      integrations: 1,
    },
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing sales teams",
    priceMonthly: 149,
    priceYearly: 1430,
    stripePriceIdMonthly: "price_growth_monthly",
    stripePriceIdYearly: "price_growth_yearly",
    limits: {
      monthlyProspects: 1000,
      aiCredits: 2000,
      teamSeats: 10,
      campaigns: 25,
      integrations: 3,
    },
  },
  {
    id: "scale",
    name: "Scale",
    description: "For enterprise sales teams",
    priceMonthly: 499,
    priceYearly: 4790,
    stripePriceIdMonthly: "price_scale_monthly",
    stripePriceIdYearly: "price_scale_yearly",
    limits: {
      monthlyProspects: 10000,
      aiCredits: 20000,
      teamSeats: 50,
      campaigns: 100,
      integrations: 10,
    },
  },
];

export function getPlanByName(name: string): Plan | undefined {
  return PLANS.find((p) => p.id === name);
}

export function getPlanLimits(planName: string): PlanLimits {
  const plan = getPlanByName(planName);
  return plan?.limits ?? PLANS[0]!.limits;
}
