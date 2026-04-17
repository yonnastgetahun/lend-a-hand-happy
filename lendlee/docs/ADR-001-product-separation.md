# ADR-001: Separation of Lendlee and Kindred Products

## Status
**Accepted**

---

## Executive Summary (High-Level)

Two distinct product visions emerged from Lendlee's evolution. Rather than forcing one codebase to serve incompatible technical and philosophical goals, we are separating into two independent products:

- **Lendlee**: A simple, beautiful lending utility focused on everyday generosity and item sharing
- **Kindred**: A comprehensive relationship resilience platform for self-managed, decentralized social networks

This separation allows each product to pursue the appropriate architecture, timeline, and user experience for its specific mission.

---

## Context (High-Level)

### Original Vision
Lendlee began as a community-centered app for gently tracking person-to-person lending of books and personal items. The goal was simple: help generosity stay joyful and relationships stay whole.

### Evolution and Divergence
Over multiple iterations (documented in PRDs V2.x through V3.2), Lendlee evolved into two distinct conceptual directions:

**Direction A: Simple Utility**
- Web-based landing page and app
- React Native for cross-platform mobile
- Gentle reminders and relationship notes
- Simple backend (Firebase/Supabase)
- Focus: Everyday lending and sharing

**Direction B: Comprehensive Platform**
- Native iOS (Swift) and Android (Kotlin)
- Decentralized identity via Nostr protocol
- Bluetooth mesh networking for offline resilience
- Hardware security modules (HSM) for key management
- Focus: Relationship stewardship, emergency communication, user-owned social graphs

### The Problem with Unification
These directions have incompatible requirements:

| Aspect | Simple Utility | Comprehensive Platform |
|--------|---------------|------------------------|
| **Tech Stack** | React Native, web-first | Native Swift/Kotlin, hardware access |
| **Timeline** | 3-4 months to market | 12+ months, phased rollout |
| **Complexity** | Low, proven technologies | High, experimental (mesh networking) |
| **Risk Profile** | Low risk, immediate value | High risk, long-term vision |
| **Team Skills** | React, JavaScript, web | Native mobile, cryptography, protocols |
| **User Audience** | General users, families | Privacy-conscious, activists, preppers |

Attempting to build both within a single product would create:
- Confusing positioning and messaging
- Technical compromises that satisfy neither vision
- Extended timelines that delay value delivery
- Architectural constraints that limit future evolution

---

## Decision (High-Level)

We will separate Lendlee and Kindred into two independent products with distinct codebases, timelines, and release cycles.

### Product Definitions

| | **Lendlee** | **Kindred** |
|---|---|---|
| **Tagline** | "Lend freely. Care deeply. Stay connected." | "Your kindred network—through good times and bad." |
| **Purpose** | Simple lending/sharing tracker for books and items | Self-managed relationship network for deepening friendships |
| **Core Value** | Everyday generosity made joyful | Relationships that endure through any circumstances |
| **Primary Use** | Track lent items, gentle reminders, relationship notes | Decentralized messaging, trust graphs, referrals, future resilience |
| **Identity** | Email + Apple/Google Sign-In | Nostr decentralized identity (HSM-backed keys) |
| **Network** | Simple contact list | Self-owned, cryptographically verified social graph |
| **Messaging** | Basic notifications (email/push) | End-to-end encrypted DMs (online via Nostr) |
| **Offline Capability** | View-only local cache | Future: Bluetooth mesh messaging |
| **Emergency Features** | None | Future: Broadcast, resource coordination, triple-tap wipe |
| **Tech Stack** | React Native, Firebase/Supabase | Swift (iOS), Kotlin (Android), Nostr, SQLite + SQLCipher |
| **Architecture** | Cloud-first with offline viewing | Local-first, decentralized |
| **Timeline** | 3-4 months (MVP) | 12+ months (Phased: PoC → v1.0 → v2.0 → v2.5) |
| **Target Users** | General users, book clubs, neighbors | Privacy-conscious communities, activists, families seeking resilience |
| **Monetization** | Freemium (free basic, premium for groups) | Open core, premium services, grants/foundation support |

### Technical Separation

**Lendlee (Simple Utility):**
- Single repository: `lendlee/`
- React Native codebase (shared web + iOS + Android)
- Simple backend (🔍 TODO: Firebase vs Supabase decision pending)
- Email-based authentication + social sign-in
- SQLite for offline item viewing only

