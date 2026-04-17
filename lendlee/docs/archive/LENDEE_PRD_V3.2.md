# Lendlee PRD: User-Owned Community Network

## Version 3.2 (Native-First Architecture)

---

## Executive Summary

Lendlee is not a social network. It is a user-owned relationship and resilience tool where individuals and families manage their own networks, share resources, and stay connected—online and offline—without becoming the product.

**Core differentiation:**

1. **Everyday value:** Give/Lend/Promote/Recommend, messaging, and trusted referrals among people you actually know.
2. **Structural value:** Your social graph and trust live with you, not a platform, backed by decentralized identity (Nostr).
3. **Resilience value:** The more your community uses Lendlee, the stronger your emergency-ready Bluetooth mesh network becomes.

**Architecture:** Native-first (Swift + Kotlin) with direct hardware access for BLE mesh and HSM-backed security.

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
- Architecture is built on a **distributed system** mindset—the app is a node in a protocol, not just a client for a database.

### The Approach

- Users download Lendlee and invite their contacts via existing channels (SMS, WhatsApp, email).
- Core flows focus on **Give/Lend/Promote/Recommend**, messaging, and structured referrals.
- The app uses Nostr for decentralized identity and online messaging.
- A BitChat/Bridgefy-style Bluetooth mesh layer provides offline messaging when local density is sufficient.
- No public profiles, follow counts, or algorithmic feeds.
- **Native-first architecture** for direct hardware access (BLE, HSM) without JavaScript bridge overhead.

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

### Phase 0: Technical PoC (Pre-v1.0)

**Primary function:** Validate highest-risk technical components before full development.

| Feature | Description |
| :-- | :-- |
| **BLE Mesh PoC** | Direct CoreBluetooth (iOS) / BluetoothAdapter (Android) access for mesh between 5+ devices. |
| **HSM Key Gen** | Secure Enclave (iOS) / StrongBox (Android) key generation. |
| **Transport Abstraction** | Unified interface for Nostr relay vs. BLE mesh transport selection. |

**Why this first:** BLE mesh is the core differentiator but highest technical risk. Validate early before investing in UI.

---

### Phase 1: Identity & Local Graph (v1.0)

**Primary function:** Nostr identity, local-first storage, and basic sharing.

| Feature | Description |
| :-- | :-- |
| **Nostr Identity** | Auto-generated secp256k1 keypair in HSM; public key = identity. |
| **BIP-39 Mnemonic** | 12/24-word backup phrase for key recovery. |
| **Local Storage** | SQLCipher encrypted SQLite for local-first data. |
| **Give/Lend/Promote/Recommend** | Core sharing features. |
| **External Share** | Native share sheet to Messages/WhatsApp/email. |
| **Email Auth** | Lightweight onboarding via email; no phone number required. |
| **Relationship Notes** | Private notes per contact. |

---

### Phase 2: Messaging & User-Owned Graph (v1.5)

**Primary function:** Online messaging and graph visualization.

| Feature | Description |
| :-- | :-- |
| **Direct Messages** | Encrypted DMs via Nostr relays (NIP-04/44). |
| **Contact List** | Built from people you've shared with, messaged, or added. |
| **User-Owned Graph View** | Visualization of your network living locally. |
| **Local Adoption Badge** | "12 neighbors nearby use Lendlee." |
| **Invitations** | Deep links that bootstrap contact relationships. |
| **FlatBuffers** | Efficient binary format for local storage and mesh transmission (up to 40% smaller than JSON). |

---

### Phase 3: Offline Mesh Messaging (v2.0)

**Primary function:** Bluetooth mesh for offline communication.

| Feature | Description |
| :-- | :-- |
| **Constrained Flooding** | Distance-vector routing with local routing table (1-hop, 2-hop neighbors). |
| **L2CAP Channels** | Higher throughput, lower power than GATT for iOS BLE. |
| **Sliding Window Deduplication** | Constant-memory deduplication vs. growing Bloom filter. |
| **Offline Mode** | Manual toggle to force BLE mesh when internet unavailable. |
| **Peer Discovery** | Background detection of nearby Lendlee nodes. |
| **Queued Delivery** | Store-and-forward when peers come into range. |
| **Vanishable Headers** | Routing metadata cryptographically wiped after hop acknowledgment. |

