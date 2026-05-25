import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  OPENAI_API_KEY: z.string().min(1),
  OPENAI_ORG_ID: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  SENTRY_DSN: z.string().url().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

const buildEnv = () => {
  if (typeof window !== "undefined") {
    return clientSchema.parse(process.env);
  }
  return serverSchema.parse(process.env);
};

let _serverEnv: z.infer<typeof serverSchema> | null = null;
let _clientEnv: z.infer<typeof clientSchema> | null = null;

export function getServerEnv(): z.infer<typeof serverSchema> {
  if (!_serverEnv) {
    _serverEnv = serverSchema.parse(process.env);
  }
  return _serverEnv;
}

export function getClientEnv(): z.infer<typeof clientSchema> {
  if (!_clientEnv) {
    _clientEnv = clientSchema.parse(process.env);
  }
  return _clientEnv;
}

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

export function validateEnv(): void {
  const serverResult = serverSchema.safeParse(process.env);
  const clientResult = clientSchema.safeParse(process.env);

  if (!serverResult.success) {
    console.error("Invalid server environment variables:");
    console.error(serverResult.error.flatten().fieldErrors);
    if (process.env["NODE_ENV"] === "production") {
      process.exit(1);
    }
  }

  if (!clientResult.success) {
    console.error("Invalid client environment variables:");
    console.error(clientResult.error.flatten().fieldErrors);
    if (process.env["NODE_ENV"] === "production") {
      process.exit(1);
    }
  }
}
