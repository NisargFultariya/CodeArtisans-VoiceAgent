-- Phase 6 foundation: customer accounts, users, RBAC memberships, operator users.
-- Billing (subscriptions, Stripe) and shop-scoped roles land in a later migration.

CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE IF NOT EXISTS identity.accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  billing_email TEXT,
  stripe_customer_id TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'trial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_status ON identity.accounts (status);

CREATE TABLE IF NOT EXISTS identity.users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  full_name TEXT,
  password_hash TEXT,
  email_verified_at TIMESTAMPTZ,
  auth_provider TEXT NOT NULL DEFAULT 'magic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email_normalized)
);

CREATE INDEX IF NOT EXISTS idx_users_email_normalized ON identity.users (email_normalized);

CREATE TABLE IF NOT EXISTS identity.account_memberships (
  account_id TEXT NOT NULL REFERENCES identity.accounts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_account_memberships_user_id
  ON identity.account_memberships (user_id);

CREATE TABLE IF NOT EXISTS identity.operator_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  password_hash TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'support',
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email_normalized)
);

-- Portal magic-link and team-invite tokens (separate from demo prospect tokens).
CREATE TABLE IF NOT EXISTS identity.login_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'portal_login',
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_login_tokens_token_hash_active
  ON identity.login_tokens (token_hash)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_login_tokens_user_id
  ON identity.login_tokens (user_id);

-- Link Shopify installations to billing accounts (nullable until claimed via portal or install flow).
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS account_id TEXT REFERENCES identity.accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shops_account_id ON shops (account_id);
