# Lendlee PRD: User-Owned Community Network

## Version 3.1 (Merged: Recommendations + User-Owned Network)

---

## Executive Summary

Lendlee is not a social network. It is a user-owned relationship and resilience tool where individuals and families manage their own networks, share resources, and stay connected—online and offline—without becoming the product.

**Core differentiation:**

1. **Everyday value:** Give/Lend/Promote/Recommend, messaging, and trusted referrals among people you actually know.
2. **Structural value:** Your social graph and trust live with you, not a platform, backed by decentralized identity (Nostr).
3. **Resilience value:** The more your community uses Lendlee, the stronger your emergency-ready Bluetooth mesh network becomes.

---

## Problem Statement

1. **The lost promise of social networks**
   - Early social media helped us remember birthdays and stay close to friends and family.
   - Over time, feeds were optimized for ads and engagement, not relationships; users became the product rather than the beneficiary.
2. **Fragmented communication and relationship management**
   - People juggle SMS, email, calls, and multiple apps (Instagram, LinkedIn, TikTok, etc.).
   - No single place is designed to help an individual or family *steward* their network, trust, and referrals over time.
3. **Emergency tools with no daily value**
   - Offline/mesh emergency apps exist, but they are rarely used day-to-day and struggle to maintain adoption when there is no crisis.

**The gap:** A user-owned network tool that helps people manage and deepen relationships in everyday life, respects their privacy and agency, and quietly builds local resilience via offline mesh for when infrastructure fails.

---

## Why Lendlee Exists

We believe the tools we use should work *for us*, not *on us*.

**You own your network.**

- Your contacts are people you choose, not algorithms suggesting content
- Your data stays on your device, not harvested for ad targeting
- Your recommendations and referrals flow to people you trust, not fed to strangers
- Your social graph and trust live with you, not on a platform server
- When your community adopts Lendlee, you gain a communication backbone that works even when infrastructure fails

The more your community shares, the more resilient your neighborhood becomes.

---

## Solution: Consumer-Initiated, User-Owned Network

### Core Philosophy

> Lendlee treats your relationships, trust, and referrals as something **you own and manage**, not as data to be harvested and monetized.

- Your graph is built from real interactions (sharing, lending, messaging, referring), not follows and likes.
- There is no public feed; Lendlee doesn't optimize what you see for ad revenue.
- Identity and graph are portable and cryptographically yours, grounded in Nostr-style keys and events.

### The Approach

- Users download Lendlee and invite their contacts via existing channels (SMS, WhatsApp, email).
- Core flows focus on **Give/Lend/Promote/Recommend**, messaging, and structured referrals.
- The app uses Nostr for decentralized identity and online messaging.
- A BitChat/Bridgefy-style Bluetooth mesh layer provides offline messaging when local density is sufficient.
- No public profiles, follow counts, or algorithmic feeds.

### Network Effect

| Adoption Level | Value Delivered |
| :-- | :-- |
| 1 user | Personal item tracking and private relationship notes |
| 2–5 users | Sharing, lending, messaging, and referrals with friends/family |
| 10+ users (neighborhood) | Emergency broadcast becomes viable |
| 50+ users (neighborhood) | Practical offline mesh for multi-hop relay |

"Mesh-capable neighborhood" = a geographic cluster where, during typical waking hours, there are enough Lendlee devices within Bluetooth range (~50–100 m line-of-sight) and overlap to support multi-hop messaging.

---

## Core Features (Phased Roadmap)

### Phase 1: MVP – Sharing & Network Stewardship (v1.0)

**Primary function:** Give/Lend/Promote/Recommend with external share and basic relationship stewardship.

| Feature | Description |
| :-- | :-- |
| **Give** | Offer items/services for free; track who received them. |
| **Lend** | Borrow/return flows with due dates and reminders. |
| **Promote** | Share resources, events, and knowledge with your contacts. |
| **Recommend** | Trusted recommendations & referrals for local services; ask the community for referrals. |
| **External Share** | Native share sheet to Messages/WhatsApp/email for items and invites. |
| **Email Auth** | Lightweight onboarding via email; no phone number required. |
| **Relationship Notes** | Optional private notes per contact (how you met, context, etc.). |

