# Lendlee PRD: Decentralized Community Network

## Version 3.0 (Recommendations + Consumer-Owned Network)

---

## Executive Summary

Lendlee is not a social network. It is a user-driven platform where individuals invite their contacts to share resources, give recommendations, and communicate—gradually forming a resilient local network over time.

**Core differentiation:** The more your community uses Lendlee for everyday sharing and messaging, the stronger your emergency-ready mesh network becomes, using BitChat/Bridgefy-style Bluetooth mesh as a fallback when infrastructure fails.

---

## Problem Statement

1. **Current sharing apps** require internet, phone numbers, and centralized infrastructure that can fail or be shut down during crises.

2. **Traditional social networks** rely on public profiles, newsfeeds, and opaque algorithms that feel overwhelming and misaligned with close-knit, local relationships.

3. **Emergency communication tools** exist but deliver value only in crisis scenarios, so they struggle to maintain daily engagement and adoption.

4. **Social networks promised connection but became platforms.** What started as tools to stay connected with friends and family became advertising machines selling your attention. We lost control of our relationships—they became products to be monetized. Meanwhile, the trusted recommendations we once got from friends now get lost across too many fragmented channels (text, email, social DMs, etc.).

**The gap:** A tool that is valuable every day and essential in emergencies, without the cognitive and social overhead of a traditional social network—and one that actually helps you manage the trusted recommendations and referrals that matter to your family and community.

---

## Why Lendlee Exists

We believe the tools we use should work *for us*, not *on us*.

**You own your network.**

- Your contacts are people you choose, not algorithms suggesting content
- Your data stays on your device, not harvested for ad targeting
- Your recommendations and referrals flow to people you trust, not fed to strangers
- When your community adopts Lendlee, you gain a communication backbone that works even when infrastructure fails

The more your community shares, the more resilient your neighborhood becomes.

---

## Solution: Consumer-Initiated Community Platform

### The Approach

- Users download Lendlee and invite their own contacts through existing channels (SMS, WhatsApp, email, DMs).
- The app provides immediate everyday value via sharing and messaging between trusted contacts.
- A background Bluetooth mesh layer activates as local adoption grows, enabling offline messaging in dense areas.
- No public profiles, newsfeed, or follower graph required; everything is grounded in user-initiated relationships.

### The Network Effect

| Adoption Level | Value Delivered |
|---------------|-----------------|
| 1 user | Personal item tracking |
| 2-5 users | Share with friends and family |
| 10+ users (neighborhood) | Emergency broadcast becomes viable |
| 50+ users (neighborhood) | Practical offline mesh for multi-hop relay |

**"Mesh-capable neighborhood"** = a geographic cluster (e.g., one or more adjacent blocks) where, during typical waking hours, there are enough Lendlee devices within Bluetooth range (approximately 50-100m line-of-sight) and overlap to support multi-hop relay across the cluster.

---

## Core Features (Phased Roadmap)

### Phase 1: MVP - Sharing Foundation (v1.0)

**Primary function:** Give/Lend/Promote/Recommend sharing with external share.

| Feature | Description |
|---------|-------------|
| **Give** | Offer items/services for free, no return expected. |
| **Lend** | Track borrowed items with optional due dates and reminders. |
| **Promote** | Share resources, events, or knowledge with contacts. |
| **Recommend** | Trusted recommendations & referrals for local services; ask the community for referrals. |
| **External Share** | Native share sheet to Messages/WhatsApp/email for invites and item links. |
| **Email Auth** | Lightweight onboarding via email; no phone number required. |
| **Invite Link Tracking** | Track which shares convert to new installs (attribution). |

#### Recommend Sub-Features

| Sub-feature | Description |
|-------------|-------------|
| **Ask the Community** | Post a request: "Looking for a good plumber, anyone recommend one?" |
| **Share Recommendation** | Share a trusted local service provider (dentist, plumber, mechanic, tutor, etc.) |
| **Referral Attribution** | Track which recommendations result in business (opt-in) |

**Why this first:** Establish clear everyday value and natural invitations. Every share is an opportunity to invite new nodes into the network. Recommendations fill a gap that social media once served but now fails at—trusted advice from people you know.

---

### Phase 2: Everyday Messaging (v1.5)

**Primary function:** Online messaging between contacts.

| Feature | Description |
|---------|-------------|
| **Nostr Identity** | Auto-generated keypair; each user identified by a public key for messaging. |
| **Contact List** | Derived from people you've shared with or explicitly invited. |
| **Direct Messages** | Standard internet-based DMs via Nostr relays (1:1 and small groups). |
| **Invitations** | Deep links that bootstrap new users into a contact relationship. |
| **Local Adoption Badge** | Lightweight indicator such as "12 neighbors nearby using Lendlee." |
| **Invite Tracking** | See which contacts joined after your invitation. |

