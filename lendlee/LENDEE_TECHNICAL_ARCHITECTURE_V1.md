# Lendlee v3 Technical Architecture

## Native-First, Distributed System Design

---

## Overview

Lendlee v3 shifts from a "web-wrapper" mindset to a **distributed system** architecture. The app becomes a node in a protocol—not just a client for a database.

$$\boxed{\text{Architecture} = \text{Native JNI/Swift} + \text{L2CAP Mesh} + \text{Hardware-Bound Identity}}$$

---

## 1. Platform Strategy

### Native-First Design

| Platform | Language | UI Framework | Security |
|----------|----------|--------------|----------|
| iOS | Swift | SwiftUI + Combine | Secure Enclave |
| Android | Kotlin | Jetpack Compose + Flow | StrongBox / Keystore |

**Rationale:**
- Direct access to CoreBluetooth (iOS) and BluetoothAdapter (Android) without JS bridge serialization overhead
- Native background modes and Critical Alerts for resilient mesh
- HSM-backed key operations that never leave hardware

### Architecture Pattern

**Unidirectional Data Flow (UDF)**
- State flows in one direction (Model → View)
- User actions trigger state changes
- Enables deterministic testing and clear debugging

---

## 2. Identity & Key Management

### Key Generation

```
secp256k1 keypair generated inside Secure Enclave (iOS) / StrongBox (Android)
Private key: NEVER exported to software
Operations: HSM performs signing internally
```

### BIP-39 Mnemonic

- 12 or 24-word seed phrase
- Derivation path: BIP-44 for Nostr compatibility
- User responsible for backup (paper, encrypted file)

### Social Recovery (Shamir Secret Sharing)

Instead of cloud backup:
1. Split mnemonic into N fragments using Shamir's Secret Sharing
2. Distribute fragments to trusted contacts
3. Recovery requires threshold K fragments from contacts
4. Eliminates third-party dependency

---

## 3. Local Storage

### Database: SQLite + SQLCipher

- All data encrypted at rest with device-derived key
- Local-first: full graph stored on-device
- No mandatory sync to any server

### Format: FlatBuffers

- Binary serialization (vs JSON)
- Up to 40% smaller payload
- Critical for BLE MTU limits (~251 bytes)

### Data Model

```
├── contacts (pubkey, display_name, avatar, created_at)
├── trust_tags (contact_pubkey, tag, created_at)
├── messages (id, sender, recipient, content_encrypted, timestamp, sync_status)
├── items (id, type, title, description, status, created_at)
├── referrals (requester_pubkey, category, status, created_at)
└── notes (contact_pubkey, content, created_at)
```

---

## 4. Nostr Integration

### NIPs Implemented

| NIP | Purpose |
|-----|---------|
| NIP-01 | Basic protocol (events, signatures, filters) |
| NIP-02 | Follows (contact edges) |
| NIP-04 | Encrypted DMs |
| NIP-44 | Updated encryption (XChaCha20-Poly1305) |
| NIP-32 | Labels (trust tags) - proposed |
| NIP-65 | Relay list metadata |

### Default Relays

```
wss://relay.damus.io
wss://relay.nostr.band
wss://nos.lol
wss://eden.nostr.land
wss://relay.shitdev.io
```

### Client Implementation

- Embedded Nostr client (no external dependency)
- Configurable relay list per user
- Gossip-based relay discovery via NIP-65

---

## 5. BLE Mesh Protocol

### Protocol: Constrained Flooding

**Distance-Vector Routing:**
- Each node maintains routing table of 1-hop and 2-hop neighbors
- Forward based on shortest path to destination
- TTL-based packet expiration

### iOS Considerations

**Challenge:** Apple heavily restricts background BLE

**Solutions:**
1. L2CAP Channels - higher throughput, lower power than GATT
2. Bluetooth Central + Peripheral background modes
3. Frequent foreground "sync windows"
4. Critical Alerts for emergency messaging

### Android Considerations

- More permissive but requires battery optimization whitelist
- Use BluetoothAdapter directly, no system service dependency

### Deduplication: Sliding Window Log

Instead of growing Bloom filter:
- Maintain fixed-size log of last N message hashes
- Constant memory usage
- Configurable N based on device capabilities

### Message Format

```
Mesh Packet:
├── header (ttl, hop_limit, message_id)
├── routing (prev_hop, next_hop_hash)
└── payload (encrypted_nostr_event)
```

### Store-and-Forward

- Messages cached with unique SHA-256 hash
- Forwarded when compatible peer appears
- Deduplicated at each hop

---

## 6. Transport Layer

### Priority Function

```
T_select = Nostr Relay    if Online
         = BLE Mesh       if Offline
         = Queue          if Neither
```

### Mode: Online

- WebSocket connection to Nostr relays
- Default for daily messaging
- End-to-end encrypted (NIP-44)

### Mode: Offline

- Force BLE mesh only
- Manual toggle by user
- For known outages, events, tests

### Mode: Auto

- Prefer internet, opportunistically fall back to mesh
- "Just works" behavior for most users

### Reconciliation

When returning online:
- Use Negentropy (set reconciliation protocol)
- Upload queued messages to relays
- Fetch any missed messages

