# KAGE - AI Cold Outreach Platform

An AI-powered sales research and outreach copilot for B2B sales teams. Multi-agent architecture with human-in-the-loop approval, Gmail integration, and multi-tenant SaaS design.

**Live demo:** https://kage-f9sc.onrender.com — sign in with `admin@kage.dev` / `Admin123!` (or create an account). Runs on Neon PostgreSQL + Upstash Redis; free-tier cold start takes ~30–60 s after idle.

## Features

- **AI Research Pipeline**: Automated company research using public sources (website, news, search)
- **Multi-Agent Architecture**: 7 specialized AI agents (Research Planner, Researcher, Signal Analyst, Personalization, Writer, Critic, Compliance)
- **Personalized Outreach**: Generate highly personalized email and LinkedIn messages
- **Human-in-the-Loop**: AI NEVER auto-sends. Draft → AI Review → Human Review → Approve → Send
- **Gmail Integration**: OAuth flow, encrypted token storage, idempotent sending
- **LinkedIn Integration**: OAuth, profile fetching, messaging, post sharing
- **Campaign Management**: Track prospects through the entire outreach pipeline
- **Email Templates**: Reusable templates with variable interpolation
- **Team Management**: Multi-user with roles (Owner, Admin, Manager, Sales Rep, Viewer)
- **Billing**: Stripe integration with Starter/Growth/Scale plans
- **Audit Trail**: Complete audit logging of all actions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| API | Next.js API Routes |
| Database | PostgreSQL 16, Drizzle ORM |
| Queue | Redis 7, BullMQ |
| AI | OpenAI (gpt-4o, gpt-4o-mini), Zod schemas |
| Auth | NextAuth v5 (Google OAuth + Credentials) |
| Billing | Stripe |
| Monorepo | Turborepo, npm workspaces |

## Packages

| Package | Purpose |
|---------|---------|
| `@kage/shared` | Enums, validators, constants |
| `@kage/config` | Environment validation (Zod) |
| `@kage/db` | PostgreSQL schema (695 lines), Drizzle queries |
| `@kage/auth` | NextAuth v5, RBAC, password hashing |
| `@kage/security` | SSRF protection, rate limiting, AES-256-GCM encryption |
| `@kage/queue` | Redis connection, BullMQ job definitions |
| `@kage/ai` | OpenAI provider, 7 AI agents, Zod output schemas |
| `@kage/research` | Website/news/search adapters with SSRF validation |
| `@kage/gmail` | OAuth flow, encrypted tokens, send service |
| `@kage/billing` | Stripe plans, webhooks, checkout |
| `@kage/linkedin` | LinkedIn API service (profile, messaging, posts) |

## Frontend Pages

| Page | Features |
|------|----------|
| Login/Signup | Credentials auth with password validation |
| Dashboard | Metrics overview, activity feed |
| Prospects | List, create, detail, status filter, delete |
| Research | List reports, start research for prospects |
| Outreach | View messages, approve/reject workflow |
| Campaigns | Create, list, detail with prospect management |
| Team | List members, invite, remove, role management, create teams |
| Templates | Create email/LinkedIn templates with variable insert |
| Integrations | Gmail connect/disconnect, LinkedIn OAuth |
| Billing | Plan display (Starter/Growth/Scale), upgrade flow |
| Settings | Organization settings |
| Audit Log | Filterable by action and resource type |

## API Routes

### Prospects
- `GET /api/prospects` - List (paginated, filterable)
- `POST /api/prospects` - Create
- `GET /api/prospects/:id` - Get detail
- `PATCH /api/prospects/:id` - Update
- `DELETE /api/prospects/:id` - Delete

### Research
- `GET /api/research` - List reports
- `POST /api/research` - Start research job
- `GET /api/research/:id` - Get report

### Outreach
- `GET /api/outreach` - List packages
- `POST /api/outreach` - Generate outreach
- `GET /api/outreach/:id` - Get package
- `POST /api/outreach/:id/approve` - Approve message
- `POST /api/outreach/:id/reject` - Reject message

### Campaigns
- `GET /api/campaigns` - List
- `POST /api/campaigns` - Create

### Templates
- `GET /api/templates` - List
- `POST /api/templates` - Create
- `GET /api/templates/:id` - Get
- `PATCH /api/templates/:id` - Update
- `DELETE /api/templates/:id` - Delete

### Integrations
- `GET /api/integrations/gmail` - List Gmail accounts
- `POST /api/integrations/gmail` - Start OAuth
- `DELETE /api/integrations/gmail` - Disconnect
- `GET /api/integrations/gmail/callback` - OAuth callback
- `GET /api/integrations/linkedin` - List LinkedIn accounts
- `POST /api/integrations/linkedin` - Start OAuth
- `DELETE /api/integrations/linkedin` - Disconnect

### Other
- `GET /api/analytics` - Dashboard metrics
- `GET /api/audit-logs` - Audit trail (filterable)
- `GET /api/organizations/:id/members` - List members
- `POST /api/organizations/:id/members` - Invite member
- `GET /api/organizations/:id/teams` - List teams
- `POST /api/organizations/:id/teams` - Create team

## AI Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| Research Planner | gpt-4o-mini | Creates research plan |
| Researcher | gpt-4o | Extracts structured findings |
| Signal Analyst | gpt-4o-mini | Identifies business signals |
| Personalization | gpt-4o-mini | Scores opportunity (0-100) |
| Writer | gpt-4o | Generates email/LinkedIn variants |
| Critic | gpt-4o | Quality control (0-10 scores) |
| Compliance | gpt-4o-mini | Legal/ethical review |

## Workers

- `ResearchWorker` - Processes company research jobs
- `OutreachWorker` - Generates personalized outreach
- `SendEmailWorker` - Sends approved emails via Gmail
- Follow-up processor for automated sequences

## Security

- **SSRF Protection**: Blocks private IPs, localhost, cloud metadata
- **Rate Limiting**: Token bucket algorithm per user/org
- **Encryption**: AES-256-GCM for OAuth tokens
- **RBAC**: 5 roles with hierarchical permissions
- **Multi-tenancy**: All queries scoped to organization
- **Audit Logging**: Every action tracked

## Prerequisites

- Node.js >= 20
- PostgreSQL 16+
- Redis 7+
- OpenAI API key
- Google OAuth credentials (Gmail)
- Stripe account (billing)

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-org/kage.git
cd kage
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your keys

# 3. Start infrastructure
docker-compose -f docker/docker-compose.yml up -d db redis

# 4. Seed database
npm run db:seed --workspace=packages/db

# 5. Start dev server
npm run dev
```

## Default Credentials

- **Admin**: `admin@kage.dev` / `Admin123!`
- **Sales**: `sales@kage.dev` / `Sales123!`

## Scripts

```bash
npm run dev          # Start all services
npm run build        # Build all packages
npm run typecheck    # Type check all packages
npm run lint         # Lint all packages
npm run test         # Run tests
npm run db:seed      # Seed database
npm run db:migrate   # Run migrations
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API.md](./API.md) - API endpoint documentation
- [AI.md](./AI.md) - AI agent documentation
- [SECURITY.md](./SECURITY.md) - Security practices
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

## License

Proprietary - All rights reserved.
