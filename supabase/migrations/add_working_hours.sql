-- Run this in Supabase SQL Editor
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS working_hours jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS category text;
