CREATE TABLE IF NOT EXISTS outbound_calls (
  id TEXT PRIMARY KEY,
  phone_number TEXT,
  status TEXT NOT NULL,
  workflow_id TEXT,
  room_name TEXT,
  agent_name TEXT,
  language TEXT,
  voice TEXT,
  scenario TEXT,
  mode TEXT NOT NULL DEFAULT 'phone',
  started_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration INTEGER,
  recording_url TEXT,
  transcript_url TEXT,
  twilio_call_sid TEXT,
  livekit_room TEXT,
  transcript TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbound_calls_created_at ON outbound_calls (created_at DESC);
