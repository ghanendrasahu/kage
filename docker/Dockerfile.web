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
