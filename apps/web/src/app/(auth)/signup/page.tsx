"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Lock, Mail, Building2, User } from "lucide-react";

import { useSignup } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading, error } = useSignup();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const googleEnabled = process.env["NEXT_PUBLIC_GOOGLE_AUTH_ENABLED"] === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await signup({ name, email, password, organizationName });
    if (success) {
      await signIn("credentials", { email, password, redirect: false });
      router.push("/dashboard");
    }
  };

  return (
    <div>
      <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-foreground">
        Create your account
      </h2>
      <p className="mt-1.5 text-[13px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:text-brand-strong">
          Sign in
        </Link>
      </p>

      {error ? (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger"
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Full name" htmlFor="name">
          <div className="relative">
            <User className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              className="pl-8"
            />
          </div>
        </Field>

        <Field label="Work email" htmlFor="email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="pl-8"
            />
          </div>
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          hint="8+ chars, upper, lower, number"
        >
          <div className="relative">
            <Lock className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-8"
            />
          </div>
        </Field>

        <Field label="Organization name" htmlFor="organization">
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              id="organization"
              name="organization"
              type="text"
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Acme GTM"
              className="pl-8"
            />
          </div>
        </Field>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      {googleEnabled ? (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-2 text-[11px] uppercase tracking-[0.1em] text-subtle">
                or continue with
              </span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            Google
          </Button>
        </>
      ) : null}
    </div>
  );
}
