-- Migration: Add csv_url column to statements table
-- Run this in Supabase SQL Editor to add CSV support
ALTER TABLE statements ADD COLUMN IF NOT EXISTS csv_url text;
