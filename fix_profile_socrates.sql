-- Fix: Create profile for socrates2004@gmail.com
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/divwsajiaxklbuehnzek/sql/new

-- First, let's see what users exist
SELECT id, email, raw_user_meta_data->>'name' as name 
FROM auth.users 
WHERE email = 'socrates2004@gmail.com';

-- Create profile for the user (replace USER_ID with actual ID from above)
INSERT INTO profiles (id, name, email, created_at, updated_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', 'Jonny'),
  email,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'socrates2004@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
  );
