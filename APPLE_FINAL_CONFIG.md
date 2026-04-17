# Apple Sign-In - FINAL CONFIGURATION

**Status:** Ready to implement  
**Team ID:** YCV45M5FGF  
**Bundle ID:** me.lendlee.ios  
**Domain:** lendlee.com (recommended over .live)

---

## 🆔 YOUR EXACT VALUES

| Setting | Value | Status |
|---------|-------|--------|
| **Apple Team ID** | `YCV45M5FGF` | ✅ Confirmed |
| **Bundle ID** | `me.lendlee.ios` | ✅ Matches your pattern |
| **Services ID** | `me.lendlee.ios.signin` | ✅ Derived |
| **Supabase Project** | `divwsajiaxklbuehnzek` | ✅ Created |

---

## 🚀 STEP-BY-STEP CONFIGURATION

### Step 1: Create Bundle ID (Apple Developer)

**URL:** https://developer.apple.com/account/resources/identifiers/bundleId/add

**Fill in:**
- **Platform:** iOS
- **Description:** Lendlee - Lending Tracker
- **Bundle ID:** `me.lendlee.ios`
- **Capabilities:** ☑️ **Sign In with Apple** (CRITICAL!)

**Click "Continue" → "Register"**

---

### Step 2: Create Services ID

**URL:** https://developer.apple.com/account/resources/identifiers/list/serviceId

**Click "+" button:**
- **Description:** Lendlee Sign In
- **Identifier:** `me.lendlee.ios.signin`

**After creation:**
1. Click on `me.lendlee.ios.signin`
2. ☑️ Enable "Sign In with Apple"
3. Click "Configure"
4. **Primary App ID:** Select `me.lendlee.ios` (from Step 1)
5. Click "Save" → "Done"

---

### Step 3: Create Key

**URL:** https://developer.apple.com/account/resources/authkeys/add

**Fill in:**
- **Key Name:** Lendlee Sign In Key
- **Enable:** ☑️ Sign In with Apple
- **Configure:** Select `me.lendlee.ios`
- Click "Save"

**⚠️ DOWNLOAD THE .p8 FILE** (You only get ONE chance!)

**Note the Key ID** (e.g., `ABC123DEF4`)

---

### Step 4: Configure Supabase

**URL:** https://supabase.com/dashboard/project/divwsajiaxklbuehnzek/auth/providers

**Toggle Apple to "Enabled"**

**Enter EXACT values:**

```
Services ID: me.lendlee.ios.signin
Key ID:       (from Step 3, e.g., ABC123DEF4)
Team ID:      YCV45M5FGF
Private Key:  (Paste content of .p8 file)
```

**Click "Save"**

---

## 📝 DOMAIN RECOMMENDATION

### Transfer from lendlee.live → lendlee.com

**Why .com is better:**
1. **Professional credibility** - Standard for businesses
2. **User trust** - People trust .com more
3. **App Store approval** - Apple prefers .com
4. **SEO ranking** - Search engines favor .com
5. **Future value** - .com has resale value
6. **Brand authority** - Looks established

**Action items:**
- [ ] Point lendlee.com to current Lovable site
- [ ] Update all branding to use lendlee.com
- [ ] Set up redirects from .live to .com
- [ ] Update App Store listing (when ready)
- [ ] Update marketing materials

---

## 🛠️ CODE UPDATES NEEDED

I'll update these files with your bundle ID:

1. `app.json` - Expo configuration
2. `ios/Lendlee/Info.plist` - iOS bundle identifier
3. `app/login.tsx` - Apple Sign-In code
4. Documentation files

---

## 📋 COMPLETE CHECKLIST

### Apple Developer (15 minutes):
- [ ] Create Bundle ID: `me.lendlee.ios`
- [ ] Enable "Sign In with Apple" capability
- [ ] Create Services ID: `me.lendlee.ios.signin`
- [ ] Create Key and download .p8 file
- [ ] Note Key ID

### Supabase (5 minutes):
- [ ] Enable Apple provider
- [ ] Enter Services ID: `me.lendlee.ios.signin`
- [ ] Enter Key ID
- [ ] Enter Team ID: `YCV45M5FGF`
- [ ] Paste Private Key
- [ ] Click Save

### Xcode (5 minutes):
- [ ] Open Lendlee.xcworkspace
- [ ] Verify Bundle ID is `me.lendlee.ios`
- [ ] Add "Sign In with Apple" capability
- [ ] Build project

### App Code (5 minutes):
- [ ] Install expo-apple-authentication
- [ ] Update login.tsx with real implementation
- [ ] Test on real iPhone

### Domain (Optional but recommended):
- [ ] Configure lendlee.com DNS
- [ ] Transfer Lovable site to .com
- [ ] Update branding

---

## 🎯 TIMELINE

**Total setup time:** ~30 minutes
- Apple Developer: 15 min
- Supabase: 5 min
- Xcode: 5 min
- Code: 5 min

**Testing:** Requires real iPhone (can't test on simulator)

---

## 🚀 READY TO PROCEED?

**Option A: I update the code now**
- I'll update all files with `me.lendlee.ios`
- You create the IDs in Apple Developer
- We test together

**Option B: You do it yourself**
- Follow this guide
- Create IDs
- Configure Supabase
- Report back

**Option C: We do it live together**
- Screen share (if possible)
- I guide you through each step
- Real-time troubleshooting

**What's your preference?**

Also - **should I help you transfer the domain to lendlee.com as well?** 🚀
