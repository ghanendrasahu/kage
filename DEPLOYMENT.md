# KAGE Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- OpenAI API key
- Google OAuth credentials
- Stripe account (optional)

## Local Development

1. Start infrastructure:
   ```bash
   docker-compose -f docker/docker-compose.yml up -d db redis
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. Run migrations:
   ```bash
   npm run db:migrate --workspace=packages/db
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Start workers (in separate terminal):
   ```bash
   npm run dev --workspace=workers
   ```

## Production Deployment

### Option 1: Docker Compose

1. Build images:
   ```bash
   docker build -f docker/Dockerfile.web -t kage-web .
   docker build -f docker/Dockerfile.worker -t kage-worker .
   ```

2. Create production environment file:
   ```bash
   cp .env.example .env.production
   # Edit with production values
   ```

3. Start all services:
   ```bash
   docker-compose -f docker/docker-compose.yml --profile production up -d
   ```

### Option 2: Cloud Deployment

#### Frontend (Vercel)

1. Connect GitHub repository
2. Set environment variables
3. Deploy

#### API (Railway/Render/Fly.io)

1. Create new service
2. Connect GitHub repository
3. Set environment variables
4. Deploy

#### Workers (Same as API)

1. Create separate service for workers
2. Use same Docker image
3. Change command to `npm run start --workspace=workers`

#### Database

- Use managed PostgreSQL (AWS RDS, Supabase, Neon)
- Use managed Redis (AWS ElastiCache, Upstash)

### Option 3: AWS ECS/Fargate

1. Push images to ECR
2. Create ECS cluster
3. Define task definitions
4. Create services
5. Configure load balancer
6. Set up RDS and ElastiCache

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `AUTH_SECRET` | NextAuth secret (min 32 chars) |
| `ENCRYPTION_KEY` | Encryption key (min 32 chars) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `OPENAI_API_KEY` | OpenAI API key |

### Optional

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `SENTRY_DSN` | Sentry DSN |

## Database Migrations

```bash
# Generate migration
npm run db:generate --workspace=packages/db

# Run migrations
npm run db:migrate --workspace=packages/db

# Push schema changes (development)
npm run db:push --workspace=packages/db
```

## Monitoring

- **Sentry**: Error tracking
- **Health Endpoints**: `/api/health`, `/api/ready`
- **Logs**: Structured JSON logging

## Scaling

- **Web**: Horizontal scaling behind load balancer
- **Workers**: Scale based on queue depth
- **Database**: Vertical scaling + read replicas
- **Redis**: Managed service with clustering

## Backup

- **Database**: Daily automated backups
- **Redis**: Persistence configuration
- **Files**: S3-compatible storage

## SSL/TLS

- Use reverse proxy (Nginx, Caddy) or cloud load balancer
- Enable HSTS
- Redirect HTTP to HTTPS

## Domain Configuration

1. Configure DNS
2. Update `NEXT_PUBLIC_APP_URL`
3. Update Google OAuth redirect URIs
4. Update Stripe webhook URLs
