# KAGE Security

## Overview

KAGE implements defense-in-depth security practices to protect customer data and prevent abuse.

## Authentication

- **NextAuth v5**: Industry-standard authentication
- **Google OAuth**: For Gmail integration
- **Credentials**: Email/password with bcrypt hashing
- **JWT Tokens**: Secure session management
- **Password Requirements**: Minimum 8 characters with complexity requirements

## Authorization

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| Owner | Full access to organization, users, billing |
| Admin | Manage users, teams, campaigns, integrations |
| Manager | Manage prospects, research, outreach, campaigns |
| Sales Rep | Manage own prospects, research, outreach |
| Viewer | Read-only access |

### Tenant Isolation

All database queries are scoped to the organization. No cross-tenant data access is possible.

## Data Protection

### Encryption at Rest

- **AES-256-GCM**: For sensitive tokens (Gmail OAuth tokens)
- **ENCRYPTION_KEY**: Must be at least 32 characters

### Sensitive Data

- OAuth tokens are encrypted before storage
- Passwords are hashed with bcrypt (12 rounds)
- No secrets are logged or exposed to frontend

## Input Validation

- **Zod Schemas**: All API inputs are validated
- **SQL Injection**: Prevented by Drizzle ORM parameterized queries
- **XSS**: React auto-escaping + CSP headers

## SSRF Protection

Research URLs are validated to prevent:
- Private IP ranges (10.x, 172.16-31.x, 192.168.x)
- localhost, 127.0.0.1
- Cloud metadata endpoints (169.254.169.254)
- Non-standard ports

## Rate Limiting

- Per-user rate limits
- Per-organization rate limits
- Per-endpoint rate limits
- Token bucket algorithm

## Security Headers

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Prompt Injection Defense

- AI agents treat research content as UNTRUSTED DATA
- System instructions are never overridden by user/research content
- Input sanitization before AI processing

## Audit Logging

All important actions are logged:
- Authentication events
- CRUD operations
- Approvals/rejections
- Email sends
- Integration connections

## Environment Variables

All secrets are stored in environment variables, never in code:
- `DATABASE_URL`
- `REDIS_URL`
- `AUTH_SECRET`
- `ENCRYPTION_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`

## Incident Response

1. Rotate affected credentials immediately
2. Review audit logs for unauthorized access
3. Notify affected users if data breach occurs
4. Document incident and remediation steps

## Security Updates

- Dependencies are regularly updated
- Security advisories are monitored
- Automated vulnerability scanning recommended
