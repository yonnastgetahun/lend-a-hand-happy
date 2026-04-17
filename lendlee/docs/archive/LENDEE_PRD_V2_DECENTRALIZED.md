# Lendlee PRD: Decentralized Community Network

## Overview

**Product Name:** Lendlee  
**Version:** 2.0  
**Type:** Mobile App (iOS) + Web  
**Vision:** The sharing app that builds neighborhood resilience through decentralized, offline-capable communication.

---

## Problem Statement

Current sharing apps require internet, phone numbers, and centralized infrastructure. When emergencies strike, these systems fail. Communities need a sharing platform that works offline, requires no personal data, and becomes more valuable as adoption grows.

---

## Solution

Lendlee combines Give/Lend/Promote sharing with decentralized communication technology. Every share builds a network of trust that enables offline messaging when infrastructure fails.

---

## Core Features

### Phase 1: Sharing (MVP)
- **Give** - Free items, no return expected
- **Lend** - Borrow and return items
- **Promote** - Share resources/events/knowledge
- **External Share** - Opens native share sheet (Messages, WhatsApp)
- **Email Auth** - No phone number required

### Phase 2: Connection Layer
- **Nostr Identity** - Decentralized keys, no personal data
- **Neighbors List** - People you've interacted with
- **Profile** - Optional, name only, no phone/email

### Phase 3: Mesh Infrastructure
- **Bluetooth Mesh** - Peer-to-peer when nearby
- **Offline Mode** - Works without internet
- **Peer Discovery** - Automatic neighbor detection
- **Message Relay** - Multi-hop through nearby devices

### Phase 4: Emergency Ready
- **Emergency Broadcast** - Alert neighbors offline
- **Location Channels** - Geohash-based geographic chat
- **Resource Map** - Who has what nearby during emergencies
- **Triple-Tap Wipe** - Instant data deletion for safety

---

## Technical Architecture

### Transport Layers
| Layer | Protocol | Use Case |
|-------|-----------|----------|
| **Primary** | External Share | Give/Lend/Promote to Messages/WhatsApp |
| **Secondary** | Nostr | Internet-based messaging, decentralized identity |
| **Tertiary** | Bluetooth LE Mesh | Offline local communication |

### Privacy Model
- No accounts required
- No phone numbers
- No persistent identifiers
- Nostr keys generated locally
- Triple-tap emergency wipe
- Opt-in mesh networking (off by default)

### Data Flow
```
User Action → Share Intent → Select Mode → (External Share) OR (Mesh/Nostr)
```

---

## User Experience

### Onboarding
1. Download app
2. Create Nostr identity (auto-generated keys)
3. Optional: Set display name
4. Enable "Community Mode" for mesh features
5. Start sharing

### Sharing Flow
1. Tap "+" to add item
2. Select: Give / Lend / Promote
3. Add photo + details
4. Choose recipient or "Community"
5. Share internally or via native share sheet

### Communication Flow
- **Internal:** When both users have Lendlee + opted into mesh
- **External:** When recipient does not have app, falls back to native share
- **Offline:** Messages queue and deliver when mesh connects

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Downloads (Launch) | 10,000 |
| Monthly Active Users | 5,000 |
| Items Shared per Month | 20,000 |
| Mesh Network Nodes | 1,000 |
| Emergency Mode Activations | Test only |
| Privacy Incidents | 0 |

---

## Competitive Differentiation

| Feature | Lendlee | Venmo | WhatsApp | BitChat |
|---------|---------|-------|----------|---------|
| Give/Lend/Promote | ✅ | ❌ | ❌ | ❌ |
| Offline Messaging | ✅ | ❌ | ❌ | ✅ |
| No Phone Number | ✅ | ❌ | ❌ | ✅ |
| Decentralized | ✅ | ❌ | ❌ | ✅ |
| Emergency Ready | ✅ | ❌ | ❌ | ✅ |
| Location Channels | ✅ | ❌ | ✅ | ✅ |

---

## Phased Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| **v1.0** | Month 1-3 | MVP: Give/Lend/Promote + external share |
| **v1.5** | Month 4-6 | Nostr identity + basic messaging |
| **v2.0** | Month 7-9 | Bluetooth mesh + offline mode |
| **v2.5** | Month 10-12 | Emergency broadcast + location channels |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-------------|
| Bluetooth permissions | Clear value prop, opt-in, explain use case |
| Complexity of mesh | Phase rollout, show value incrementally |
| Privacy concerns | Transparent, no data collection, local-only |
| Adoption barrier | Lead with sharing, add communication later |

---

## Conclusion

Lendlee becomes the first sharing app that doubles as emergency infrastructure. By combining Give/Lend/Promote with decentralized mesh technology, we create a product that is valuable today and essential tomorrow.

**The more we share, the stronger our community becomes.**

---

*Prepared by: Lendlee Product Team*  
*Date: April 2026*