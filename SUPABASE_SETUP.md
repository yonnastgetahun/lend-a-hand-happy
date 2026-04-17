# Supabase Configuration for Lendlee
# Created: April 2026

## 🎉 Project Successfully Created!

**Project Name:** lendlee-v1  
**Project ID:** divwsajiaxklbuehnzek  
**Region:** West US (North California)  
**Plan:** Free Tier  
**Status:** ✅ Active and Accessible

---

## 🔑 Project Credentials

**Dashboard URL:**
```
https://supabase.com/dashboard/project/divwsajiaxklbuehnzek
```

**API URL:**
```
https://divwsajiaxklbuehnzek.supabase.co
```

**Connection Info:**
- **Project Reference:** `divwsajiaxklbuehnzek`
- **Linked Locally:** ✅ Yes (in /apps/mobile-salvaged)
- **Organization:** wtvubllmhdbfsskphfpv

---

## 📋 Next Steps to Complete Setup

### Step 1: Get Your API Keys

Visit your dashboard to get the actual API keys:
```
https://supabase.com/dashboard/project/divwsajiaxklbuehnzek/settings/api
```

You'll need:
1. **Project URL** (shown above)
2. **anon public** API key (for client-side)
3. **service_role secret** key (for server-side/admin - keep secure!)

### Step 2: Create Environment File

Create `/apps/mobile-salvaged/.env`:
```
SUPABASE_URL=https://divwsajiaxklbuehnzek.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 3: Install Supabase Client

```bash
cd /Users/yonnasgetahun/lend-a-hand-happy/apps/mobile-salvaged
npm install @supabase/supabase-js
```

### Step 4: Test Connection

Run this test to verify:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Test connection
const { data, error } = await supabase.from('items').select('*').limit(1)
console.log('Connected:', data, error)
```

---

## 🗄️ Database Schema Plan

### Tables to Create:

```sql
-- Users (managed by Supabase Auth, extended with profile)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Items (books, tools, etc.)
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(20) CHECK (category IN ('book', 'tool', 'game', 'gear', 'other')),
  photo_url TEXT,
  condition VARCHAR(20) CHECK (condition IN ('new', 'good', 'fair', 'worn')),
  value INTEGER,
  status VARCHAR(20) CHECK (status IN ('available', 'lent', 'given')) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contacts (borrowers/recipients)
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  notes TEXT,
  how_met TEXT,
  tags TEXT[],
  reliability VARCHAR(10) CHECK (reliability IN ('high', 'medium', 'low')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Loans (temporary transfers)
CREATE TABLE loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) NOT NULL,
  contact_id UUID REFERENCES contacts(id) NOT NULL,
  lent_at TIMESTAMP DEFAULT NOW(),
  return_by TIMESTAMP,
  returned_at TIMESTAMP,
  status VARCHAR(20) CHECK (status IN ('active', 'returned', 'overdue')) DEFAULT 'active',
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Gives (permanent transfers)
CREATE TABLE gives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) NOT NULL,
  contact_id UUID REFERENCES contacts(id) NOT NULL,
  given_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security (Users can only access their own data)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE gives ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only see their own items" ON items
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Users can only see their own contacts" ON contacts
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Users can only see their own loans" ON loans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM items WHERE items.id = loans.item_id AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can only see their own gives" ON gives
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM items WHERE items.id = gives.item_id AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can only update their own profile" ON profiles
  FOR ALL USING (id = auth.uid());
```

---

## 🔐 Authentication Setup

### Apple Sign-In (Required for iOS)

1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com
   
2. **Configure in Supabase Dashboard:**
   - Go to: Authentication → Providers → Apple
   - Enable Apple Sign-In
   - Add your iOS Bundle ID (when you have it)
   - Download and upload Auth Key from Apple

3. **In Xcode:**
   - Add "Sign in with Apple" capability
   - Configure App ID with Sign In

### Google Sign-In

1. **Google Cloud Console:**
   - Create OAuth 2.0 credentials
   - Configure consent screen
   - Add iOS/Android client IDs

2. **In Supabase Dashboard:**
   - Go to: Authentication → Providers → Google
   - Add Client ID and Secret

### Email/Password

✅ **Already enabled by default!**

---

## ✅ Verification Checklist

- [x] Supabase CLI installed (v2.90.0)
- [x] Project created (lendlee-v1)
- [x] Project linked locally
- [ ] API keys obtained from dashboard
- [ ] Environment file created
- [ ] Supabase client installed
- [ ] Database schema created
- [ ] Authentication configured
- [ ] Test connection successful
- [ ] First item synced to cloud

---

## 💰 Current Usage (Free Tier)

| Resource | Limit | Current |
|----------|-------|---------|
| Database | 500 MB | 0 MB |
| Storage | 2 GB | 0 GB |
| Bandwidth | 5 GB/month | 0 GB |
| Auth Users | Unlimited | 0 |

**Estimated Time on Free Tier:**
- 1-1,000 users: Free tier sufficient
- 1,000-10,000 users: Upgrade to Pro ($25/month)

---

## 🚀 You're Ready!

**What's been done:**
✅ Supabase CLI installed  
✅ Project created (lendlee-v1)  
✅ Project linked locally  
✅ Cloud endpoint verified  

**What's next:**
1. Get API keys from dashboard
2. Create .env file
3. Install Supabase client
4. Create database schema
5. Configure authentication
6. Test connection

**Need help with next steps?** I can guide you through:
- Setting up the database schema
- Configuring Apple/Google auth
- Integrating with React Native
- Testing the connection

---

**Project Dashboard:**
https://supabase.com/dashboard/project/divwsajiaxklbuehnzek

**Ready to proceed with backend integration!** 🎉