**Kindred (Comprehensive Platform):**
- Separate repository: `kindred/` (placeholder created, will become independent GitHub repo)
- Native Swift (iOS) and Kotlin (Android) codebases
- Nostr protocol integration (NIPs: 01, 02, 04/44, 32, 65)
- Hardware Security Module (HSM) key management
- SQLite + SQLCipher for encrypted local storage
- Future: Bluetooth mesh protocol implementation

### Philosophical Alignment (Initial)

Both products share foundational values:
- **User-owned relationships**: Your connections belong to you, not algorithms
- **Privacy-first**: Data stays local when possible, encrypted when shared
- **No algorithmic feeds**: No engagement optimization, no ad targeting
- **Community resilience**: Stronger together, whether through generosity or communication

**Important**: While they share philosophy now, future iterations may diverge as each product serves different user needs. This is acceptable and expected.

---

## Detailed Context

### Historical Evolution (Documented in Archived PRDs)

**Phase 1: Simple Lending (V2.x)**
- Basic item tracking and reminders
- Relationship notes
- Focus on books and personal items

**Phase 2: Decentralized Direction (V2.x Decentralized)**
- Introduction of Nostr protocol concepts
- Decentralized identity exploration
- Mesh networking considerations

**Phase 3: Comprehensive Platform (V3.x)**
- Full relationship stewardship vision
- Emergency communication features
- Bluetooth mesh technical specifications
- Native-first architecture requirements

**Phase 4: Native-First Architecture (V3.2)**
- Swift/Kotlin native apps
- HSM-backed security
- Shamir secret sharing recovery
- FlatBuffers optimization
- L2CAP channels for BLE

This evolution shows a natural divergence: the lending utility could be built quickly with proven web technologies, while the resilience platform required native development, cryptography, and experimental mesh networking.

### Market Validation Considerations

**Lendlee (Lower Risk):**
- Proven market: lending apps exist, we differentiate through warmth and relationship-focus
- Technical feasibility: React Native is mature, Firebase/Supabase are battle-tested
- Immediate value: Users can start tracking items within minutes of signup
- Clear monetization: Freemium model is well-understood

**Kindred (Higher Risk):**
- Unproven market: User-owned social networks are niche (Nostr is early stage)
- Technical uncertainty: BLE mesh at scale is experimental
- Long time-to-value: Requires network density to demonstrate mesh benefits
- Uncertain monetization: Open source core requires alternative funding (grants, services)

Separation allows us to validate Lendlee quickly while researching Kindred thoroughly.

---

## Detailed Decision Rationale

### Why Not Build Both in One Product?

**1. Technical Incompatibility**
- React Native cannot access iOS Secure Enclave or Android StrongBox directly
- Web Bluetooth API is limited and not suitable for mesh networking
- Nostr protocol integration is complex and adds significant bundle size
- Trying to bridge these creates a Frankenstein architecture that serves neither vision

**2. Timeline Conflict**
- Lendlee could ship in 3-4 months with a focused team
- Kindred requires 12+ months with specialized skills (cryptography, native mobile, protocols)
- Tying them together delays Lendlee unnecessarily

**3. User Confusion**
- Marketing "simple lending" and "decentralized mesh networking" together creates cognitive dissonance
- Users downloading a lending app don't expect to learn about Nostr keys and mnemonic phrases
- Different audiences require different messaging, onboarding, and support

**4. Risk Management**
- Lendlee's success should not depend on Kindred's experimental tech
- Kindred's research phase should not block Lendlee's launch
- Separate products = separate risk profiles

### Why These Specific Names?

**Lendlee**
- Retains original name and brand equity
- Conveys "lending" clearly
- Warm, friendly, approachable
- Already has landing page and initial marketing

**Kindred**
- New name for new product
- "Kindred spirits" - deep connections, chosen family
- Suggests relationships that endure through time and circumstance
- Not technical, very human
- Domain likely available: kindred.app, kindred.network

### Repository Strategy

**Immediate (Now):**
- Both products exist in current workspace structure
- Lendlee: `/Users/yonnasgetahun/lend-a-hand-happy/lendlee/`
- Kindred: `/Users/yonnasgetahun/lend-a-hand-happy/kindred/` (placeholder)

