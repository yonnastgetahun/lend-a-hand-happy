# Lendlee MVP Build Prompt for Rork

Build the MVP for Lendlee - a person-to-person lending tracker app.

## CONTEXT

- React Native + Expo for iOS
- Vite + React for Web
- Shared monorepo structure already exists at ./lendlee

The monorepo has this structure:
```
lendlee/
├── apps/
│   ├── web/           # Vite + React web app
│   └── mobile/       # Expo + React Native app
├── packages/
│   └── shared/        # Shared types and utilities
└── package.json       # Root workspace
```

## FEATURES TO BUILD

### 1. User Authentication
- Email/password login screen
- Demo mode acceptable (no real backend needed yet)
- Persist auth state locally
- Logout functionality

### 2. Add Item Screen
- Photo capture (camera or gallery)
- Title text input
- Category selector (book, tool, game, gear, other)
- Save item to local state

### 3. Select Contact Screen
- List of mock contacts OR phone contacts integration
- Search/filter contacts
- Select one contact to lend to

### 4. Set Reminder Screen
- Date picker for return reminder
- Optional (can skip)
- Save reminder date

### 5. My Items Dashboard
- List all user's items
- Show item status (available, lent, returned)
- Show who has lent items
- Add new item button

### 6. Loan History Screen
- List of all past and current loans
- Filter: active, returned, all
- Mark item as returned

### 7. Profile Screen
- User name display
- Settings placeholder
- Logout button

## DESIGN SYSTEM

```
Colors:
- Primary: Sage green (#6B8F71)
- Primary Light: #8AAD91
- Primary Dark: #4A6B4F
- Accent: Terracotta (#C49A87)
- Accent Light: #D4B5A6
- Earth: #403633
- Earth Light: #6B5D5A
- Cream: #FAF8F5
- Warm White: #F5F2EB
- Background: #FEFEFE
- Foreground: #1A1A1A
- Border: #E8E4DE
- Muted: #6B5D5A
- Muted Foreground: #8B7D79
- Destructive: #DC2626

Typography: Friendly, rounded (system fonts OK)
Feel: Warm, calm, community-first, gentle, non-corporate
```

## TECHNICAL REQUIREMENTS

### iOS App (apps/mobile/)
- Use Expo SDK
- React Navigation for routing
- Zustand for state management
- expo-camera for photo capture
- expo-contacts for contacts (optional)
- Push notifications placeholder
- Build target: iOS 14+

### Web App (apps/web/)
- Use existing Vite + React setup
- React Router for routing
- Zustand for state management
- Tailwind CSS for styling (already configured)

### Shared (packages/shared/)
- TypeScript types for: User, Item, Loan, Contact
- Shared utility functions

## SUCCESS CRITERIA

### Must Pass
- [ ] iOS app builds successfully (npx expo run:ios)
- [ ] Web app builds successfully (npm run build)
- [ ] All screens render without errors
- [ ] Navigation works between screens
- [ ] Add item flow completes
- [ ] Lend item flow completes
- [ ] Mark as returned works
- [ ] Auth state persists

### Should Pass
- [ ] Code is clean and readable
- [ ] Follows React Native best practices
- [ ] Follows React web best practices
- [ ] Responsive on various screen sizes
- [ ] Loading states for async operations

## CONSTRAINTS

- Do NOT connect to a real backend/API
- Use local state for MVP
- Do NOT implement push notifications (placeholder only)
- Do NOT implement social circles yet
- Focus on the core lending flow only

## BRAND VOICE

Lendlee sounds like:
- A thoughtful neighbor
- A trusted friend
- A kind librarian

NOT like:
- A fintech startup
- A growth-hacker SaaS
- A VC-backed disruptor

Tone: Warm, calm, friendly, community-centered, slightly poetic

Example: "Lend freely. Care deeply. Stay connected."