---

### Phase 4: Emergency Ready & Enhanced Referrals (v2.5)

**Primary function:** Emergency communication, resource coordination, and structured referrals.

| Feature | Description |
| :-- | :-- |
| **Emergency Broadcast** | One-tap broadcast to all reachable neighbors. |
| **Location Channels** | Geohash-based channels for area-wide coordination. |
| **Resource Map** | Opt-in, privacy-aware map of resources nearby. |
| **Triple-Tap Wipe** | Cryptographic erase (delete master key from HSM). |
| **Trust Tags** | Per-contact tags in private graph. |
| **Referral Requests** | Structured "I need X" requests to selected contacts. |
| **Consent-Aware Sharing** | Request consent before sharing contact details. |
| **Household Identity** | Family shares contacts, trust tags, resources. |
| **Shamir Secret Recovery** | Encrypted peer-to-peer backup via trusted contacts. |

---

## Technical Architecture (Native-First)

### Platform Strategy

| Component | iOS | Android |
|-----------|-----|---------|
| **Language** | Swift | Kotlin |
| **UI Framework** | SwiftUI + Combine | Jetpack Compose + Flow |
| **Bluetooth** | CoreBluetooth (direct) | BluetoothAdapter (direct) |
| **Security** | Secure Enclave | StrongBox / Keystore |
| **Storage** | SQLite + SQLCipher | SQLite + SQLCipher |

**Rationale:** Direct hardware access without JS bridge overhead. Native-first enables proper background BLE modes and HSM integration.

### Identity & Keys

- **Key Generation:** secp256k1 keypair generated directly in Secure Enclave (iOS) / StrongBox (Android)
- **Private key never leaves hardware** - operations happen inside HSM
- **Backup:** BIP-39 mnemonic (12/24 words)
- **Recovery:** Shamir Secret Sharing - encrypted fragments stored by trusted contacts

### Local Storage

- **Database:** SQLite with SQLCipher encryption
- **Format:** FlatBuffers for mesh transmission (reduces BLE packet overhead)
- **Data stored:** Contacts, trust tags, messages, items, relationship notes

### Nostr Integration

**NIPs Used:**
- NIP-01: Basic protocol (events, signatures)
- NIP-02: Follows (contact edges)
- NIP-04/44: Encrypted DMs
- NIP-32: Labels (trust tags - proposed)
- NIP-65: Relay list metadata

**Default Relays:**
```
wss://relay.damus.io
wss://relay.nostr.band
wss://nos.lol
wss://eden.nostr.land
wss://relay.shitdev.io
```

### Transport Layer

| Mode | Path | Use Case |
|------|------|----------|
| **Online** | Nostr relay (WebSocket) | Default, daily messaging |
| **Offline** | BLE mesh only | Outages, emergencies |
| **Auto** | Prefer online, fallback mesh | "Just works" behavior |

**Routing Logic:**
```
T_select = Online if internet available
         = Offline if no internet AND BLE available
         = Queue if neither available
```

### Minimal Backend

- **Relay Seed List:** Bootstrap list of trusted Nostr relays
- **Update Check:** NIP-45 (Event Counts) or HTTP endpoint for version compatibility
- **Analytics:** Privacy-preserving aggregated telemetry only

---

## Security & Privacy

### Key Management

- Keys generated and stored in HSM (Secure Enclave / StrongBox)
- All cryptographic operations happen inside HSM
- Private key never exported to software

### Encryption

- **Content:** NIP-44 (Diffie-Hellman + XChaCha20-Poly1305)
- **Mesh Metadata:** Vanishable headers - wiped after hop acknowledgment
- **Routing:** Destination pubkey hash only, not full keys

### Wipe Flow

1. Triple-tap triggers cryptographic erase
2. Master key deleted from HSM
3. All local data rendered unrecoverable
4. Optional: broadcast key revocation to relays

### Privacy Principles

- No phone number required
- Local-first: graph stored locally, not on server
- On-chain referrals (web3 layer) are opt-in only
- No algorithmic feed or engagement optimization

---

## User Flows

### Initial Adoption

