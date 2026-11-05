import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Command,
  LineChart,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { KageWordmark } from "@/components/ui/logo";

const FEATURES = [
  {
    icon: Search,
    title: "Research every account",
    description:
      "KAGE reads the company, finds the buying signals, and writes a sourced brief before a rep ever opens the thread.",
  },
  {
    icon: Sparkles,
    title: "Draft outreach in your voice",
    description:
      "Email and LinkedIn copy generated from the research, with variants per persona and a human approval gate.",
  },
  {
    icon: CheckCircle2,
    title: "Approve before anything sends",
    description:
      "Every message lands in a review queue. Approve, reject, or edit — nothing leaves the workspace unreviewed.",
  },
  {
    icon: LineChart,
    title: "Measure the real pipeline",
    description:
      "Approval and send rates per campaign, so you can tell whether the offer or the copy is the bottleneck.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Add prospects",
    description: "Import the people and accounts you want to reach.",
    icon: Users,
  },
  {
    step: "02",
    title: "Research accounts",
    description: "AI builds a brief with signals, pains, and angles.",
    icon: Search,
  },
  {
    step: "03",
    title: "Review & send",
    description: "Approve the drafts your team is happy to stand behind.",
    icon: Send,
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 kage-glow" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 kage-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]"
        aria-hidden
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <KageWordmark />
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            Get started
            <ArrowRight />
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-14 text-center sm:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-elevated/80 px-3 py-1 text-[11px] font-medium text-muted">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            Research → draft → approve → send
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-6xl">
            Cold outreach that earns
            <span className="bg-[linear-gradient(92deg,var(--color-brand-strong),var(--color-brand)_55%,#6d5ae6)] bg-clip-text text-transparent">
              {" "}
              the reply
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-balance text-[15px] leading-relaxed text-muted sm:text-base">
            KAGE researches each account, writes the first touch, and keeps a human
            in the loop. A focused outreach workspace for teams that would rather
            send ten good messages than a thousand forgettable ones.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Start free
              <ArrowRight />
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              <Command />
              Explore the dashboard
            </Link>
          </div>

          <p className="mt-4 text-[11px] text-subtle">
            Demo workspace: admin@kage.dev · Admin123!
          </p>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6">
          <div className="relative rounded-2xl border border-line bg-surface/80 p-2 shadow-pop backdrop-blur">
            <div className="rounded-xl border border-line bg-background">
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="size-2.5 rounded-full bg-line-strong" />
                  <span className="size-2.5 rounded-full bg-line-strong" />
                  <span className="size-2.5 rounded-full bg-line-strong" />
                </span>
                <span className="ml-3 flex-1 truncate rounded-md border border-line bg-elevated px-2 py-1 text-[11px] text-subtle">
                  app.kage.dev/dashboard
                </span>
                <span className="hidden items-center gap-1 rounded border border-line-strong bg-surface px-1.5 py-0.5 font-mono text-[10px] text-subtle sm:flex">
                  ⌘K
                </span>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-4">
                {[
                  { label: "Prospects researched", value: "128", tone: "text-brand" },
                  { label: "Messages generated", value: "412", tone: "text-info" },
                  { label: "Messages approved", value: "286", tone: "text-success" },
                  { label: "Messages sent", value: "241", tone: "text-warning" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-lg border border-line bg-surface p-3 text-left"
                  >
                    <p className="text-[10px] text-muted">{card.label}</p>
                    <p className={`mt-1 text-xl font-semibold tabular-nums ${card.tone}`}>
                      {card.value}
                    </p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-elevated">
                      <div className="h-full w-2/3 rounded-full bg-current opacity-60" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 border-t border-line p-4 lg:grid-cols-3">
                <div className="rounded-lg border border-line bg-surface p-4 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground">Campaign performance</p>
                    <span className="rounded-md border border-line bg-elevated px-2 py-0.5 text-[10px] text-muted">
                      All · Active · Completed
                    </span>
                  </div>
                  <div className="mt-5 flex h-24 items-end gap-1.5">
                    {[38, 52, 44, 66, 58, 78, 72, 90, 64, 82, 76, 96].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-sm bg-[linear-gradient(180deg,var(--color-brand),rgba(139,124,255,0.18))]"
                          style={{ height: `${height}%`, opacity: 0.35 + index * 0.05 }}
                        />
                      )
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-line bg-surface p-4">
                  <p className="text-xs font-medium text-foreground">Recent activity</p>
                  <ul className="mt-3 space-y-3">
                    {[
                      "Account research completed",
                      "3 emails approved",
                      "Campaign activated",
                    ].map((item, index) => (
                      <li key={item} className="flex items-center gap-2 text-[11px] text-muted">
                        <span
                          className={`size-1.5 rounded-full ${index === 1 ? "bg-success" : "bg-brand"}`}
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-card border border-line bg-surface/60 p-6 transition-colors hover:border-line-strong"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg border border-brand/25 bg-brand-soft text-brand">
                    <Icon className="size-4" />
                  </span>
                  <h2 className="mt-4 text-sm font-semibold text-foreground">
                    {feature.title}
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-t border-line bg-surface/40">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-subtle">
              How a message happens
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {STEPS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="rounded-card border border-line bg-surface p-6">
                    <div className="flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-lg border border-line bg-elevated text-muted">
                        <Icon className="size-4" />
                      </span>
                      <span className="font-mono text-[11px] text-subtle">{item.step}</span>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-[11px] text-subtle sm:flex-row">
          <span>© {new Date().getFullYear()} KAGE. Built for thoughtful outreach.</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link href="/signup" className="transition-colors hover:text-foreground">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
