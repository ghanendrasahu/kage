FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/auth/package.json ./packages/auth/
COPY packages/ai/package.json ./packages/ai/
COPY packages/research/package.json ./packages/research/
COPY packages/gmail/package.json ./packages/gmail/
COPY packages/queue/package.json ./packages/queue/
COPY packages/billing/package.json ./packages/billing/
COPY packages/security/package.json ./packages/security/

RUN npm ci

# Next.js collects page data at build time, which imports route modules that
# eagerly initialize the database/queue. CI does the same with placeholders
# (see .github/workflows ci.yml build job). Values here must stay dummies -
# real configuration is provided at run time through Space secrets.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build \
    REDIS_URL=redis://localhost:6379/0 \
    AUTH_SECRET=build-time-placeholder-secret-32-bytes \
    ENCRYPTION_KEY=build-time-placeholder-key--32-bytes \
    GOOGLE_CLIENT_ID=build-placeholder \
    GOOGLE_CLIENT_SECRET=build-placeholder \
    OPENAI_API_KEY=build-placeholder \
    STRIPE_SECRET_KEY=build-placeholder \
    STRIPE_WEBHOOK_SECRET=build-placeholder \
    NEXT_PUBLIC_APP_URL=http://localhost:3000 \
    NEXT_PUBLIC_API_URL=http://localhost:3000 \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=build-placeholder

COPY apps/web/ ./apps/web/
COPY packages/ ./packages/

RUN npm run build --workspace=apps/web

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=base /app/apps/web/.next/standalone ./
COPY --from=base /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=base /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "apps/web/server.js"]
