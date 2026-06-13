# KAGE Architecture

## Overview

KAGE is built as a modular monorepo using Turborepo, with a clear separation between:

- **Frontend**: Next.js 15 with React 19
- **API Layer**: Next.js API Routes
- **Service Layer**: Shared packages (auth, ai, research, gmail, queue, billing, security)
- **Worker Layer**: BullMQ workers for async job processing
- **Data Layer**: PostgreSQL (Drizzle ORM) + Redis (BullMQ)

## Directory Structure

```
kage/
├── apps/
│   └── web/                    # Next.js application
├── packages/
│   ├── shared/                 # Shared types, enums, utilities
│   ├── config/                 # Environment validation
│   ├── db/                     # Database schema and queries
│   ├── auth/                   # Authentication and RBAC
│   ├── ai/                     # AI agents and prompts
│   ├── research/               # Research pipeline
│   ├── gmail/                  # Gmail integration
│   ├── queue/                  # Job queue management
│   ├── billing/                # Stripe billing
│   └── security/               # Security utilities
├── workers/                    # Background job processors
├── docker/                     # Docker configuration
└── scripts/                    # Database scripts
```

## Request Flow

```
Client Request
    ↓
Next.js Middleware (Auth)
    ↓
API Route Handler
    ↓
Service Layer (Business Logic)
    ↓
Database (Drizzle ORM)
    ↓
Response
```

## AI Agent Pipeline

```
User Input
    ↓
Research Planner → Creates research plan
    ↓
Researcher → Gathers raw data from sources
    ↓
Signal Analyst → Identifies business signals
    ↓
Personalization Agent → Scores opportunity
    ↓
Outreach Writer → Generates email/LinkedIn variants
    ↓
Critic → Quality control and scoring
    ↓
Compliance Review → Legal/ethical check
    ↓
Human Review → Final approval
    ↓
Send (via Gmail)
```

## Multi-Tenancy

All database tables include `organization_id` for tenant isolation. Every query is scoped to the organization, preventing cross-tenant data access.

## Security

- **Authentication**: NextAuth v5 with Google OAuth + Credentials
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: AES-256-GCM for sensitive tokens
- **SSRF Protection**: URL validation and private IP blocking
- **Rate Limiting**: Per-user and per-organization limits
- **Audit Logging**: Complete audit trail of all actions

## Job Queue

BullMQ with Redis for async job processing:

- **research**: Company research jobs
- **outreach**: Outreach generation jobs
- **send-email**: Email sending jobs
- **followup**: Follow-up sequence jobs

Each job has:
- Exponential backoff retry
- Timeout configuration
- Idempotency keys (for email sending)
- Comprehensive error handling

## State Machines

### Prospect Status

```
NEW → RESEARCHING → RESEARCHED → DRAFTED → REVIEW → APPROVED → SENT → REPLIED → MEETING → CLOSED
```

### Message Status

```
DRAFT → AI_REVIEW → HUMAN_REVIEW → APPROVED → SENT → BOUNCED/COMPLAINED
```

## Deployment

### Development

```bash
docker-compose -f docker/docker-compose.yml up -d
npm run dev
```

### Production

1. Build Docker images:
   ```bash
   docker build -f docker/Dockerfile.web -t kage-web .
   docker build -f docker/Dockerfile.worker -t kage-worker .
   ```

2. Deploy to your infrastructure (ECS, Railway, Render, etc.)

3. Run database migrations:
   ```bash
   npm run db:migrate
   ```
