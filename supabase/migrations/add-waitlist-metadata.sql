-- Migration: Add metadata column to waitlist table + relax email constraints.
-- Supports F2 "Request a bank" feature: bank_request entries may have no email,
-- and multiple requests can share an empty/null email.

-- 1. Add JSONB column for bank name / extra info.
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS metadata jsonb;

-- 2. Allow null / duplicate emails (bank_request can submit without email).
ALTER TABLE waitlist ALTER COLUMN email DROP NOT NULL;
ALTER TABLE waitlist DROP CONSTRAINT IF EXISTS waitlist_email_key;

-- 3. Backfill existing NULL emails to avoid UNIQUE-related legacy issues.
UPDATE waitlist SET email = NULL WHERE email = '';

-- 4. Index for querying bank requests by source.
CREATE INDEX IF NOT EXISTS waitlist_source_idx ON waitlist(source);
