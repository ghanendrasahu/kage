-- Migration: Add email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL DEFAULT 'EMAIL',
  subject VARCHAR(500),
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]' NOT NULL,
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS email_templates_org_idx ON email_templates(organization_id);
CREATE INDEX IF NOT EXISTS email_templates_channel_idx ON email_templates(channel);
