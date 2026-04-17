# Lendlee AI Task Prompts

Use these prompts to delegate work to AI tools.

---

## Phase 1 Tasks (MVP - $200 Budget)

### Task 1.1: Web Landing Page (Lovable - $75)
```
Build a marketing landing page for Lendlee using React + Tailwind CSS.

## Hero Section
Headline: "Build Your Neighborhood's Resilience"
Subheadline: "Every share, lend, and gift builds a network of trust. The more your community shares, the stronger your emergency-ready network becomes."

Colors:
- Primary: #6B8F71 (sage green)
- Accent: #C49A87 (terracotta)
- Background: #F5F2EB (cream)

Include these sections:
1. Hero with CTA buttons
2. Three ways to share (Give/Lend/Promote)
3. How it works (4 steps)
4. Network effect section
5. Values section
6. CTA with email signup
7. Footer

Use warm, community-first tone. Avoid corporate language. Make it feel hopeful, not fear-based.
```

### Task 1.2: Mobile App Core (Codex/Rork - $100)
```
Build iOS mobile app using Expo SDK 52 + React Native + TypeScript.

Core features:
1. Auth screen - create Nostr identity (generate keypair locally)
2. Give/Lend/Promote item creation with category selector
3. Item list with filter (Give/Lend/Promote)
4. Share button - opens native share sheet with pre-formatted message
5. Tab navigation (Home, Items, Messages, Settings)

Design:
- Use sage green (#6B8F71), terracotta (#C49A87), cream (#F5F2EB)
- Warm, rounded UI
- Keep screens simple for MVP

State management: Zustand
Navigation: Expo Router
Storage: AsyncStorage for local data
```

---

## Phase 2 Tasks (Future - $100 Budget)

### Task 2.1: Nostr Integration
```
Add Nostr protocol integration for decentralized identity and messaging.

Requirements:
1. Generate Nostr keypair (nsec/npub) on app first launch
2. Store keys securely in device storage
3. Display public key in profile
4. Simple message composer that publishes to Nostr relays
5. Subscribe to direct messages

Use nostr-tools library. Connect to these relays:
- wss://relay.damus.io
- wss://relay.nostr.band
```

### Task 2.2: Emergency Mode UI
```
Add emergency preparedness section to app.

Features:
1. Emergency broadcast button (prominent, accessible)
2. Triple-tap to wipe all data (security)
3. Status indicator showing mesh network strength
4. Location permission for emergency broadcasts
5. Simple message templates for emergencies

Make these features feel optional and non-alarming.
```

---

## Quick Start Prompts

### For Lovable (Landing Page)
"Use the attached SPEC.md to build the Lendlee landing page. Match the colors exactly: #6B8F71, #C49A87, #F5F2EB. Use warm, community-first copy."

### For Rork (Mobile App)
"Build Lendlee mobile MVP with: Give/Lend/Promote, Nostr auth, share sheet integration. Follow the spec at SPEC.md. Use Expo + Zustand + TypeScript."

### For Codex (Code Generation)
"Generate the Zustand stores for Lendlee: authStore, itemStore, messageStore with TypeScript. Include persistence middleware."

---

## Budget Tracker

| Task | Tool | Estimate | Actual |
|------|------|----------|--------|
| Landing Page | Lovable | $75 | _ |
| Mobile Core | Rork | $100 | _ |
| Nostr Integration | Codex | $50 | _ |
| Emergency UI | Codex | $50 | _ |
| **Total** | | **$275** | _ |

Start with Lovable for the landing page - it's the public face and can be built in parallel with mobile.

---

## Reference Files

| File | Purpose |
|------|---------|
| `LOVELANDINGPAGE_V3.md` | Landing page prompt with full copy |
| `LENDEE_PRD_V2_DECENTRALIZED.md` | Product requirements |
| `LENDEE_TECHNICAL_SPEC_V2.md` | Technical specification |

To use: Copy the relevant prompt and paste into your AI tool. Point the AI to the reference files for full context.