**Why this second:** Messaging drives daily engagement, which is necessary for adoption and later mesh viability.

---

### Phase 3: Offline Capability (v2.0)

**Primary function:** Bluetooth mesh for nearby offline communication.

| Feature | Description |
|---------|-------------|
| **Bluetooth Mesh** | BitChat/Bridgefy-style mesh; devices relay messages to extend range. |
| **Offline Mode** | Manual toggle that routes messages via Bluetooth when no internet is available. |
| **Peer Discovery** | Automatic discovery of nearby Lendlee nodes with Bluetooth enabled. |
| **Message Relay** | Multi-hop relay (e.g., up to 5-7 hops) across nearby devices. |
| **Queued Delivery** | Messages stored locally and forwarded when peers appear. |
| **Power Management** | Throttled mesh activity to minimize battery drain with user settings. |

**Why this third:** Requires meaningful local density plus more complex engineering and testing; should arrive after daily-use behavior is established.

---

### Phase 4: Emergency Ready (v2.5)

**Primary function:** Emergency communication when infrastructure fails.

| Feature | Description |
|---------|-------------|
| **Emergency Broadcast** | Single tap to send high-priority alerts to all reachable neighbors in mesh range. |
| **Location Channels** | Geohash-based local channels for area-wide coordination (e.g., by neighborhood). |
| **Resource Map** | Opt-in map showing shared items and resources available nearby (water, power, tools, etc.). |
| **Triple-Tap Wipe** | Panic gesture to locally wipe data and keys from the device. |
| **Emergency UX Shell** | Dedicated full-screen mode with clear status: "Messaging via mesh" vs "Messaging via internet." |

**Why this fourth:** High-stakes features that must be tested carefully, including UX for non-technical users.

---

## Key Features (Detailed)

### 1. Individual-Centric Network

- No public profiles, follower counts, or feed.
- Each user has a private graph of contacts they've invited, shared with, or messaged.
- Relationships are anchored in real interactions (Give/Lend/Promote/Recommend or DMs), not passive follows.

### 2. Contact Representation

Each contact is stored as a multi-context identity:

| Field | Purpose |
|-------|----------|
| Local identifier | Internal ID for app logic. |
| Nostr public key | For online messaging and identity verification. |
| Display name and avatar | Optional, locally customizable. |
| Trust score (v2+) | Derived from history (completed lends, recommendations given, message frequency, mutual contacts). Visible to user in contact details. |

This model allows the same contact to be used seamlessly for both online (Nostr relays) and offline (Bluetooth mesh) communication.

### 3. Local Adoption Indicators

The app surfaces local density and progress toward resilience:

| Metric | Example Display Text |
|--------|---------------------|
| Active users in zip code | "24 neighbors nearby use Lendlee." |
| Coverage percentage | "You're 45% of the way to offline coverage." |
| Threshold notification | "Almost there! Invite 6 more neighbors for offline messaging." |
| Milestone celebration | "Your neighborhood is now ready for offline messaging!" |

These indicators power the virality loop: the closer a neighborhood gets to mesh viability, the more motivated users are to invite others.

### 4. Mode Switching

Users can select how Lendlee routes messages:

| Mode | Communication Path | When to Use |
|------|-------------------|--------------|
| **Online** | Nostr relays over internet. | Default, daily messaging, normal conditions. |
| **Offline** | Force Bluetooth mesh only. | Known outages, events, or tests. |
| **Auto** | Prefer internet; opportunistically fall back to mesh and queued delivery when offline. | For users who want "it just works" behavior long term. |

The initial release will emphasize Online and Offline (manual toggle). Auto can be introduced once reliability and heuristics are validated.

### 5. Offline Mesh Messaging

Operating characteristics:

| Characteristic | Specification |
|---------------|---------------|
| Transport | Bluetooth Low Energy mesh, similar to Bridgefy and BitChat-style apps. |
| Range per hop | Roughly 50-100 meters in open or semi-open environments; less indoors or with heavy interference. |
| Multi-hop | Messages can traverse multiple devices (e.g., up to 5-7 hops) to reach a recipient across a neighborhood cluster. |
| Delay-tolerant | Messages queue on-device when no path is available and are forwarded when compatible peers appear. |
| Power-awareness | Mesh activity is throttled to minimize battery drain, with clear settings for users. |

