/*
  # Create menu tables

  1. New Tables
    - `menu_categories`
      - `id` (uuid, primary key)
      - `name` (text, required) - Category tab name e.g. Breakfast, Lunch, Drinks
      - `sort_order` (integer, default 0) - Display order
      - `created_at` (timestamptz)

    - `menu_items`
      - `id` (uuid, primary key)
      - `category_id` (uuid, FK to menu_categories)
      - `item_number` (text) - Menu item code e.g. B1, A12
      - `item_name` (text)
      - `price` (text) - Price display value (text for flexibility e.g. "88" or "88+")
      - `sort_order` (integer, default 0)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - All authenticated users can read menu data (public menu)
    - Only admins can create/update/delete

  3. Notes
    - Menu is publicly viewable to all authenticated users
    - Only admins manage menu content
*/

CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_sort ON menu_categories (sort_order);

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view menu categories"
  ON menu_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create menu categories"
  ON menu_categories FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update menu categories"
  ON menu_categories FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete menu categories"
  ON menu_categories FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Menu Items

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  item_number text DEFAULT '',
  item_name text DEFAULT '',
  price text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items (category_id, sort_order);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