**Future (After PRD Review):**
- Kindred moves to separate GitHub repository with independent git history
- Lendlee may remain in current repo or move depending on workspace organization preferences
- No shared code dependencies (philosophical alignment only)

---

## Consequences

### Positive Consequences

**1. Focused Development**
- Lendlee team can ship quickly without being blocked by Kindred research
- Kindred team can take time to get architecture right without rushing
- Each product has clear scope and success criteria

**2. Appropriate Technologies**
- Lendlee uses proven, efficient web/mobile stack
- Kindred uses native capabilities required for security and mesh
- No compromises on either side

**3. Clear Positioning**
- Lendlee: "Beautiful lending tracker for generous people"
- Kindred: "Your relationships, your network, your resilience"
- Different marketing, different channels, different communities

**4. Independent Timelines**
- Lendlee can launch, acquire users, and generate revenue
- Kindred can conduct Phase 0 PoC (BLE mesh validation) before major investment
- No cross-project deadline pressure

**5. Risk Isolation**
- If Kindred's mesh tech proves infeasible, Lendlee is unaffected
- If Lendlee struggles to find market fit, Kindred research continues
- Portfolio approach to product development

### Negative Consequences

**1. Duplicated Effort (Philosophy, Design)**
- Both products need to articulate "user-owned relationships"
- Potential for divergent design languages (mitigated by occasional sync)
- Documentation of shared values in two places

**2. User Confusion (Short-term)**
- Early adopters may wonder why there are two similar-sounding products
- Need clear differentiation in all communications
- Risk of "which one should I use?" questions

**3. Opportunity Cost**
- Resources allocated to both products means slower progress on each individually
- If one product would have been sufficient, we're splitting focus

**4. Future Integration Complexity**
- If we later want Lendlee to use Kindred identity, that's cross-product work
- No pre-built bridges or shared infrastructure

### Mitigations for Negative Consequences

**Duplicated Philosophy:**
- Acceptable trade-off for clarity
- Occasional design sync meetings (monthly) to maintain shared aesthetic
- Document divergence decisions explicitly

**User Confusion:**
- Clear landing pages: "Lendlee is for lending items. Kindred is for relationship networks."
- Decision guide on website: "Which product is right for me?"
- Different visual branding (Lendlee = warm earth tones, Kindred = more sophisticated/technical)

**Opportunity Cost:**
- Actually reduces risk of total failure
- Lendlee can fund Kindred research if successful
- Validates whether there's market for user-owned tools at all

**Future Integration:**
- Not required, only potential
- Can be built as explicit feature later if demand exists
- Both products work independently without integration

---

## Future Considerations

### Potential Integration Points (Optional, Not Required)

**1. Identity Layer Sharing**
- Lendlee could optionally support Nostr identity (advanced users)
- Would allow Lendlee users to "graduate" to Kindred seamlessly
- 🔍 **TODO:** Evaluate user demand before implementing

**2. Design System Sharing**
- Common UI component library for shared aesthetic
- Not required, but could accelerate both products
- 📋 **FUTURE:** Consider if design teams want to collaborate

**3. Shared Backend Services**
- If both use Supabase, could share infrastructure costs
- ⚠️ **TBD:** Depends on backend decisions for each product

**4. Cross-Promotion**
- Lendlee users who want "deeper connection" could discover Kindred
- Kindred users who want "simple lending" could discover Lendlee
- Natural funnel based on user maturity/needs

### Divergence Scenarios (Acceptable)

**Scenario A: Lendlee Simplifies Further**
- Lendlee removes even more features, becomes purely "item tracker"
- Kindred adds lending as one of many relationship features
- Both valid, serving different needs

**Scenario B: Kindred Becomes Protocol-First**
- Kindred focuses on being a protocol others build on
- Lendlee could theoretically use Kindred protocol
- Kindred app becomes reference implementation

**Scenario C: Different Philosophical Directions**
- Lendlee emphasizes "joyful generosity" and community
- Kindred emphasizes "sovereign identity" and resilience
- Shared origin, different evolutions

All scenarios are acceptable. The separation allows each product to find its own best form.

---

## Timelines (Dual-Track)

### Lendlee Timeline

**AI Agentic Development:**
- Duration: 6-8 weeks for MVP
- Key milestones: Core flows, backend integration, auth, item tracking
- Parallelization: UI components + backend + auth simultaneously
- Assumptions: Backend decision made in week 1, design system finalized week 2

