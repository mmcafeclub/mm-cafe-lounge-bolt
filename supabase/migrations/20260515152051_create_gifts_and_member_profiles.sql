/*
  # Create gifts and member profiles tables

  1. New Tables
    - `gifts`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `points_required` (integer, required)
      - `image_url` (text)
      - `is_active` (boolean, default true)
      - `stock` (integer, default 0)
      - `created_at` (timestamptz)

    - `member_profiles`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `phone` (text)
      - `email` (text)
      - `loyalty_points` (integer, default 0)
      - `tier` (text, default 'Bronze') - Bronze/Silver/Gold/Platinum
      - `redemption_history` (jsonb, default []) - Array of redemption objects
      - `created_by` (text) - Email of the app user who owns this profile
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Gifts: all authenticated can read active gifts; only admins can manage
    - Member profiles: users can only see their own; admins see all

  3. Notes
    - Gifts are the redemption catalogue visible to all members
    - Member profiles store loyalty data per customer
*/

CREATE TABLE IF NOT EXISTS gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  points_required integer NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gifts_active ON gifts (is_active);

ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active gifts"
  ON gifts FOR SELECT
  TO authenticated
  USING (is_active = true OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can create gifts"
  ON gifts FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update gifts"
  ON gifts FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete gifts"
  ON gifts FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Member Profiles

CREATE TABLE IF NOT EXISTS member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  loyalty_points integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'Bronze' CHECK (tier IN ('Bronze','Silver','Gold','Platinum')),
  redemption_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_profiles_created_by ON member_profiles (created_by);
CREATE INDEX IF NOT EXISTS idx_member_profiles_email ON member_profiles (email);

ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own member profile"
  ON member_profiles FOR SELECT
  TO authenticated
  USING (
    created_by = auth.jwt() ->> 'email'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Users can create own member profile"
  ON member_profiles FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.jwt() ->> 'email');

CREATE POLICY "Users can update own member profile"
  ON member_profiles FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.jwt() ->> 'email'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    created_by = auth.jwt() ->> 'email'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete member profiles"
  ON member_profiles FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
