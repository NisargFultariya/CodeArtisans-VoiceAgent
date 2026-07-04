-- Phase 3: compliance, audit, NDR metadata, recording object keys

CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE IF NOT EXISTS compliance.order_consent (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  customer_phone TEXT,
  consent_source TEXT NOT NULL DEFAULT 'checkout',
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  UNIQUE (shop_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_consent_shop_order
  ON compliance.order_consent (shop_id, order_id);

CREATE TABLE IF NOT EXISTS compliance.dnd_numbers (
  phone_e164 TEXT PRIMARY KEY,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit.events (
  id TEXT PRIMARY KEY,
  shop_id TEXT,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_shop_created
  ON audit.events (shop_id, created_at DESC);

ALTER TABLE calls ADD COLUMN IF NOT EXISTS ndr_stage TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_object_key TEXT;