**Human Team Timeline:**
- Duration: 12-16 weeks
- Key milestones: Design reviews (week 4, 8), testing (week 10-12), app store submission (week 14)
- Critical path: App store review times (unpredictable)
- Review gates: Usability testing with 10+ users, security audit

**Risk Factors:**
- ⚠️ **TBD:** Backend provider decision could delay week 1
- 📋 **FUTURE:** Payment provider integration if premium tier in v1.0

### Kindred Timeline

**Phase 0: Technical PoC (BLE Mesh Validation)**

*AI Agentic:*
- Duration: 8-12 weeks
- Key milestones: 5+ device mesh connectivity, basic message relay
- Parallelization: iOS BLE research + Android BLE research + protocol design
- Assumptions: Access to 5+ test devices, basic BLE knowledge

*Human Team:*
- Duration: 16-24 weeks
- Key milestones: Hardware testing partnerships, protocol specification, demo videos
- Critical path: Finding hardware testing partners (schools, community orgs)
- Review gates: Successful 5-device mesh demo, range validation

**Phase 1: Nostr Identity & Messaging (v1.0)**

*AI Agentic:*
- Duration: 12-16 weeks
- Key milestones: HSM key generation, BIP-39 backup, basic Nostr integration
- Parallelization: iOS security + Android security + relay integration
- Assumptions: Nostr relay infrastructure stable, HSM APIs well-documented

*Human Team:*
- Duration: 24-32 weeks
- Key milestones: Security audit, key recovery UX testing, relay selection
- Critical path: Security review (cannot ship without)
- Review gates: Penetration testing, key recovery success rate >95%

**Phase 2-4:**
- Dependent on Phase 0 success
- ⚠️ **TBD:** Scope may change based on Phase 0 learnings
- 📋 **FUTURE:** Detailed planning after PoC validation

---

## Success Metrics

### Lendlee Success

| Metric | Target | Timeline |
|--------|--------|----------|
| Downloads | 5,000 | 6 months post-launch |
| Items shared | 10,000 | 6 months post-launch |
| DAU | 1,000 | 6 months post-launch |
| Retention (30-day) | 40% | 6 months post-launch |
| Revenue (if freemium) | $5,000 MRR | 12 months post-launch |

### Kindred Success

| Metric | Target | Timeline |
|--------|--------|----------|
| Phase 0: Mesh PoC | 5+ devices connected | 6 months |
| Phase 1: Downloads | 1,000 | 12 months |
| Phase 1: Active nodes | 500 | 12 months |
| Phase 2: Mesh-capable neighborhoods | 50 | 18 months |
| Phase 2: Daily BLE relays | 1,000 | 18 months |
| Phase 4: Emergency pilots | 10 communities | 24 months |

---

## References

- LENDLEE_PRD_v1.0.md (Current workspace: Phase 2 document)
- KINDRED_PRD_v1.0.md (Current workspace: Phase 2 document)
- LENDEE_PRD_V2.1.md (Archived: `/lendlee/docs/archive/`)
- LENDEE_PRD_V2.3.md (Archived: `/lendlee/docs/archive/`)
- LENDEE_PRD_V2_DECENTRALIZED.md (Archived: `/lendlee/docs/archive/`)
- LENDEE_PRD_V3.md (Archived: `/lendlee/docs/archive/`)
- LENDEE_PRD_V3.1.md (Archived: `/lendlee/docs/archive/`)
- LENDEE_PRD_V3.2.md (Archived: `/lendlee/docs/archive/` and Reference: `/kindred/docs/reference/`)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| April 2026 | Separate Lendlee and Kindred | Divergent technical requirements, timelines, and audiences |
| April 2026 | Lendlee keeps original name | Brand equity, landing page exists, simple utility positioning |
| April 2026 | Kindred as new name | "Kindred spirits" conveys deep relationships, fresh start for complex platform |
| April 2026 | Archive old PRDs in Lendlee, copy to Kindred reference | Preserve lineage for both products, clear historical evolution |
| April 2026 | React Native for Lendlee | Shared codebase web + mobile, fast iteration, proven stack |
| April 2026 | Native Swift/Kotlin for Kindred | Hardware access (HSM, BLE), security requirements, protocol needs |

---

*Document Version: 1.0*
*Last Updated: April 2026*
*Status: Accepted*
*Authors: Product Team*
