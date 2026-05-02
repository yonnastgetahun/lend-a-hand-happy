-- Fix: Insert missing profile for existing users
-- This SQL will create profiles for users who don't have them

-- Insert profile for socrates2004@gmail.com if missing
INSERT INTO profiles (id, name, email, created_at, updated_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', email) as name,
  email,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'socrates2004@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
  );

-- General fix: Create profiles for ALL users who don't have one
INSERT INTO profiles (id, name, email, created_at, updated_at)
SELECT 
  auth.users.id,
  COALESCE(auth.users.raw_user_meta_data->>'name', split_part(auth.users.email, '@', 1)) as name,
  auth.users.email,
  NOW(),
  NOW()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
);
