# App Store Review Notes — Lendlee

## Demo Account

Email: review@lendlee.app
Password: Lendlee2026!

## How to Test

1. Open the app and sign in using the demo account above (tap "Sign In" tab, enter email and password).
2. You will land on the "My Items" home screen (empty for a new account).
3. Tap the "Lend" tab at the bottom.
4. On the "Who are you lending to?" screen, tap "Add new contact" at the bottom.
5. Enter a name (e.g., "John") and phone number (e.g., "5551234567"), then tap "Use this contact."
6. On the "What?" screen, type an item name (e.g., "Book").
7. Select a return timeframe (e.g., "2 weeks").
8. Tap "Preview" to see the SMS message preview. Tap "Send" to open the native SMS composer (no SMS will be sent on a simulator).
9. Return to the "My Items" tab to see the item you just lent.
10. Tap the item card to view loan details, where you can send a reminder or mark the item as returned.

## Notes for Reviewer

- **Sign-In options:** The app supports Apple Sign-In, Google Sign-In, and email/password. All three methods are fully functional.
- **Contacts access:** The app requests Contacts permission to let users pick a borrower. If denied, a manual entry fallback is available (tested in step 4 above). Contact data is never uploaded — only the selected contact's name and phone are used locally.
- **SMS:** The app uses the native SMS composer (expo-sms) to send lending and reminder messages. It does not send SMS directly — the user always previews and confirms via the system SMS sheet. On a simulator, the SMS composer will open but cannot send.
- **Notifications:** Local push notifications remind the lender one day before an item's return date. No remote push notifications are used.
- **No in-app purchases.** The app is entirely free with no monetization.
- **Privacy:** Privacy policy is available at https://lendlee.app/privacy
