# KAGE API Documentation

## Authentication

All API endpoints require authentication via NextAuth session cookies.

## Base URL

```
/api
```

## Endpoints

### Prospects

#### List Prospects
```
GET /api/prospects
```

Query Parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (string): Filter by status

#### Create Prospect
```
POST /api/prospects
```

Body:
```json
{
  "companyName": "string",
  "companyDomain": "string (optional)",
  "personName": "string",
  "personTitle": "string (optional)",
  "email": "string (optional)",
  "industry": "string (optional)",
  "companySize": "string (optional)",
  "location": "string (optional)"
}
```

#### Get Prospect
```
GET /api/prospects/:id
```

#### Update Prospect
```
PATCH /api/prospects/:id
```

#### Delete Prospect
```
DELETE /api/prospects/:id
```

### Research

#### List Research Reports
```
GET /api/research
```

Query Parameters:
- `page` (number): Page number
- `limit` (number): Items per page
- `prospectId` (string): Filter by prospect

#### Start Research
```
POST /api/research
```

Body:
```json
{
  "prospectId": "uuid",
  "companyName": "string",
  "companyDomain": "string (optional)",
  "targetPersona": "string (optional)",
  "productService": "string (optional)"
}
```

#### Get Research Report
```
GET /api/research/:id
```

### Outreach

#### List Outreach Packages
```
GET /api/outreach
```

Query Parameters:
- `page` (number): Page number
- `limit` (number): Items per page
- `prospectId` (string): Filter by prospect

#### Generate Outreach
```
POST /api/outreach
```

Body:
```json
{
  "prospectId": "uuid",
  "researchReportId": "uuid",
  "productService": "string",
  "icpDescription": "string (optional)",
  "salesContext": "string (optional)"
}
```

#### Get Outreach Package
```
GET /api/outreach/:id
```

#### Update Message
```
PATCH /api/outreach/:id
```

#### Approve Message
```
POST /api/outreach/:id/approve
```

#### Reject Message
```
POST /api/outreach/:id/reject
```

### Campaigns

#### List Campaigns
```
GET /api/campaigns
```

#### Create Campaign
```
POST /api/campaigns
```

Body:
```json
{
  "name": "string",
  "description": "string (optional)",
  "productService": "string (optional)",
  "icpDescription": "string (optional)",
  "salesContext": "string (optional)"
}
```

### Integrations

#### Gmail

##### List Gmail Accounts
```
GET /api/integrations/gmail
```

##### Connect Gmail
```
POST /api/integrations/gmail
```

##### Gmail Callback
```
GET /api/integrations/gmail/callback
```

##### Disconnect Gmail
```
DELETE /api/integrations/gmail?accountId=uuid
```

### Analytics

#### Get Analytics
```
GET /api/analytics
```

### Audit Logs

#### List Audit Logs
```
GET /api/audit-logs
```

Query Parameters:
- `page` (number): Page number
- `limit` (number): Items per page
- `action` (string): Filter by action
- `resourceType` (string): Filter by resource type

## Error Responses

All errors follow the format:

```json
{
  "error": "Error message",
  "details": {
    "fieldName": ["Error 1", "Error 2"]
  }
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error