1. User installs Lendlee; app generates Nostr keypair in HSM
2. User shown BIP-39 mnemonic for backup (with clear recovery instructions)
3. User sets up profile, optionally creates household
4. User creates Give/Lend/Promote/Recommend post
5. User shares via native share sheet (includes invite link)
6. Invitee installs via link; both added to each other's contact graphs

### Daily Usage

1. User manages items, messages contacts, responds to referrals
2. App shows local adoption status: "You're 45% to mesh-ready"
3. Network grows as living address book + trust graph + referral system

### Emergency Scenario

1. Internet/cell unavailable
2. User toggles Offline mode or Emergency
3. App shows: "Messaging via local mesh"
4. Messages route via BLE mesh, relaying through neighbors
5. Resource map helps coordinate help based on pre-existing trust

---

## Success Metrics

| Phase | Timeline | Metric | Target |
|-------|----------|--------|--------|
| Phase 0 | Month 1 | BLE PoC validation | 5+ devices mesh connectivity |
| v1.0 | Months 2-3 | Downloads | 5,000 |
| v1.0 | Months 2-3 | Items shared | 10,000 |
| v1.5 | Months 4-5 | DAU | 2,000 |
| v1.5 | Months 4-5 | Messages sent | 5,000 |
| v2.0 | Months 6-8 | Mesh-capable neighborhoods | 50 |
| v2.0 | Months 6-8 | Unique BLE relays/day | 1,000 |
| v2.5 | Months 9-10 | Emergency broadcast tests | 10 pilots |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| iOS background BLE restrictions | Use L2CAP channels, frequent sync windows, critical alerts |
| Low mesh density | Strong local adoption metrics; focus on cluster growth |
| Key recovery UX friction | Clear mnemonic flow; Shamir-based social recovery option |
| Relay metadata exposure | Privacy-preserving relay selection; Tor option |
| Complexity overwhelm | Phased rollout; non-technical user focus |

---

## Competitive Differentiation

| Feature / Principle | Lendlee | Traditional Social Network | Messaging Apps | Emergency Apps |
| :-- | :-- | :-- | :-- | :-- |
| Native-first architecture | ✅ | ❌ | Partial | ❌ |
| User-owned graph (HSM-backed) | ✅ | ❌ | ❌ | Rare |
| No algorithmic feed | ✅ | ❌ | ✅ | ✅ |
| Give/Lend/Promote/Recommend | ✅ | Partial | ❌ | ❌ |
| BLE mesh (direct hardware) | ✅ | ❌ | ❌ | ✅ |
| Household stewardship | ✅ | ❌ | ❌ | ❌ |
| Shamir-based recovery | ✅ | ❌ | ❌ | ❌ |
| FlatBuffers efficiency | ✅ | ❌ | ❌ | ❌ |

---

## Product Positioning

### For Marketing

**Headline:** "Your Neighborhood's Resilience App."

**Subheadline:** "Native-first community network. Share, message, stay connected—even when infrastructure fails."

**Alternative:** "The app that works for you, not on you."

### For Users

| Benefit | Message |
|---------|---------|
| Everyday | "Share items and knowledge with people you actually know." |
| Community | "See how many neighbors are on Lendlee and help reach offline-ready." |
| Emergency | "When the internet fails, your neighborhood keeps communicating." |
| Reclaim Control | "The app that works for you, not on you." |
| Trusted Referrals | "Your network, your recommendations, your rules." |
| Security | "Your keys, your data. Hardware-backed security." |

---

## Conclusion

Lendlee is a response to two decades of platforms capturing our relationships as their asset. By building native-first with direct hardware access, we create:

- A **distributed system** where the app is a node in a protocol
- **Hardware-backed identity** with HSM-stored keys
- **Native BLE mesh** without JavaScript bridge overhead
- A product useful daily and vital in emergencies

**The more we share and refer within our own networks, the more resilient—and self-determined—our communities become.**

---

*Document Version: 3.2*  
*Last Updated: April 2026*  
*Status: Product Requirements Document*
*Changes from v3.1:* Added native-first architecture (Swift/Kotlin), Phase 0 PoC, HSM-backed security, Shamir recovery, FlatBuffers, Sliding Window deduplication, L2CAP channels, Vanishable Headers.