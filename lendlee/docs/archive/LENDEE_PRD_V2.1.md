# Lendlee PRD: Decentralized Community Network

## Version 2.1 (Updated)

---

## Executive Summary

Lendlee is not a social network. It is a user-driven platform where individuals invite their contacts to share resources and communicate. The app becomes more powerful as adoption grows, without requiring public profiles, newsfeeds, or centralized infrastructure.

**Core Differentiation:** The more your community uses Lendlee for everyday sharing and messaging, the stronger your emergency-ready mesh network becomes.

---

## Problem Statement

1. **Current sharing apps** require internet, phone numbers, and centralized infrastructure that fail in emergencies.

2. **Traditional social networks** require public profiles, newsfeeds, and network effects that feel overwhelming.

3. **Emergency communication tools** exist but are only useful in crisis - not in daily life.

**The Gap:** A tool that is valuable daily and essential in emergencies, without the overhead of a social network.

---

## Solution: Consumer-Initiated Community Platform

### The Approach

- Users download the app and invite their contacts through existing channels (SMS, WhatsApp, email)
- The app provides everyday sharing and messaging value
- Background mesh networking activates as local adoption grows
- No public profiles, no newsfeed, no social network required

### The Network Effect

| Adoption Level | Value Delivered |
|----------------|-----------------|
| 1 user | Personal item tracking |
| 2-5 users | Share with friends/family |
| 10+ users (neighborhood) | Emergency broadcast viable |
| 50+ users (neighborhood) | Full offline mesh capability |

---

## Core Features (Phased)

### Phase 1: MVP - Sharing Foundation (v1.0)

**Primary Function:** Give/Lend/Promote sharing with external share

| Feature | Description |
|---------|-------------|
| **Give** | Free items, no return |
| **Lend** | Borrow and return |
| **Promote** | Share resources/events/knowledge |
| **External Share** | Native share to Messages/WhatsApp |
| **Email Auth** | No phone number required |

**Why this first:** The sharing core gives users immediate value and creates natural contact invitations.

---

### Phase 2: Everyday Messaging (v1.5)

**Primary Function:** Online messaging between contacts

| Feature | Description |
|---------|-------------|
| **Nostr Identity** | Decentralized keys (no phone number) |
| **Contact List** | People you've shared with |
| **Direct Messages** | Standard internet messaging via Nostr |
| **Invitations** | Deep links to invite contacts |
| **Local Adoption Badge** | "12 neighbors nearby using Lendlee" |

**Why this second:** Messaging creates daily engagement. The contact list builds the network.

---

### Phase 3: Offline Capability (v2.0)

**Primary Function:** Bluetooth mesh for emergencies

| Feature | Description |
|---------|-------------|
| **Bluetooth Mesh** | Peer-to-peer when nearby |
| **Offline Mode** | Works without internet |
| **Peer Discovery** | Automatic neighbor detection |
| **Message Relay** | Multi-hop through nearby devices |

**Why this third:** Only activates when local adoption threshold reached. Requires more users.

---

### Phase 4: Emergency Ready (v2.5)

**Primary Function:** Emergency communication when infrastructure fails

| Feature | Description |
|---------|-------------|
| **Emergency Broadcast** | Alert all neighbors |
| **Location Channels** | Geohash-based geographic chat |
| **Resource Map** | Who has what nearby |
| **Triple-Tap Wipe** | Instant data deletion |

---

## Key Features (Detailed)

### 1. Individual-Centric Network

- No public profiles
- No newsfeed
- No following/followers
- Each user has contacts they've personally invited or shared with

### 2. Contact Representation

- Each contact mapped to:
  - Unique identifier (local)
  - Nostr public key (for online messaging)
  - Display name (optional)
  - Trust score (based on interaction history)

### 3. Local Adoption Indicators

The app displays local adoption metrics:

| Metric | Display |
|--------|---------|
| Active users in zip code | "24 neighbors nearby" |
| Coverage percentage | "45% toward offline coverage" |
| Threshold notification | "Almost at full offline coverage!" |
| Milestone celebration | "Your neighborhood is ready for offline messaging!" |

### 4. Mode Switching

Users can toggle between:

