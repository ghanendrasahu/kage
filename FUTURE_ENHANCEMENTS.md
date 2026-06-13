# KAGE - Future Enhancements

Track improvements and technical debt here. Check items off as they're completed.

---

## P0: Critical (Fix Before Production)

- [ ] **OAuth CSRF protection** - Add Redis-backed nonce validation for Gmail and LinkedIn OAuth callbacks
  - File: `apps/web/src/app/api/integrations/*/callback/route.ts`
  - Risk: Account takeover via forged callback URLs

- [ ] **Encrypt LinkedIn access tokens** - Use existing `encrypt()` from `@kage/security` to store tokens encrypted in DB
  - File: `apps/web/src/app/api/integrations/linkedin/callback/route.ts`
  - Risk: Credential exposure in database

- [ ] **Remove default secrets from docker-compose** - Fail fast if env vars are missing instead of falling back to published defaults
  - File: `docker/docker-compose.yml`
  - Risk: Production breach with known credentials

- [ ] **Add `output: "standalone"` to next.config.ts** - Required for Docker builds to work correctly
  - File: `apps/web/next.config.ts`
  - Risk: Docker build produces incomplete output

---

## P1: High Priority

- [ ] **Rate limiting on all API endpoints** - Apply `RateLimiter` to signup, research, and outreach endpoints
  - Files: `apps/web/src/app/api/**/*.ts`
  - Impact: Abuse prevention, cost control

- [ ] **AI response caching** - LRU cache with 1-24hr TTL for identical prompts
  - File: `packages/ai/src/providers/openai.ts`
  - Impact: Reduce OpenAI costs by 30-50%

- [ ] **Redis-backed rate limiter** - Replace in-memory Map with Redis for multi-replica support
  - File: `packages/security/src/rate-limit.ts`
  - Impact: Rate limits bypassed in production

- [ ] **Dead letter queue for failed jobs** - Move permanently failed jobs to DLQ for manual review
  - Files: `workers/src/processors/*.ts`
  - Impact: Silent job loss on failures

- [ ] **Composite DB index on jobs(status, scheduled_at)** - Optimize BullMQ polling queries
  - File: `packages/db/src/schema.ts`
  - Impact: Slow job polling at scale

---

## P2: Medium Priority

- [ ] **Structured logging** - Add pino with correlation IDs (job ID, org ID, user ID)
  - Files: `workers/src/index.ts`, `apps/web/src/app/api/**/*.ts`
  - Impact: No observability in production

- [ ] **Worker health check endpoints** - Add HTTP health check for Docker/Kubernetes probes
  - File: `workers/src/index.ts`
  - Impact: No monitoring for worker liveness

- [ ] **Exponential backoff with jitter for AI retries** - Respect OpenAI Retry-After header
  - File: `packages/ai/src/agents/base.ts`
  - Impact: Rate limit failures on retries

- [ ] **Token budget guard per organization** - Check usage vs plan limits before AI calls
  - File: `packages/ai/src/agents/base.ts`
  - Impact: Cost overruns on AI usage

- [ ] **Token-based content truncation** - Use tiktoken instead of char-based truncation
  - File: `packages/ai/src/agents/researcher.ts`
  - Impact: Context overflow or under-utilization

- [ ] **CSP nonce + HSTS headers** - Add security headers for OAuth and Stripe
  - File: `apps/web/next.config.ts`
  - Impact: Security gap

- [ ] **Input sanitization/XSS protection** - Sanitize user-generated content before rendering
  - File: `packages/security/`
  - Impact: XSS risk

- [ ] **Redis authentication in docker-compose** - Add requirepass for queue security
  - File: `docker/docker-compose.yml`
  - Impact: Unauthorized access to job queue

---

## P3: Low Priority

- [ ] **Docker build test in CI** - Build Docker images to catch broken Dockerfiles
  - File: `.github/workflows/ci.yml`
  - Impact: Broken Dockerfile caught only in deployment

- [ ] **npm audit in CI pipeline** - Scan for vulnerable dependencies
  - File: `.github/workflows/ci.yml`
  - Impact: Vulnerable deps in production

- [ ] **Test coverage reporting** - Add --coverage and upload to Codecov
  - File: `.github/workflows/ci.yml`
  - Impact: No visibility into test coverage

- [ ] **Docker resource limits** - Add mem_limit and cpus to services
  - File: `docker/docker-compose.yml`
  - Impact: Resource exhaustion

- [ ] **Prompt A/B testing** - Store prompts in DB for versioning and rollback
  - File: `packages/ai/src/prompts/manager.ts`
  - Impact: No prompt optimization capability

- [ ] **GitHub branch protection rules** - Require PR, reviews, status checks for main
  - Impact: Code quality enforcement

---

## P4: Nice to Have

- [ ] **WebSocket for real-time job progress** - Show research/outreach generation progress in UI
- [ ] **Multi-language email templates** - Support for i18n in outreach messages
- [ ] **A/B testing for outreach messages** - Track open/reply rates per variant
- [ ] **Advanced analytics dashboard** - Conversion funnel, response rates, ROI metrics
- [ ] **CRM integrations** - HubSpot, Salesforce, Pipedrive sync
- [ ] **Phone/SMS outreach channel** - Twilio integration for multi-channel sequences
- [ ] **AI prompt optimization** - Use feedback loops to improve prompt quality
- [ ] **Prospect enrichment** - Clearbit/Apollo integration for auto-enrichment
- [ ] **Custom domain for email sending** - SPF/DKIM/DMARC setup for deliverability
- [ ] **Team performance metrics** - Track rep-level activity and success rates

---

## Completed

- [x] Monorepo setup with Turborepo
- [x] Database schema with Drizzle ORM
- [x] Authentication with NextAuth v5
- [x] RBAC with 5 roles
- [x] SSRF protection
- [x] AI agent pipeline (7 agents)
- [x] Gmail OAuth integration
- [x] LinkedIn OAuth integration
- [x] Stripe billing integration
- [x] Docker configuration
- [x] CI/CD pipeline
- [x] Unit tests for security package
- [x] Full frontend (16 pages)
- [x] Full API (18 endpoints)
