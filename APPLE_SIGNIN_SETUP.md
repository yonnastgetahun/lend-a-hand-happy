# Apple Sign-In Configuration for Lendlee

**Status:** Ready to configure  
**Apple Developer Account:** ✅ You have one  
**Supabase Project:** divwsajiaxklbuehnzek  
**Platform:** iOS (React Native/Expo)

---

## 🚀 Quick Setup (Apple Sign-In)

### Step 1: Configure in Supabase Dashboard (5 minutes)

**URL:** https://supabase.com/dashboard/project/divwsajiaxklbuehnzek/auth/providers

**Toggle Apple to "Enabled"**

**Fill these fields:**

| Field | What to Enter | Where to Get It |
|-------|---------------|-----------------|
| **Services ID** | `com.yourcompany.lendlee.signin` | Apple Developer Portal |
| **Key ID** | (e.g., `ABC123DEF4`) | Apple Developer Portal → Keys |
| **Team ID** | (10 characters) | Apple Developer Portal → Membership |
| **Private Key** | (long text from .p8 file) | Apple Developer Portal → Download |

---

### Step 2: Get Your Apple Credentials

**A. Get Team ID:**
```
1. Log into https://developer.apple.com
2. Click "Account" (top right)
3. Click "Membership"
4. Copy "Team ID" (10 characters, e.g., ABCDE1F2GH)
```

**B. Create Services ID:**
```
1. Apple Developer Portal → "Certificates, IDs & Profiles"
2. Click "Identifiers" (left sidebar)
3. Click "+" button
4. Select "Services IDs" → Continue
5. Description: "Lendlee Sign In"
6. Identifier: `com.yourcompany.lendlee.signin`
   (replace "yourcompany" with your actual company/bundle)
7. Click "Continue" → "Register"
8. Click on the new Services ID
9. ☑️ Check "Sign In with Apple"
10. Configure:
    - Primary App ID: Select your main app ID
    - Click "Save"
```

**C. Create Key:**
```
1. Apple Developer Portal → "Certificates, IDs & Profiles"
2. Click "Keys" (left sidebar)
3. Click "+" button
4. Key Name: "Lendlee Sign In Key"
5. ☑️ Check "Sign In with Apple"
6. Click "Configure"
7. Select "Primary App ID" (your main app)
8. Click "Save"
9. Click "Continue" → "Register"
10. **DOWNLOAD THE .p8 FILE** ⚠️ (You only get ONE chance!)
11. Note the "Key ID" (e.g., ABC123DEF4)
```

**D. Get Private Key Content:**
```
1. Open the downloaded .p8 file in text editor
2. Copy ALL the content (starts with -----BEGIN PRIVATE KEY-----)
3. Paste into Supabase "Private Key" field
```

---

### Step 3: Configure App ID (if not done)

```
1. Apple Developer Portal → "Certificates, IDs & Profiles"
2. Click "Identifiers"
3. Find your app (or create new App ID)
4. App ID: com.yourcompany.lendlee
5. Capabilities:
   ☑️ Sign In with Apple (MUST be checked)
6. Save
```

---

### Step 4: Xcode Configuration

**Add Capability:**
```
1. Open /Users/yonnasgetahun/lend-a-hand-happy/apps/mobile-salvaged/ios/Lendlee.xcworkspace
2. Select project → Target → "Signing & Capabilities"
3. Click "+ Capability"
4. Search and add "Sign In with Apple"
5. Build project: npx expo prebuild
```

---

### Step 5: Install Dependency

```bash
cd /Users/yonnasgetahun/lend-a-hand-happy/apps/mobile-salvaged
npx expo install expo-apple-authentication
```

---

### Step 6: Update Code

**Replace the placeholder in `app/login.tsx`:**

Find `handleAppleSignIn` function and replace with:

```typescript
import * as AppleAuthentication from 'expo-apple-authentication';

const handleAppleSignIn = async () => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (credential.identityToken) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;
      
      // Create profile for new users
      if (data.user && credential.fullName) {
        const fullName = [
          credential.fullName.givenName,
          credential.fullName.familyName
        ].filter(Boolean).join(' ');
        
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: fullName || 'Apple User',
          email: credential.email || data.user.email,
        });
      }
    }
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELLED') {
      // User cancelled - no action needed
      return;
    }
    console.error('Apple Sign-In error:', error);
    Alert.alert('Sign In Error', error.message || 'Failed to sign in with Apple');
  }
};
```

---

### Step 7: Test

```bash
# Start app
cd /Users/yonnasgetahun/lend-a-hand-happy/apps/mobile-salvaged
npx expo start

# Press 'i' for iOS Simulator
# Tap "Continue with Apple"
# Sign in with your Apple ID
# Verify user appears in Supabase Dashboard → Authentication → Users
```

**Test on Real Device (Required):**
```
Apple Sign-In doesn't work on iOS Simulator
Must test on physical iPhone with:
1. Apple ID signed in
2. App deployed via TestFlight or Xcode
```

---

## 🧪 Verification Checklist

- [ ] Team ID copied from Apple Developer
- [ ] Services ID created and enabled
- [ ] Key created and .p8 file downloaded
- [ ] Private Key pasted in Supabase
- [ ] Supabase Apple provider enabled
- [ ] Xcode "Sign In with Apple" capability added
- [ ] `expo-apple-authentication` installed
- [ ] Code updated with real implementation
- [ ] Tested on real iPhone
- [ ] User appears in Supabase Auth dashboard
- [ ] Profile created in database

---

## 🐛 Common Issues

### "Invalid client_id" Error
**Cause:** Services ID doesn't match
**Fix:** Check `com.yourcompany.lendlee.signin` matches exactly

### "Invalid redirect_uri" Error
**Cause:** iOS bundle ID mismatch
**Fix:** Verify Xcode bundle ID matches Apple Developer App ID

### User name/email is null
**Cause:** Apple only provides this on FIRST sign-in
**Solution:** Store in profile table during first sign-in (code above handles this)

### "Sign In with Apple" button not showing
**Cause:** iOS Simulator limitation
**Solution:** Test on real device

---

## 📋 Summary of Your Values

**Your Specific Project:**
- **Supabase Project ID:** `divwsajiaxklbuehnzek`
- **Dashboard:** https://supabase.com/dashboard/project/divwsajiaxklbuehnzek/auth/providers
- **Bundle ID:** `com.yourcompany.lendlee` (update with your actual)
- **Services ID:** `com.yourcompany.lendlee.signin`

**You Already Have:**
- ✅ Supabase project created
- ✅ Database deployed
- ✅ Apple Developer account
- ✅ Login screen with Apple button
- ✅ Backend ready

**You Need To Do:**
1. Create Services ID in Apple Developer (5 min)
2. Create Key in Apple Developer (5 min)
3. Configure in Supabase dashboard (5 min)
4. Add Xcode capability (2 min)
5. Install dependency (1 min)
6. Update code (5 min)
7. Test on real device (10 min)

**Total Time:** ~30 minutes

---

## 🎯 Next Steps

**Ready to configure?**

1. **"Walk me through it step by step"** - I'll guide you live
2. **"I'll do it myself and report back"** - Go ahead, use this guide
3. **"Do it for me"** - I can help automate parts

**What's your preference?** 🚀