#### Recommend Sub-Features

| Sub-feature | Description |
|-------------|-------------|
| **Ask the Community** | Post a request: "Looking for a good plumber, anyone recommend one?" |
| **Share Recommendation** | Share a trusted local service provider (dentist, plumber, mechanic, tutor, etc.) |
| **Referral Attribution** | Track which recommendations result in business (opt-in) |

**Why this first:** Creates immediate utility, grounded in real relationships and everyday generosity, while seeding the contact graph. Recommendations fill a gap that social media once served but now fails at—trusted advice from people you know.

---

### Phase 2: Everyday Messaging & User-Owned Graph (v1.5)

**Primary function:** Online messaging and explicit user-owned network concepts.

| Feature | Description |
| :-- | :-- |
| **Nostr Identity** | Auto-generated keypair; user identity is a public key, not a username. |
| **Contact List** | Built from people you've shared with, messaged, or explicitly added. |
| **Direct Messages** | Encrypted DMs via Nostr relays (1:1 and small groups). |
| **Invitations** | Deep links that bootstrap contact relationships. |
| **Local Adoption Badge** | "12 neighbors nearby use Lendlee." |
| **User-Owned Graph View** | A simple visualization of your network (contacts and trust tags) that lives with you, not in a platform database. |

**Why this second:** Messaging and a visible, user-owned graph drive daily engagement and reinforce the "this is *your* network" story.

---

### Phase 3: Offline Capability – Mesh Messaging (v2.0)

**Primary function:** Local Bluetooth mesh for offline communication.

| Feature | Description |
| :-- | :-- |
| **Bluetooth Mesh** | BitChat/Bridgefy-style mesh where devices relay messages across hops. |
| **Offline Mode** | Manual toggle to route messages via Bluetooth when internet is unavailable. |
| **Peer Discovery** | Background detection of nearby Lendlee nodes (opt-in). |
| **Message Relay** | Multi-hop messaging with TTL and deduplication. |
| **Queued Delivery** | Store-and-forward when peers come into range. |

**Why this third:** Requires sufficient local density and serious engineering/testing; enabled once online usage is meaningful.

---

### Phase 4: Emergency Ready & Enhanced Referrals (v2.5)

**Primary function:** Emergency communication, resource coordination, and structured referrals.

| Feature | Description |
| :-- | :-- |
| **Emergency Broadcast** | One-tap broadcast to all reachable neighbors in mesh range. |
| **Location Channels** | Geohash-based channels for area-wide coordination (e.g., neighborhood). |
| **Resource Map** | Opt-in, privacy-aware map of who has what resources nearby. |
| **Triple-Tap Wipe** | Panic gesture to wipe local data and keys. |
| **Trust Tags** | Per-contact tags like "Great with kids," "Trusted electrician," "Reliable driver," living in your private graph (not public endorsements). |
| **Referral Requests** | Structured "I need a plumber" requests sent to selected contacts; contacts can forward a trusted contact or resource. |
| **Consent-Aware Sharing** | When referring someone, request their consent before sharing their details with a third party. |
| **Household Identity** | Option to create household identities where a family shares a subset of contacts, trust tags, and resources. |
| **Emergency UX Shell** | Dedicated view with clear "Online vs Mesh" status and simple actions. |

**Why this fourth:** High-stakes features that must be tested carefully, including UX for non-technical users.

---

## Key Features (Detailed)

### 1. Individual- and Household-Centric Network

- No follower counts, feeds, or global popularity metrics.
- Option to create **household identities** where a family shares a subset of contacts, trust tags, and resources.
- Clear separation between:
  - Private notes and trust tags
  - Shared resources and referrals

### 2. Contact Representation

Each contact:

