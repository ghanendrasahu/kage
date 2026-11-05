import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import { KageWordmark } from "@/components/ui/logo";

const HIGHLIGHTS = [
  {
    icon: Sparkles,
    title: "Research that reads like a brief",
    description: "Signals, pain points and angles for every account, sourced and summarised.",
  },
  {
    icon: ShieldCheck,
    title: "Human approval by default",
    description: "Nothing sends until someone on your team says yes.",
  },
  {
    icon: CheckCircle2,
    title: "One workspace for the whole motion",
    description: "Prospects, campaigns, outreach and research in the same place.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-line bg-surface p-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 kage-glow opacity-80"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 kage-grid opacity-25 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]"
          aria-hidden
        />

        <div className="relative">
          <Link href="/" className="inline-flex rounded-lg focus-visible:outline-none">
            <KageWordmark />
          </Link>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-[-0.03em] text-foreground">
            The outreach workspace for teams that care about the reply.
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            KAGE handles the research and the first draft. You keep the judgement,
            the voice, and the final say.
          </p>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated text-brand">
                    <Icon className="size-3.5" />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                      {item.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-[11px] text-subtle">
          © {new Date().getFullYear()} KAGE · AI cold outreach platform
        </p>
      </aside>

      <main className="relative flex w-full flex-col lg:w-[54%]">
        <div className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Link href="/" className="inline-flex rounded-lg focus-visible:outline-none">
            <KageWordmark />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-[400px]">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-1.5 text-[12px] font-medium text-subtle transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back to home
            </Link>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
