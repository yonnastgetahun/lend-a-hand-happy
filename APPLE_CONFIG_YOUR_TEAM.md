# Apple Sign-In - YOUR SPECIFIC CONFIGURATION

**Your Apple Team ID:** YCV45M5FGF  
**Supabase Project:** divwsajiaxklbuehnzek  
**Status:** Ready to configure

---

## 🆔 YOUR BUNDLE ID DECISION

**Choose ONE of these formats:**

| Format | Example | Best For |
|--------|---------|----------|
| **Personal** | `com.yourname.lendlee` | Individual developer |
| **Company** | `com.yourcompany.lendlee` | Business/LLC |
| **Reverse Domain** | `io.lendlee.app` | Product-focused |

**Recommendation:** Use the same pattern as your other live apps for consistency.

**What bundle ID pattern do your other apps use?**
- `com.something.appname`?
- `io.productname`?
- Something else?

---

## 🚀 IMMEDIATE NEXT STEPS

### Step 1: Create Bundle ID (in Apple Developer Portal)

**URL:** https://developer.apple.com/account/resources/identifiers/bundleId/add

**Fill in:**
- **Platform:** iOS
- **Description:** Lendlee - Lending Tracker
- **Bundle ID:** (Choose from above, e.g., `com.yourcompany.lendlee`)
- **Capabilities:** ☑️ **Sign In with Apple** (MUST check this!)

---

### Step 2: Create Services ID (for Sign In with Apple)

**URL:** https://developer.apple.com/account/resources/identifiers/add

**Select:** Services IDs

**Fill in:**
- **Description:** Lendlee Sign In
- **Identifier:** `[YOUR_BUNDLE_ID].signin`  
  (e.g., `com.yourcompany.lendlee.signin`)

**After creation:**
1. Click on the Services ID
2. ☑️ Enable "Sign In with Apple"
3. Click "Configure"
4. **Primary App ID:** Select your Lendlee Bundle ID (from Step 1)
5. Click "Save"

---

### Step 3: Create Key

**URL:** https://developer.apple.com/account/resources/authkeys/add

**Fill in:**
- **Key Name:** Lendlee Sign In Key
- **Enable:** ☑️ Sign In with Apple
- **Configure:** Select your Lendlee Bundle ID

**⚠️ IMPORTANT:** Download the `.p8` file - you only get ONE chance!

**Note the Key ID** (e.g., `ABC123DEF4`)

---

### Step 4: Configure Supabase (Your Settings)

**URL:** https://supabase.com/dashboard/project/divwsajiaxklbuehnzek/auth/providers

**Toggle Apple to "Enabled"**

**Fill these EXACT values:**

| Field | Value |
|-------|-------|
| **Services ID** | `com.yourcompany.lendlee.signin` (replace with yours) |
| **Key ID** | (From Step 3, e.g., `ABC123DEF4`) |
| **Team ID** | `YCV45M5FGF` ✅ (your actual Team ID) |
| **Private Key** | (Paste content of .p8 file from Step 3) |

**Click "Save"**

---

## 📝 COMPLETE CHECKLIST

### Apple Developer Portal:
- [ ] Create Bundle ID (with Sign In with Apple capability)
- [ ] Create Services ID (`[bundle_id].signin`)
- [ ] Create Key (download .p8 file)
- [ ] Note Team ID: **YCV45M5FGF** ✅

### Supabase Dashboard:
- [ ] Enable Apple provider
- [ ] Enter Services ID
- [ ] Enter Key ID
- [ ] Enter Team ID: **YCV45M5FGF**
- [ ] Paste Private Key
- [ ] Click Save

### Xcode:
- [ ] Open Lendlee.xcworkspace
- [ ] Add "Sign In with Apple" capability
- [ ] Verify Bundle ID matches

### Mobile App:
- [ ] Install expo-apple-authentication
- [ ] Update login.tsx code
- [ ] Test on real iPhone

---

## 🆔 YOUR SPECIFIC VALUES (Fill In)

**Team ID:** `YCV45M5FGF` ✅ (confirmed)

**Bundle ID:** `com.________________.lendlee` (you choose)

**Services ID:** `[bundle_id].signin`

**Key ID:** `__________` (from Step 3)

---

## 🎯 WHAT I NEED FROM YOU

**1. What bundle ID format do you want?**
   - `com.[what].lendlee`?
   
**2. What pattern do your other apps use?**  
   (So we can match the style)

**3. Or should I just pick one for you?**
   - I'll use: `com.yourcompany.lendlee`

---

## 🚀 FASTEST PATH

**If you want to start immediately:**

1. **Use bundle ID:** `com.lendlee.app`
2. **Use Services ID:** `com.lendlee.app.signin`
3. **Team ID:** `YCV45M5FGF` (already have)

**This is clean and product-focused.**

**Want me to proceed with `com.lendlee.app`?** Or tell me your preferred format?

---

## 💡 EXAMPLES FROM OTHER APPS

If your other apps are:
- `com.acme.widget` → use `com.acme.lendlee`
- `io.product.cool` → use `io.lendlee.app`
- `com.johnsmith.tools` → use `com.johnsmith.lendlee`

**Match the pattern for consistency.**

---

**What bundle ID do you want to use?** Give me the format and I'll update all the configuration files with your specific values! 🚀
