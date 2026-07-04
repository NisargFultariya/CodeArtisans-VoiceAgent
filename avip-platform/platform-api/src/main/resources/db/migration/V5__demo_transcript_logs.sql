CREATE TABLE IF NOT EXISTS demo_transcript_logs (
  id TEXT PRIMARY KEY,
  room_name TEXT NOT NULL,
  participant_email TEXT,
  language TEXT,
  scenario TEXT,
  voice TEXT,
  input_mode TEXT,
  status TEXT NOT NULL,
  transcript TEXT NOT NULL,
  line_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_transcript_logs_created_at
  ON demo_transcript_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_demo_transcript_logs_room
  ON demo_transcript_logs (room_name);
