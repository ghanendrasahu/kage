import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  return (
    <div>
      <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-foreground">
        Reset your password
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        Enter the email on your KAGE account and we&apos;ll send a link to choose a
        new password.
      </p>

      <form className="mt-6 space-y-4">
        <Field label="Email address" htmlFor="email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              className="pl-8"
            />
          </div>
        </Field>

        <Button type="submit" variant="primary" size="lg" className="w-full">
          Send reset link
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </Link>
    </div>
  );
}
