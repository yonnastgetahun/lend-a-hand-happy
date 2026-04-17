-- Lendlee Database Schema v1.0
-- Created: April 2026
-- Description: Initial schema for Lendlee mobile app

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- ============================================
-- PROFILES (extends Supabase Auth users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{
    "reminderTone": "gentle",
    "defaultReminderDays": 14,
    "enablePushNotifications": true,
    "enableEmailReminders": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ITEMS (books, tools, games, etc.)
-- ============================================
CREATE TYPE item_category AS ENUM ('book', 'tool', 'game', 'gear', 'other');
CREATE TYPE item_status AS ENUM ('available', 'lent', 'given');
CREATE TYPE item_condition AS ENUM ('new', 'good', 'fair', 'worn');

CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  category item_category DEFAULT 'other',
  photo_url TEXT,
  condition item_condition,
  value INTEGER CHECK (value >= 0),
  status item_status DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CONTACTS (borrowers and recipients)
-- ============================================
CREATE TYPE contact_reliability AS ENUM ('high', 'medium', 'low');

CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  notes TEXT,
  how_met TEXT,
  tags TEXT[] DEFAULT '{}',
  reliability contact_reliability,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- LOANS (temporary item transfers)
-- ============================================
CREATE TYPE loan_status AS ENUM ('active', 'returned', 'overdue');

CREATE TABLE IF NOT EXISTS loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  lent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  return_by TIMESTAMP WITH TIME ZONE,
  returned_at TIMESTAMP WITH TIME ZONE,
  status loan_status DEFAULT 'active',
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- GIVES (permanent item transfers)
-- ============================================
CREATE TABLE IF NOT EXISTS gives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  given_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_items_owner_id ON items(owner_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_created_at ON items(created_at DESC);

CREATE INDEX idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX idx_contacts_name ON contacts(name);

CREATE INDEX idx_loans_item_id ON loans(item_id);
CREATE INDEX idx_loans_contact_id ON loans(contact_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_lent_at ON loans(lent_at DESC);

CREATE INDEX idx_gives_item_id ON gives(item_id);
CREATE INDEX idx_gives_contact_id ON gives(contact_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Users can only access their own data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE gives ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Items: Users can only access their own items
CREATE POLICY "Users can view own items" ON items
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create items" ON items
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own items" ON items
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own items" ON items
  FOR DELETE USING (auth.uid() = owner_id);

-- Contacts: Users can only access their own contacts
CREATE POLICY "Users can view own contacts" ON contacts
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own contacts" ON contacts
  FOR DELETE USING (auth.uid() = owner_id);

-- Loans: Users can only access loans for their items
CREATE POLICY "Users can view own loans" ON loans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = loans.item_id 
      AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create loans" ON loans
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = loans.item_id 
      AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own loans" ON loans
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = loans.item_id 
      AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own loans" ON loans
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = loans.item_id 
      AND items.owner_id = auth.uid()
    )
  );

-- Gives: Users can only access gives for their items
CREATE POLICY "Users can view own gives" ON gives
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = gives.item_id 
      AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create gives" ON gives
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = gives.item_id 
      AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own gives" ON gives
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = gives.item_id 
      AND items.owner_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS for common operations
-- ============================================

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE (
  total_items BIGINT,
  available_items BIGINT,
  lent_items BIGINT,
  given_items BIGINT,
  active_loans BIGINT,
  total_contacts BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM items WHERE owner_id = user_id)::BIGINT as total_items,
    (SELECT COUNT(*) FROM items WHERE owner_id = user_id AND status = 'available')::BIGINT as available_items,
    (SELECT COUNT(*) FROM items WHERE owner_id = user_id AND status = 'lent')::BIGINT as lent_items,
    (SELECT COUNT(*) FROM items WHERE owner_id = user_id AND status = 'given')::BIGINT as given_items,
    (SELECT COUNT(*) FROM loans l 
     JOIN items i ON l.item_id = i.id 
     WHERE i.owner_id = user_id AND l.status = 'active')::BIGINT as active_loans,
    (SELECT COUNT(*) FROM contacts WHERE owner_id = user_id)::BIGINT as total_contacts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS to update item status
-- ============================================

-- When a loan is created, mark item as lent
CREATE OR REPLACE FUNCTION update_item_status_on_loan()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE items SET status = 'lent' WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_item_on_loan_create
  AFTER INSERT ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_item_status_on_loan();

-- When a loan is marked returned, mark item as available
CREATE OR REPLACE FUNCTION update_item_status_on_return()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'returned' AND OLD.status = 'active' THEN
    UPDATE items SET status = 'available' WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_item_on_loan_return
  AFTER UPDATE ON loans
  FOR EACH ROW
  WHEN (NEW.status = 'returned' AND OLD.status = 'active')
  EXECUTE FUNCTION update_item_status_on_return();

-- When a give is created, mark item as given
CREATE OR REPLACE FUNCTION update_item_status_on_give()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE items SET status = 'given' WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_item_on_give_create
  AFTER INSERT ON gives
  FOR EACH ROW
  EXECUTE FUNCTION update_item_status_on_give();
