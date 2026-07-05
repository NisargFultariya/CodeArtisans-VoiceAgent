ALTER TABLE outbound_calls ADD COLUMN customer_name TEXT;
ALTER TABLE outbound_calls ADD COLUMN system_prompt TEXT;
ALTER TABLE outbound_calls ADD COLUMN custom_data JSONB;
