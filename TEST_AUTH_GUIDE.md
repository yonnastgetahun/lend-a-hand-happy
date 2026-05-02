# 🧪 Lendlee Authentication Test Guide

**Date:** April 17, 2026  
**Status:** Ready for Testing  

---

## ✅ Pre-Flight Checklist

- [x] Supabase API key configured in `.env`
- [x] Google Sign-In Client ID configured in code
- [x] Google provider enabled in Supabase dashboard
- [x] Apple Sign-In configured (requires physical iPhone)
- [x] Email auth enabled (already working)

---

## 🚀 How to Test

### Step 1: Start the App

```bash
cd /Users/yonnasgetahun/lend-a-hand-happy/apps/mobile-salvaged
npm run ios
```

Or if that fails due to Node version:
```bash
# Use Node Version Manager to switch to Node 18 or 20
nvm use 18
npm run ios
```

---

## 🧪 Test Cases

### Test 1: Email Sign-Up ✅
**Steps:**
1. Open app → Login screen appears
2. Tap "Don't have an account? Sign Up"
3. Enter name: "Test User"
4. Enter email: `test123@example.com`
5. Enter password: `testpassword123`
6. Tap "Create Account"

**Expected:**
- Account created successfully
- Auto-navigates to home screen
- Profile created in Supabase

**Verify in Supabase:**
- Go to: https://supabase.com/dashboard/project/divwsajiaxklbuehnzek/editor
- Check `profiles` table → New entry should appear
- Check `auth.users` → New user should appear

---

### Test 2: Email Sign-In ✅
**Steps:**
1. Log out (if logged in)
2. Enter email: `test123@example.com`
3. Enter password: `testpassword123`
4. Tap "Sign In"

**Expected:**
- Login successful
- Navigates to home screen
- Shows user's items

---

### Test 3: Google Sign-In 🆕 (NEW!)
**Steps:**
1. On login screen, tap "Continue with Google"
2. Google sign-in popup appears
3. Select or enter Google account
4. Authorize Lendlee app

**Expected:**
- Google auth successful
- Supabase creates/updates user
- Profile created with Google info
- Navigates to home screen

**Verify in Supabase:**
- Check `auth.users` → New user with provider = "google"
- Check `profiles` → Entry with Google name/email

**Note:** If you get "Error 400: redirect_uri_mismatch", the OAuth consent screen or iOS bundle ID needs verification in Google Cloud Console (takes 24-48 hours for production).

---

### Test 4: Apple Sign-In 🍎 (Requires Physical iPhone)
**Steps:**
1. Build app on physical iPhone (won't work on simulator)
2. Tap "Continue with Apple"
3. Face ID/Touch ID or password prompt
4. Authorize app

**Expected:**
- Apple auth successful
- Supabase creates/updates user
- Profile created with Apple info (name only on first sign-in)

**Verify in Supabase:**
- Check `auth.users` → New user with provider = "apple"

---

### Test 5: Cloud Data Sync ✅
**Steps:**
1. Log in with any method
2. Add a new item (e.g., "Test Book")
3. Check Supabase database
4. Log out and log back in

**Expected:**
- Item appears in database immediately
- Item persists after re-login
- Data synced across sessions

**Verify:**
- Check `items` table in Supabase
- Query: `SELECT * FROM items WHERE owner_id = '<your_user_id>';`

---

### Test 6: Real-Time Updates ✅
**Steps:**
1. Open app on device (logged in)
2. Open Supabase dashboard in browser
3. Manually add item in dashboard
4. Watch app update automatically

**Expected:**
- New item appears in app without refresh
- Real-time subscription working

---

## 🔍 Troubleshooting

### Issue: "No ID token received from Google"
**Solution:**
- Verify Google Sign-In is configured in Supabase dashboard
- Check Client ID matches exactly
- Ensure OAuth consent screen is published (not in testing mode)

### Issue: "Sign In Error: Invalid credentials"
**Solution:**
- For email: Check email/password are correct
- For Google/Apple: User might not exist yet, try signing up first

### Issue: "Redirect URI mismatch"
**Solution:**
- In Google Cloud Console, verify iOS bundle ID: `me.lendlee.ios`
- May need to publish OAuth app (takes 24-48 hours for review)

### Issue: App crashes on start
**Solution:**
```bash
cd /Users/yonnasgetahun/lend-a-hand-happy/apps/mobile-salvaged
rm -rf node_modules
npm install
npx expo prebuild --clean
npm run ios
```

---

## 📊 Test Results Log

Use this section to record your test results:

| Test | Status | Date | Notes |
|------|--------|------|-------|
| Email Sign-Up | ⬜ | | |
| Email Sign-In | ⬜ | | |
| Google Sign-In | ⬜ | | |
| Apple Sign-In | ⬜ | | (needs iPhone) |
| Cloud Data Sync | ⬜ | | |
| Real-Time Updates | ⬜ | | |

**Legend:**
- ⬜ Not tested
- ✅ Passed
- ❌ Failed
- 🔄 In progress

---

## 🎯 Success Criteria

All tests pass when:
- [ ] Users can sign up with email
- [ ] Users can sign in with email
- [ ] Users can sign in with Google (on iOS)
- [ ] Users can sign in with Apple (on physical iPhone)
- [ ] Data persists after logout/login
- [ ] Real-time updates work
- [ ] No console errors in Metro bundler

---

## 📞 Need Help?

If tests fail:
1. Check Metro bundler console for errors
2. Check Supabase dashboard logs
3. Verify `.env` file has correct API keys
4. Ensure you're on Node 18 or 20 (not 25)

**Key URLs:**
- Supabase Dashboard: https://supabase.com/dashboard/project/divwsajiaxklbuehnzek
- Google Cloud Console: https://console.cloud.google.com/apis/credentials?project=lendlee
- Apple Developer: https://developer.apple.com/account/resources/identifiers/list/bundleId

---

## 🎉 You're Ready!

Once all tests pass, you're ready for:
- Beta testing with friends
- App Store submission preparation
- Production deployment

**Happy testing! 🚀**