---

## 7. Security Architecture

### Hardware Security Module (HSM)

| Platform | HSM |
|----------|-----|
| iOS | Secure Enclave |
| Android | StrongBox (preferred) / Keystore (fallback) |

### Encryption Stack

| Layer | Algorithm | Purpose |
|-------|-----------|---------|
| Storage | AES-256-SQLCipher | Data at rest |
| DMs | XChaCha20-Poly1305 (NIP-44) | End-to-end content |
| Mesh | XChaCha20-Poly1305 | Relay payload |
| Metadata | Vanishable headers | Routing info |

### Vanishable Headers

1. Packet includes routing header (destination hash)
2. Intermediate node forwards packet
3. After ACK, routing header cryptographically wiped from RAM
4. Node cannot be compelled to reveal routing history

### Wipe Flow

1. User triggers Triple-Tap (panic gesture)
2. App deletes master key from HSM
3. All local data rendered unrecoverable
4. Optional: broadcast key revocation to relays

---

## 8. Phased Implementation

| Phase | Focus | Deliverable |
|-------|-------|--------------|
| **0** | Mesh & Transport | PoC: BLE mesh between 5+ devices |
| **1** | Hardware Security | HSM key generation, mnemonic flow |
| **2** | Local-First Graph | SQLite integration, Nostr reconciliation |
| **3** | Messaging | DMs, contact list, graph visualization |
| **4** | UI/UX | SwiftUI/Compose implementation |
| **5** | Emergency Features | Broadcast, resource map, triple-tap wipe |

### Risk-First Approach

Highest technical risk (BLE mesh) is addressed first. If PoC fails, pivot before investing in UI.

---

## 9. Testing Strategy

### Emulated Mesh Networks

- Use macOS/Linux nodes to simulate high-density traffic
- Test "Split-Brain" scenarios (mesh partition)
- Automate 50+ node scenarios

### SLA Targets

| Condition | Target |
|-----------|--------|
| Online message delivery | 99.9% within 5 minutes |
| Mesh-only message delivery | 99.9% within 30 minutes |

### Device Testing Matrix

| iOS | Android |
|-----|---------|
| iPhone 14+ | Pixel 6+ |
| iPhone 13 | Samsung S21+ |
| iPhone 12 | OnePlus 9+ |

---

## 10. Compliance

### Data Privacy

- No phone number required
- No mandatory server sync
- On-chain data (relays) is opt-in only

### GDPR Considerations

- Right to deletion (triple-tap wipe satisfies)
- Data portability (export as JSON)
- Processing records maintained

### Export Controls

- Cryptographic key generation compliant
- No encryption backdoors

---

## 11. Dependencies

### iOS

| Category | Library | Purpose |
|----------|---------|---------|
| Database | SQLite.swift | Local storage |
| Crypto | CryptoKit | Secp256k1, AES |
| BLE | CoreBluetooth | Mesh networking |
| UI | SwiftUI | Native UI |

### Android

| Category | Library | Purpose |
|----------|---------|---------|
| Database | Room + SQLCipher | Local storage |
| Crypto | BouncyCastle | Secp256k1, AES |
| BLE | Android Bluetooth API | Mesh networking |
| UI | Jetpack Compose | Native UI |

---

## 12. Build & Deployment

### iOS

- Xcode with Swift Package Manager
- Target: iOS 16+
- Min devices: iPhone 12

### Android

- Android Studio with Gradle
- Target: API 26+ (Android 8.0)
- Min devices: API 24

---

## Appendix: Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Lendlee App                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   SwiftUI   │  │   Compose   │  │   Background Services   │ │
│  │     UI      │  │     UI      │  │   (BLE Mesh, Sync)      │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                     │               │
│  ┌──────▼────────────────▼─────────────────────▼─────────────┐ │
│  │              Unidirectional Data Flow Store               │ │
│  │         (Combine Flow / Kotlin StateFlow)                 │ │
│  └─────────────────────────┬───────────────────────────────────┘ │
│                            │                                     │
│  ┌─────────────────────────▼───────────────────────────────────┐ │
│  │                   Transport Layer                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐  │ │
│  │  │   Nostr     │  │  BLE Mesh   │  │   Queue / Store   │  │ │
│  │  │   Relay     │  │   (L2CAP)   │  │   and Forward     │  │ │
│  │  └──────┬──────┘  └──────┬──────┘  └─────────┬─────────┘  │ │
│  └─────────┼────────────────┼───────────────────┼────────────┘ │
│            │                │                   │               │
│  ┌─────────▼────────────────▼───────────────────▼────────────┐ │
│  │                   Security Layer                          │ │
│  │  ┌──────────────────┐  ┌──────────────────────────────┐   │ │
│  │  │  Secure Enclave  │  │  SQLite + SQLCipher          │   │ │
│  │  │  (secp256k1)     │  │  (FlatBuffers)               │   │ │
│  │  └──────────────────┘  └──────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │         Nostr Relays          │
              │  (WebSocket connections)      │
              └───────────────────────────────┘
```

---

*Document Version: 1.0*  
*Last Updated: April 2026*  
*Status: Technical Architecture Specification*