- Local ID
- Nostr public key (for messaging and verification)
- Display name and optional avatar
- Trust tags and referral metadata (local/private by default)
- Relationship notes ("how you met," context)
- Relationship history (Give/Lend/Promote/Recommend and messages)

### 3. Local Adoption Indicators

The app surfaces local density and progress toward resilience:

| Metric | Example Display Text |
| :-- | :-- |
| Active users in zip code | "24 neighbors nearby use Lendlee." |
| Coverage percentage | "You're 45% of the way to offline-ready coverage." |
| Threshold notification | "Almost there! Invite 6 more neighbors for mesh messaging." |
| Milestone celebration | "Your neighborhood is now ready for offline emergency messaging!" |

These indicators power the virality loop: the closer a neighborhood gets to mesh viability, the more motivated users are to invite others.

### 4. Mode Switching

Users can select how Lendlee routes messages:

| Mode | Path | When to Use |
| :-- | :-- | :-- |
| Online | Nostr over internet | Default, daily use and referrals. |
| Offline | Bluetooth mesh only | Known outages, events, drills. |
| Auto | Prefer online, fallback mesh | Long-term "just works" behavior for most users. |

### 5. Offline Mesh Messaging

Operating characteristics:

- BLE mesh similar to Bridgefy and other offline chat apps.
- ~50–100 m per hop open-air range; multi-hop required for real neighborhood reach.
- Delay-tolerant, queued, encrypted.

---

## User Flows

### Initial Adoption

1. User installs Lendlee and generates a Nostr identity (keys stay local).
2. User sets up basic profile and optionally a household.
3. User uses **Give/Lend/Promote/Recommend** to share something with a friend and sends it via SMS/WhatsApp.
4. Friend installs Lendlee via invite link; both now have each other as contacts in their private graphs.
5. User adds a trust tag or note to that contact ("close friend since college," "Great with kids").

### Daily Usage

1. User opens Lendlee to:
   - Manage items,
   - Message friends,
   - Add or respond to referral requests.
2. User sees local adoption status and maybe a prompt: "You're close to offline coverage—invite three more neighbors."
3. Over time, their network becomes a **living address book + trust graph + referral system**, not a feed.

### Emergency Scenario

1. Internet/cell network becomes unavailable, or user becomes aware of a local emergency.
2. User opens Lendlee and toggles Offline mode (or the red Emergency toggle in v2.5).
3. The app displays a clear banner: "Messaging via local mesh; range increases as more neighbors come online."
4. User sends messages or broadcasts; app routes via Bluetooth mesh, relaying through nearby Lendlee devices.
5. After an emergency, referrals and resource maps help coordinate **who can help with what**, anchored in pre-existing trust rather than anonymous broadcasts.

---

## Technical Architecture (High-Level)

### Identity and Messaging

- **Identity:** Locally stored Nostr keypair (public/private).
- **Addressing:** Public key used for routing and message signing.
- **Online Messaging:** Nostr clients embedded in Lendlee. Configurable relay list; defaults provided.
- **Encryption:** End-to-end encrypted DMs using Nostr's encrypted event types.

### Default Nostr Relays

```
wss://relay.damus.io
wss://relay.nostr.band
wss://nos.lol
wss://eden.nostr.land
wss://relay.shitdev.io
```

### Social Graph as User-Owned Data

- Represent contacts, trust tags, and referrals as signed events that can be exported or synced between devices/clients if the user chooses.
- Graph is not globally crawled or monetized; by default, it is local/private.

### Transport Layers (Priority Order)

| Priority | Layer | Protocol | Use Case |
|----------|-------|---------|----------|
| 1 | External Share | OS share intents | Inviting non-users; sharing items. |
| 2 | Online Messaging | Nostr over HTTPS/WebSocket | Day-to-day messaging. |
| 3 | Bluetooth Mesh | BLE mesh | Offline/local and emergency messaging. |
| 4 | Queued Delivery | Local storage | Delay-tolerant delivery and retries. |

