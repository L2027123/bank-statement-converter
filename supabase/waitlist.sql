-- Waitlist table for collecting emails before Stripe goes live.
-- Also used for F2 "Request a bank" entries (source='bank_request',
-- metadata.bank_name stores the requested bank, email is optional).
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  source TEXT DEFAULT 'landing_page',
  metadata jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous visitors to insert their email
DROP POLICY IF EXISTS "Allow anonymous insert" ON waitlist;
CREATE POLICY "Allow anonymous insert" ON waitlist
  FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated (admin) to read the list
DROP POLICY IF EXISTS "Allow admin select" ON waitlist;
CREATE POLICY "Allow admin select" ON waitlist
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS waitlist_source_idx ON waitlist(source);