**Expectation framing:** Effective neighborhood coverage requires both sufficient density and users with Bluetooth enabled; Lendlee explicitly communicates this tradeoff via local adoption indicators.

---

## User Flows

### Initial Adoption

1. User installs Lendlee.
2. App generates a Nostr keypair and stores keys locally.
3. User completes lightweight onboarding (name, optional avatar, email auth).
4. User creates a Give, Lend, Promote, or Recommend post.
5. User shares the post externally via the native share sheet (SMS/WhatsApp/email) which includes an invite link.
6. Invitee taps the link, installs Lendlee, and is automatically added as a contact.

### Daily Usage

1. User opens Lendlee to manage items: Give/Lend/Promote/Recommend.
2. User messages contacts with standard online DMs (Nostr over internet).
3. Home screen shows local adoption stats and progress toward offline coverage.
4. User occasionally invites more neighbors/friends, especially when close to a milestone (e.g., "90% to offline-ready").

### Emergency Scenario

1. Internet/cell network becomes unavailable, or user becomes aware of a local emergency.
2. User opens Lendlee and toggles Offline mode (or the red Emergency toggle in v2.5).
3. The app displays a clear banner: "Messaging via local mesh; range increases as more neighbors come online."
4. User sends messages or broadcasts; app routes via Bluetooth mesh, relaying through nearby Lendlee devices.
5. As connectivity returns, messages can optionally sync back to online relays for continuity.

---

## Technical Architecture (High-Level)

### Identity and Messaging

| Component | Specification |
|-----------|----------------|
| **Identity** | Locally stored Nostr keypair (public/private). |
| **Addressing** | Public key used for routing and message signing. |
| **Online Messaging** | Nostr clients embedded in Lendlee. Configurable relay list; defaults provided. |
| **Encryption** | End-to-end encrypted DMs using Nostr's encrypted event types. |

### Default Nostr Relays

```
wss://relay.damus.io
wss://relay.nostr.band
wss://nos.lol
wss://eden.nostr.land
wss://relay.shitdev.io
```

### Transport Layers (Priority Order)

| Priority | Layer | Protocol | Use Case |
|----------|-------|---------|----------|
| 1 | External Share | OS share intents | Inviting non-users; sharing items. |
| 2 | Online Messaging | Nostr over HTTPS/WebSocket | Day-to-day messaging. |
| 3 | Bluetooth Mesh | BLE mesh | Offline/local and emergency messaging. |
| 4 | Queued Delivery | Local storage | Delay-tolerant delivery and retries. |

A routing module decides which layer to use based on mode (Online/Offline/Auto), transport availability, and message type.

---

## Privacy and Security Model

- No phone number required; identity is cryptographic, not tied to a centralized account.
- Messages are signed and, for DMs, end-to-end encrypted.
- Mesh payloads are encrypted; intermediate devices can relay but not read content.
- Local-only logs with ability to wipe via Triple-Tap Wipe gesture.
- Explicit opt-in for Bluetooth mesh participation, with clear explanation of benefits and battery implications.

---

## Competitive Differentiation

| Feature | Lendlee | Traditional Social Network | Venmo | Emergency App (typical) |
|---------|---------|---------------------------|-------|----------------------|
| Give/Lend/Promote/Recommend | ✅ | ❌ | ❌ | ❌ |
| No Phone Number Required | ✅ | ❌ | ❌ | ❌ |
| Decentralized Identity | ✅ | ❌ | ❌ | Rare |
| Offline Mesh Messaging | ✅ | ❌ | ❌ | ✅ |
| Local Adoption Metrics | ✅ | ❌ | ❌ | ❌ |
| Consumer-Initiated Graph | ✅ | ❌ (algorithmic feeds) | N/A | ❌ |
| Daily Value + Emergency | ✅ | Partial | Partial | Rare |
| Trusted Recommendations | ✅ | ❌ | ❌ | ❌ |

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

### For Users

| Benefit | Message |
|---------|---------|
| Everyday | "Share items and knowledge with people you actually know." |
| Community | "See how many neighbors are on Lendlee and help reach offline-ready." |
| Emergency | "When the internet fails, your neighborhood keeps communicating." |
| Reclaim Control | "The app that works for you, not on you." |

---

## Conclusion

Lendlee is a consumer-initiated tool that becomes more powerful as adoption grows. By combining everyday sharing, trusted recommendations, and messaging with BitChat/Bridgefy-style offline mesh capability, it creates infrastructure that communities build for themselves—useful today, essential tomorrow.

**The more we share, the more resilient our community becomes.**

---

*Document Version: 3.0*  
*Last Updated: April 2026*  
*Status: Product Requirements Document*