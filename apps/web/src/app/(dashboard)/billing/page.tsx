"use client";

import { useState, useEffect } from "react";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  current_period_end: string;
}

const PLANS = [
  {
    name: "Starter",
    price: "$49/mo",
    features: ["100 prospects", "50 research reports", "25 outreach emails", "1 user"],
    planKey: "starter",
  },
  {
    name: "Growth",
    price: "$149/mo",
    features: ["500 prospects", "250 research reports", "150 outreach emails", "3 users"],
    planKey: "growth",
  },
  {
    name: "Scale",
    price: "$399/mo",
    features: [
      "Unlimited prospects",
      "Unlimited research",
      "Unlimited emails",
      "Unlimited users",
    ],
    planKey: "scale",
  },
];

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/billing/subscription");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription ?? null);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoading(false);
    }
  }

  async function upgradePlan(planKey: string) {
    setUpgrading(planKey);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to upgrade:", error);
      setUpgrading(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Billing</h1>

      {loading ? (
        <div className="mt-6 text-sm text-gray-500">Loading...</div>
      ) : (
        <>
          {subscription && (
            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
              <h2 className="text-lg font-medium text-gray-900">Current Plan</h2>
              <div className="mt-4 flex items-center gap-4">
                <span className="text-2xl font-bold text-indigo-600">
                  {subscription.plan.toUpperCase()}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    subscription.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {subscription.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Current period ends:{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.planKey}
                className={`rounded-lg border-2 bg-white p-6 shadow ${
                  subscription?.plan === plan.planKey
                    ? "border-indigo-500"
                    : "border-gray-200"
                }`}
              >
                <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">{plan.price}</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => upgradePlan(plan.planKey)}
                  disabled={upgrading === plan.planKey || subscription?.plan === plan.planKey}
                  className={`mt-6 w-full rounded-md px-4 py-2 text-sm font-medium ${
                    subscription?.plan === plan.planKey
                      ? "bg-gray-100 text-gray-500"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  } disabled:opacity-50`}
                >
                  {subscription?.plan === plan.planKey
                    ? "Current Plan"
                    : upgrading === plan.planKey
                      ? "Upgrading..."
                      : "Upgrade"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
