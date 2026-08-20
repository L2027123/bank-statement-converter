-- Migration: Update get_waitlist() RPC to return the new metadata column.
-- Run this in Supabase SQL Editor after add-waitlist-metadata.sql.

DROP FUNCTION IF EXISTS public.get_waitlist();

CREATE OR REPLACE FUNCTION public.get_waitlist()
RETURNS TABLE (
  id uuid,
  email text,
  source text,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, email, source, metadata, created_at
  FROM public.waitlist
  ORDER BY created_at DESC
  LIMIT 500;
$$;

GRANT EXECUTE ON FUNCTION public.get_waitlist() TO anon;
