"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Lock, Mail } from "lucide-react";

import { useAuth } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export default function LoginPage() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const googleEnabled = process.env["NEXT_PUBLIC_GOOGLE_AUTH_ENABLED"] === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await loginWithEmail(email, password);
    if (result?.error) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div>
      <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-foreground">
        Sign in to KAGE
      </h2>
      <p className="mt-1.5 text-[13px] text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-brand hover:text-brand-strong">
          Create one
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
        <Field label="Email address" htmlFor="email">
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

        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-8"
            />
          </div>
        </Field>

        <div className="flex items-center justify-between">
          <Link
            href="/forgot-password"
            className="text-[12px] font-medium text-muted transition-colors hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>

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
              Signing in…
            </>
          ) : (
            "Sign in"
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
            onClick={() => loginWithGoogle("/dashboard")}
          >
            Google
          </Button>
        </>
      ) : null}

      <div className="mt-6 rounded-lg border border-line bg-elevated/60 px-3 py-2.5 text-[11px] leading-relaxed text-subtle">
        Demo workspace:{" "}
        <span className="font-medium text-muted">admin@kage.dev</span> /{" "}
        <span className="font-medium text-muted">Admin123!</span>
      </div>
    </div>
  );
}
