CREATE TABLE IF NOT EXISTS demo_requests (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  shop_domain TEXT,
  monthly_volume TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'book-demo',
  status TEXT NOT NULL DEFAULT 'new',
  demo_shop_id TEXT REFERENCES shops(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON demo_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_requests_email ON demo_requests (email);
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests (status);
