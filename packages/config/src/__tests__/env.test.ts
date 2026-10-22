import { afterEach, describe, expect, it, vi } from "vitest";

import { validateEnv } from "../env";

const VALID_ENV: Record<string, string> = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/kage",
  REDIS_URL: "redis://localhost:6379",
  AUTH_SECRET: "a".repeat(32),
  ENCRYPTION_KEY: "b".repeat(32),
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  OPENAI_API_KEY: "sk-test",
  STRIPE_SECRET_KEY: "sk_test",
  STRIPE_WEBHOOK_SECRET: "whsec_test",
  NEXT_PUBLIC_APP_URL: "https://app.example.com",
  NEXT_PUBLIC_API_URL: "https://api.example.com",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
};

const ORIGINAL_ENV = { ...process.env };

function setEnv(overrides: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("validateEnv", () => {
  it("accepts a complete environment", () => {
    setEnv(VALID_ENV);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    validateEnv();

    expect(error).not.toHaveBeenCalled();
  });

  it("reports a missing required variable", () => {
    setEnv({ ...VALID_ENV, AUTH_SECRET: undefined });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    validateEnv();

    expect(error).toHaveBeenCalled();
    const [message] = error.mock.calls[0] as [string];
    expect(message).toContain("Invalid server environment variables");
  });

  it("reports a secret that is too short", () => {
    setEnv({ ...VALID_ENV, ENCRYPTION_KEY: "too-short" });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    validateEnv();

    expect(error).toHaveBeenCalled();
  });

  it("reports a malformed url", () => {
    setEnv({ ...VALID_ENV, DATABASE_URL: "not-a-url" });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    validateEnv();

    expect(error).toHaveBeenCalled();
  });

  it("does not exit outside production", () => {
    setEnv({ ...VALID_ENV, AUTH_SECRET: undefined, NODE_ENV: "development" });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);

    validateEnv();

    expect(exit).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
  });
});
