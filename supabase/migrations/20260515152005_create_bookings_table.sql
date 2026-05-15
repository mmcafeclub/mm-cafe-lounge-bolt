/*
  # Create bookings table

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `date` (date, required) - Booking date YYYY-MM-DD
      - `time_slot` (text, required) - One of the 5 time slots
      - `customer_name` (text, required)
      - `customer_phone` (text, required)
      - `party_size` (integer, required, 1-12)
      - `status` (text, default 'confirmed') - confirmed/arrived/no-show/cancelled
      - `member_id` (text) - Optional linked MemberProfile id
      - `notes` (text)
      - `created_by` (text) - Email of the user who created the booking
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Authenticated users can only read/insert/update/delete their own bookings
    - Admins can read/update all bookings

  3. Indexes
    - Index on (date, time_slot, status) for capacity checks
    - Index on created_by for user booking lookups
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time_slot text NOT NULL CHECK (time_slot IN ('12:00-14:00','14:00-16:00','16:00-18:00','18:00-20:00','20:00-22:00')),
  customer_name text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  party_size integer NOT NULL DEFAULT 1 CHECK (party_size >= 1 AND party_size <= 12),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','arrived','no-show','cancelled')),
  member_id text DEFAULT '',
  notes text DEFAULT '',
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_date_slot_status ON bookings (date, time_slot, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_by ON bookings (created_by);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (date);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    created_by = auth.jwt() ->> 'email'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.jwt() ->> 'email');

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.jwt() ->> 'email'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    created_by = auth.jwt() ->> 'email'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Users can delete own bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (
    created_by = auth.jwt() ->> 'email'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
