/*
  # Create lounge news and schedule cache tables

  1. New Tables
    - `lounge_news`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `content` (text) - Markdown content
      - `image_url` (text)
      - `is_featured` (boolean, default false)
      - `published_date` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `lounge_schedule_cache`
      - `id` (uuid, primary key)
      - `shift_id` (text) - Source Shift ID from MM Café Club
      - `staff_id` (text)
      - `staff_name` (text, required)
      - `staff_role` (text) - Restaurant role from parent Staff profile
      - `staff_image_url` (text) - Staff profile picture
      - `date` (date, required)
      - `start_time` (text)
      - `end_time` (text)
      - `responsibility` (text)
      - `synced_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Lounge news: all authenticated can read; only admins can manage
    - Schedule cache: all authenticated can read; only admins can write (via service role in edge function)

  3. Notes
    - lounge_schedule_cache is populated by syncShiftSchedule edge function calling MM Cafe Club API
    - The cache is cleared and repopulated on each sync
*/

CREATE TABLE IF NOT EXISTS lounge_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  content text DEFAULT '',
  image_url text DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  published_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lounge_news_published ON lounge_news (published_date DESC);

ALTER TABLE lounge_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lounge news"
  ON lounge_news FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create lounge news"
  ON lounge_news FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update lounge news"
  ON lounge_news FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete lounge news"
  ON lounge_news FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Lounge Schedule Cache (synced from MM Cafe Club)

CREATE TABLE IF NOT EXISTS lounge_schedule_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id text DEFAULT '',
  staff_id text DEFAULT '',
  staff_name text NOT NULL DEFAULT '',
  staff_role text DEFAULT '',
  staff_image_url text DEFAULT '',
  date date NOT NULL,
  start_time text DEFAULT '',
  end_time text DEFAULT '',
  responsibility text DEFAULT '',
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_cache_date ON lounge_schedule_cache (date);
CREATE INDEX IF NOT EXISTS idx_schedule_cache_shift_id ON lounge_schedule_cache (shift_id);

ALTER TABLE lounge_schedule_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view schedule cache"
  ON lounge_schedule_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert schedule cache"
  ON lounge_schedule_cache FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update schedule cache"
  ON lounge_schedule_cache FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete schedule cache"
  ON lounge_schedule_cache FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Allow service_role full access for edge functions (bypasses RLS)
-- service_role already bypasses RLS by default in Supabase, no extra policy needed