---

## Privacy and Security Model

- No phone number required; identity is cryptographic, not tied to a centralized account.
- Messages are signed and, for DMs, end-to-end encrypted.
- Mesh payloads are encrypted; intermediate devices can relay but not read content.
- Local-only logs with ability to wipe via Triple-Tap Wipe gesture.
- Explicit opt-in for Bluetooth mesh participation, with clear explanation of benefits and battery implications.
- Trust tags and referral data are private by default; user controls what is shared.

---

## Competitive Differentiation

| Feature / Principle | Lendlee | Traditional Social Network | Messaging Apps | Emergency Apps |
| :-- | :-- | :-- | :-- | :-- |
| User-owned graph (portable keys) | ✅ | ❌ | ❌ | Rare |
| No algorithmic feed | ✅ | ❌ | ✅ | ✅ |
| Give/Lend/Promote/Recommend | ✅ | Partial | ❌ | ❌ |
| Offline mesh messaging | ✅ | ❌ | ❌ | ✅ |
| Household / family stewardship | ✅ | ❌ | ❌ | ❌ |
| Ad-free referral model | ✅ | ❌ | Rare | ❌ |
| Trust tags & structured referrals | ✅ | ❌ | ❌ | ❌ |
| Relationship notes | ✅ | Partial | Partial | ❌ |

---

## Success Metrics

| Phase | Timeline | Metric | Target |
|-------|----------|--------|--------|
| v1.0 | Months 1-2 | Downloads | 5,000 |
| v1.0 | Months 1-2 | Items shared (Give/Lend/Promote/Recommend) | 10,000 |
| v1.5 | Months 3-4 | Daily active users (DAU) | 2,000 |
| v1.5 | Months 3-4 | Messages sent (online) | 5,000 |
| v2.0 | Months 5-7 | Mesh-capable neighborhoods | 50 (as defined in Network Effect) |
| v2.0 | Months 5-7 | Unique Bluetooth relays/day | 1,000 |
| v2.5 | Months 8-10 | Emergency broadcast tests | 10 controlled community pilots |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Low adoption yields weak mesh | Strong local metrics and milestone messaging; focus on clusters, not global scale initially. |
| Bluetooth permissions and battery concerns | Clear value proposition UX; granular controls and low-power defaults. |
| Privacy concerns | No phone numbers, local-only data, strong encryption, triple-tap wipe. |
| Complexity overwhelm | Phased feature rollout; simple core flows for non-technical users. |
| Emergency features untested in real events | Simulated drills with partners (neighborhood orgs, schools) and iteration based on learnings. |

---

## Product Positioning

### For Marketing

**Headline:** "Your Neighborhood's Resilience App."

**Subheadline:** "Share, message, and stay connected. The more your community uses Lendlee, the stronger your offline emergency network becomes."

**Alternative Headline:** "The app that works for you, not on you."

### For Users

| Benefit | Message |
|---------|---------|
| Everyday | "Share items and knowledge with people you actually know." |
| Community | "See how many neighbors are on Lendlee and help reach offline-ready." |
| Emergency | "When the internet fails, your neighborhood keeps communicating." |
| Reclaim Control | "The app that works for you, not on you." |
| Trusted Referrals | "Your network, your recommendations, your rules." |

---

## Conclusion

Lendlee is a response to two decades of platforms capturing our relationships as their asset. It offers:

- A place where individuals and families **own and curate** their network, trust, and referrals.
- A protocol-aligned architecture (Nostr + mesh) that lets identity and graph live with the user, not on a single server.
- A product that is useful daily and becomes vital in emergencies.
- Give/Lend/Promote/Recommend for everyday sharing with trusted contacts.
- Trust tags and structured referral flows that respect user privacy.
- Household identity options for family coordination.

**The more we share and refer within our own networks, the more resilient—and self-determined—our communities become.**

---

*Document Version: 3.1*  
*Last Updated: April 2026*  
*Status: Product Requirements Document*