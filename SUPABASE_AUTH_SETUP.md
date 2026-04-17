# Supabase Authentication Setup Guide

**Platform:** iOS & Android  
**Providers:** Apple Sign-In, Google Sign-In, Email/Password  
**Status:** Email auth ready, Apple/Google need configuration

---

## 📧 Email/Password Auth ✅ READY

**Status:** Fully implemented and working

**Features:**
- ✅ User registration with email/password
- ✅ Login with email/password
- ✅ Automatic profile creation
- ✅ Session persistence
- ✅ Password reset (via Supabase)

**Test Credentials:**
```
Email: demo@lendlee.app
Password: demo123456
```

---

## 🍎 Apple Sign-In Setup

### Prerequisites
- Apple Developer Account ($99/year) - https://developer.apple.com
- iOS app with Bundle ID configured
- Supabase project (already created ✅)

### Step 1: Apple Developer Configuration

**1.1 Create App ID:**
```
1. Log into https://developer.apple.com
2. Go to "Certificates, Identifiers & Profiles"
3. Click "Identifiers" → "+" button
4. Select "App IDs" → Continue
5. Description: "Lendlee"
6. Bundle ID: "com.yourcompany.lendlee" (use your actual bundle ID)
7. Capabilities:
   ☑️ Sign In with Apple
8. Click "Continue" → "Register"
```

**1.2 Create Services ID:**
```
1. Click "Identifiers" → "+" button
2. Select "Services IDs" → Continue
3. Description: "Lendlee Sign In"
4. Identifier: "com.yourcompany.lendlee.signin"
5. Click "Continue" → "Register"
6. Click on the new Services ID
7. ☑️ Enable "Sign In with Apple"
8. Configure:
   - Primary App ID: Select your App ID from step 1.1
   - Click "Save"
```

**1.3 Create Key:**
```
1. Go to "Keys" → "+" button
2. Key Name: "Lendlee Sign In Key"
3. ☑️ Enable "Sign In with Apple"
4. Configure:
   - Select "Primary App ID" from dropdown
5. Click "Continue" → "Register"
6. DOWNLOAD THE KEY FILE (.p8) - You only get one chance!
7. Note the Key ID (e.g., ABC123DEF4)
```

### Step 2: Supabase Configuration

**2.1 Add Apple Provider:**
```
1. Go to https://supabase.com/dashboard/project/divwsajiaxklbuehnzek
2. Authentication → Providers → Apple
3. Toggle "Enabled"
4. Configure:
   - Services ID: com.yourcompany.lendlee.signin
   - Key ID: ABC123DEF4 (from step 1.3)
   - Team ID: (from Apple Developer → Membership)
   - Private Key: (paste contents of .p8 file)
5. Click "Save"
```

### Step 3: Xcode Configuration

**3.1 Add Capability:**
```
1. Open ios/Lendlee.xcworkspace in Xcode
2. Select project → Target → Signing & Capabilities
3. Click "+ Capability"
4. Add "Sign In with Apple"
```

**3.2 Install Dependency:**
```bash
cd /Users/yonnasgetahun/lend-a-hand-happy/apps/mobile-salvaged
npx expo install expo-apple-authentication
```

**3.3 Update Login Code:**
Replace the placeholder in `app/login.tsx`:

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

    // Sign in to Supabase
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw error;
    
    // Create profile if new user
    if (credential.fullName) {
      await supabase.from('profiles').upsert({
        id: user.id,
        name: credential.fullName.givenName + ' ' + credential.fullName.familyName,
        email: credential.email,
      });
    }
  } catch (error) {
    console.error('Apple Sign-In error:', error);
  }
};
```

---

## 🔵 Google Sign-In Setup

### Prerequisites
- Google Cloud Console account - https://console.cloud.google.com
- Supabase project (already created ✅)

### Step 1: Google Cloud Console

**1.1 Create Project:**
```
1. Go to https://console.cloud.google.com
2. Click project selector → "New Project"
3. Project Name: "Lendlee"
4. Click "Create"
```

**1.2 Enable APIs:**
```
1. Go to "APIs & Services" → "Library"
2. Search "Google+ API" → Click "Enable"
3. Search "Google People API" → Click "Enable"
```

**1.3 Configure OAuth Consent Screen:**
```
1. Go to "APIs & Services" → "OAuth consent screen"
2. User Type: "External" → "Create"
3. App Information:
   - App Name: "Lendlee"
   - User Support Email: your-email@example.com
   - Developer Contact: your-email@example.com
4. Scopes:
   - Add "email"
   - Add "profile"
5. Test Users: (add your email for testing)
6. Click "Save and Continue"
```

**1.4 Create OAuth Credentials:**
```
1. Go to "APIs & Services" → "Credentials"
2. Click "+ Create Credentials" → "OAuth client ID"
3. Application Type: "iOS"
4. Name: "Lendlee iOS"
5. Bundle ID: com.yourcompany.lendlee
6. Click "Create"
7. Note the Client ID (e.g., 123456789-abc123.apps.googleusercontent.com)

Repeat for Android:
1. Click "+ Create Credentials" → "OAuth client ID"
2. Application Type: "Android"
3. Name: "Lendlee Android"
4. Package Name: com.yourcompany.lendlee
5. SHA-1: (get from keytool, see below)
6. Click "Create"
```

**Get Android SHA-1:**
```bash
cd /Users/yonnasgetahun/lend-a-hand-happy/apps/mobile-salvaged/android
keytool -list -v -keystore app/debug.keystore -alias androiddebugkey -storepass android -keypass android
# Look for "SHA1: XX:XX:XX..."
```

### Step 2: Supabase Configuration

**2.1 Add Google Provider:**
```
1. Go to https://supabase.com/dashboard/project/divwsajiaxklbuehnzek
2. Authentication → Providers → Google
3. Toggle "Enabled"
4. Configure:
   - Client ID (iOS): (from step 1.4 iOS)
   - Client Secret: (leave blank for iOS)
   - Authorized Client IDs (for Android): (from step 1.4 Android)
