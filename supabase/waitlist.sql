-- Waitlist table for collecting emails before Stripe goes live
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'landing_page',
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
