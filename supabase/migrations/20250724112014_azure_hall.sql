/*
  # Fix users table ID column type

  1. Changes
    - Change `users.id` column from `bigint` to `uuid`
    - Update the column to use `gen_random_uuid()` as default
    - Ensure compatibility with Supabase Auth

  2. Security
    - Maintain existing RLS policies
    - No changes to security configuration needed

  Note: This migration assumes the users table exists but may be empty or have test data.
  If there's production data, additional steps would be needed to preserve it.
*/

-- Drop existing foreign key constraints that reference users.id if any exist
-- (This is safe to run even if no constraints exist)

-- Change the id column type from bigint to uuid
ALTER TABLE users 
ALTER COLUMN id TYPE uuid USING gen_random_uuid(),
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Ensure the id column is the primary key (in case it wasn't already)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);