| Mode | Communication Path | When to Use |
|------|-------------------|-------------|
| **Online** | Internet via Nostr relays | Default, daily use |
| **Offline** | Bluetooth mesh | Emergencies, no internet |
| **Auto** | System decides | Background preference |

### 5. Offline Mesh Messaging

- Manual toggle to activate offline mode
- Bluetooth range: 10-30 meters per hop
- Maximum 7 hops for message relay
- Messages queue when offline and deliver when connected

---

## User Flow

### Initial Adoption

1. User downloads Lendlee
2. Creates Nostr identity (auto-generated keys)
3. Invites friends via SMS/WhatsApp (deep link)
4. Starts sharing items (gives value immediately)

### Daily Usage

1. Opens app for sharing Give/Lend/Promote
2. Optionally messages contacts via Nostr
3. Sees local adoption stats (encourages more invites)
4. Continues normal communication

### Emergency Scenario

1. Internet goes down or emergency occurs
2. User switches to Offline mode (manual toggle)
3. App forms Bluetooth mesh with nearby Lendlee users
4. Messages hop through neighborhood mesh
5. Emergency broadcast reaches all connected neighbors

---

## Technical Architecture

### Transport Layers (Priority Order)

| Priority | Layer | Protocol | Use Case |
|----------|-------|----------|----------|
| 1 | External Share | Native Share | Sharing items to non-users |
| 2 | Online Messaging | Nostr (Internet) | Day-to-day contact messaging |
| 3 | Bluetooth Mesh | BLE (Offline) | Emergency communication |
| 4 | Queued | Local storage | Retry when reconnected |

### Privacy Model

- No phone numbers
- No accounts (local identity only)
- No public profiles
- Opt-in mesh networking (off by default)
- Triple-tap emergency wipe

---

## Competitive Differentiation

| Feature | Lendlee | Traditional Social Network | Venmo | Emergency App |
|---------|---------|---------------------------|-------|---------------|
| Give/Lend/Promote | ✅ | ❌ | ❌ | ❌ |
| No Phone Number | ✅ | ❌ | ❌ | ❌ |
| Offline Messaging | ✅ | ❌ | ❌ | ✅ |
| Local Adoption Metrics | ✅ | ❌ | ❌ | ❌ |
| Consumer-Initiated | ✅ | ❌ | N/A | ❌ |
| Daily Value | ✅ | ✅ | ✅ | ❌ |

---

## Success Metrics

| Phase | Timeline | Metric | Target |
|-------|----------|--------|--------|
| v1.0 | Month 1-2 | Downloads | 5,000 |
| v1.0 | Month 1-2 | Items shared | 10,000 |
| v1.5 | Month 3-4 | Daily active users | 2,000 |
| v1.5 | Month 3-4 | Messages sent | 5,000 |
| v2.0 | Month 5-7 | Mesh-capable neighborhoods | 50 |
| v2.0 | Month 5-7 | Bluetooth connections | 1,000 |
| v2.5 | Month 8-10 | Emergency broadcasts (tests) | 10 |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Low adoption = no mesh | Show local adoption metrics to encourage invites |
| Bluetooth permissions | Clear value prop, explain use case |
| Privacy concerns | Transparent, local-only data, triple-tap wipe |
| Complexity overload | Phase features, show value incrementally |
| Emergency mode untested | Conduct controlled tests, iterate |

---

## Product Positioning

### For Marketing

**Headline:** "Your Neighborhood's Resilience App"

**Subheadline:** "Share, message, and stay connected. The more your community uses Lendlee, the stronger your emergency-ready network becomes."

### For Users

| Benefit | Message |
|----------|---------|
| Everyday | "Share items with friends. Message when you want." |
| Community | "See how many neighbors use Lendlee." |
| Emergency | "When internet fails, your neighborhood keeps communicating." |

---

## Conclusion

Lendlee is not a social network. It is a consumer-initiated tool that becomes more powerful as adoption grows. By combining everyday sharing value with emergency offline capability, we create a product people want to use today and need tomorrow.

**The more we share, the more resilient our community becomes.**

---

*Document Version: 2.1*  
*Last Updated: April 2026*  
*Status: Product Requirements Document*