5. Click "Save"
```

### Step 3: Install Dependencies

```bash
cd /Users/yonnasgetahun/lend-a-hand-happy/apps/mobile-salvaged

# For iOS (Google Sign-In)
npx expo install @react-native-google-signin/google-signin

# For web-based OAuth (fallback)
# (Already included with @supabase/supabase-js)
```

### Step 4: Update Login Code

Replace the placeholder in `app/login.tsx`:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
GoogleSignin.configure({
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // optional
  offlineAccess: true,
});

const handleGoogleSignIn = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    if (userInfo.idToken) {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.idToken,
      });
      
      if (error) throw error;
    }
  } catch (error) {
    console.error('Google Sign-In error:', error);
  }
};
```

---

## 🧪 Testing Authentication

### Test Email/Password (Ready Now):
```
1. Start app: npx expo start
2. Tap "Sign Up"
3. Enter name, email, password
4. Tap "Create Account"
5. Check Supabase Dashboard → Authentication → Users
   (should see new user)
6. Logout
7. Log back in with same credentials
```

### Test Apple Sign-In (After Setup):
```
1. Tap "Continue with Apple"
2. Use Apple ID credentials
3. Verify user appears in Supabase
4. Check profile created automatically
```

### Test Google Sign-In (After Setup):
```
1. Tap "Continue with Google"
2. Select Google account
3. Verify user appears in Supabase
4. Check profile created automatically
```

---

## 🔐 Security Notes

**Row Level Security (RLS):**
- Already enabled ✅
- Users can only see their own data
- Even if authentication is bypassed, data is isolated

**Token Handling:**
- Supabase manages JWT tokens automatically
- Tokens refresh automatically
- Sessions persist across app restarts

**Password Security:**
- Passwords are hashed by Supabase (bcrypt)
- Never store plain text passwords
- Use password reset flow for forgotten passwords

---

## 🐛 Troubleshooting

### Apple Sign-In Issues:

**"Invalid client_id" error:**
- Check Services ID matches Supabase config
- Verify Bundle ID in Xcode matches App ID

**"Invalid redirect_uri" error:**
- Make sure Supabase callback URL is configured
- Check `com.googleusercontent.apps.XXX` format

**User info (name/email) is null:**
- Apple only provides name/email on FIRST sign-in
- Subsequent sign-ins return null
- Store user info in profile table on first sign-in

### Google Sign-In Issues:

**"DEVELOPER_ERROR" on Android:**
- Wrong SHA-1 fingerprint
- Wrong package name
- Debug vs Release keystore mismatch

**"12500" error:**
- OAuth consent screen not fully configured
- App not published in Google Cloud (testing mode only)

**No idToken returned:**
- Check `offlineAccess: true` in config
- Verify scopes include 'email' and 'profile'

### General Issues:

**Auth state not persisting:**
- Check AsyncStorage is working
- Verify `persistSession: true` in Supabase config

**"Auth session missing" error:**
- User was signed out
- Token expired and couldn't refresh
- Call `supabase.auth.getSession()` to check

---

## 📋 Pre-Launch Checklist

Before releasing to App Store:

**Apple Sign-In:**
- [ ] Apple Developer account active ($99 paid)
- [ ] App ID created with Sign In capability
- [ ] Services ID created and configured
- [ ] Private key (.p8) downloaded and saved securely
- [ ] Supabase Apple provider configured
- [ ] Xcode capability added
- [ ] Tested on real device (not just simulator)

**Google Sign-In:**
- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] iOS OAuth client ID created
- [ ] Android OAuth client ID created (with SHA-1)
- [ ] Supabase Google provider configured
- [ ] Tested on real device

**All Auth:**
- [ ] Email sign-up works
- [ ] Email login works
- [ ] Password reset flow tested
- [ ] Session persists after app restart
- [ ] Logout works correctly
- [ ] RLS policies tested (user isolation)

---

## 🚀 Next Steps

**Right Now:**
1. Test email auth (already working ✅)
2. Set up Apple Developer account (if you want Apple Sign-In)
3. Set up Google Cloud project (if you want Google Sign-In)

**This Week:**
4. Configure Apple Sign-In in Supabase
5. Configure Google Sign-In in Supabase
6. Install native dependencies
7. Update login screen code
8. Test all auth methods

---

## 💰 Cost Summary

| Service | Cost | Notes |
|---------|------|-------|
| Supabase Auth | $0 (included) | Unlimited users on free tier |
| Apple Developer | $99/year | Required for Apple Sign-In |
| Google Cloud | $0 | OAuth is free |
| **Total** | **$99/year** | (only if using Apple Sign-In) |

**Without Apple Sign-In:** $0/year (Email + Google only)

---

## 📚 Resources

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Apple Sign-In: https://developer.apple.com/sign-in-with-apple/
- Google Sign-In: https://developers.google.com/identity/sign-in/ios/start
- React Native Google Sign-In: https://github.com/react-native-google-signin/google-signin
- Expo Apple Auth: https://docs.expo.dev/versions/latest/sdk/apple-authentication/

---

**Questions?** Start with Email auth (working now), then add Apple/Google when ready! 🎉
