# User Acquisition Plan Using Web3-Style Referrals

## Lens-Inspired Growth Strategy for Lendlee

---

## Overview

This document outlines an optional web3-style referral layer for Lendlee, designed to accelerate adoption while respecting the core principles of privacy, user ownership, and consumer-initiated growth. This is a **supplemental** layer to the organic growth model defined in the PRD, not a replacement.

---

## 1. Principles

### User-First, Not Token-First
Any token/NFT rewards are instruments to reinforce genuine sharing and referrals; they never override the core UX or privacy.

### On-Chain for Transparency, Off-Chain for Ergonomics
Referral and reward logic can live on-chain; the everyday Lendlee app stays usable for non-crypto-native users.

### Reward Meaningful Participation
Mirror Lens-style approaches that reward active accounts and useful engagement, not pure invite spam.

---

## 2. Referral Object Model (Conceptual)

For users who opt in to a web3 layer:

### Referral Profile
- Linked to a Lendlee Nostr identity and a wallet address.

### Referral Edges
- On-chain records: referrer → referee, plus context (campaign, geo, when neighborhood became "mesh-capable").

### Reward Units
- Non-transferable or low-spec reputation NFTs ("Neighborhood Builder", "Mesh Pioneer")
- Possibly a small, capped utility token or credit for premium features (not ad-like rewards)

---

## 3. Growth Loops

### 3.1 Local "Mesh-Ready" Quests (Tiered Referrals)

Each neighborhood has a visible goal: "Reach 50 active users to unlock mesh readiness."

Users who opt in to the web3 layer get a quest card:

| Milestone | Reward |
|-----------|--------|
| Refer 3 neighbors | "Seed Node" badge |
| Reach 10 successful referrals in your zip | "Neighborhood Builder" NFT |
| Be among first N users in zip to reach X referrals | Access to special community tools (custom resource channels) |

### 3.2 Household and Community Champions (Multi-Level, Bounded)

Very light multi-level structure:
- You get a small extra reward if your direct referrals become referrers (1 hop only; no MLM vibes)
- These champions help drive "mesh-capable neighborhood" status
- Natural local organizers emerge organically

### 3.3 Referral Campaigns Tied to Real-World Events

- Earthquake prep months
- Local disaster drills
- Community fairs
- Limited-time boosts: "During this month, every successful new household referral in LA earns an additional 'Resilience Builder' badge on-chain and unlocks a special resource map feature."

### 3.4 Creator-Style Rewards for Guides and Organizers

People who create useful "how to use Lendlee" content or organize neighborhood onboarding sessions can receive:
- Special badges
- Governance weight in future community decisions (similar to Lens rewarding active contributors)

---

## 4. Incentive Design (What to Reward)

### Reward Actions That Strengthen the Network

| Action | Reward |
|--------|--------|
| Successful referrals that become active users (7-day retention, at least one Give/Lend or message) | Badge + progress toward quest |
| Clusters of referrals that make a neighborhood cross a threshold (20, 50 active nodes) | "Neighborhood Builder" NFT |
| Participation in emergency drills (test broadcasts, practicing offline mode) | "Resilience Champion" badge |
| High-quality referrals of trusted services (plumbers, babysitters, etc.) receiving positive feedback later | Referral attribution + trust tag bonus |

### Reward Examples (Mix and Match)

- **Badges/NFTs:** Non-speculative achievements that visually show contribution ("Mesh Organizer – Echo Park 2026")
- **Premium Features:** Advanced household management, graph visualizations, extra encrypted backup options unlocked via contribution metrics
- **Community Governance:** Over time, allow high-contribution users to help decide which neighborhoods get pilot features or community funding

---

## 5. Funnel & Onboarding

### Core App Stays Web2-Simple
- Email sign-up, no wallet required
- Referral links work without any crypto knowledge

### Optional "Activate Web3 Layer" Step
For users who opt in:
- Offer a simple in-app wallet (or WalletConnect)
- Explain benefits: transparent contribution record, long-term recognition, optional rewards

### In-App Referral Surfaces
On the "Neighborhood Status" screen, show:
> "Invite 3 more neighbors to reach mesh-ready. You'll both unlock X and earn 'Seed Node' recognition."

Each user gets a unique invite link; if they've activated web3, invites can also be tracked on-chain.

---

## 6. Measurement & Iteration

### Key KPIs

| Metric | Description |
|--------|-------------|
| Referral Signup Rate & Activation | Percentage of referral links that result in new users completing onboarding |
| Referee Actions | What did the referred user do? (7-day retention, first Give/Lend/Message) |
| Mesh-Capable Neighborhoods | Number of neighborhoods reaching threshold and time to get there |
| Contribution Distribution | Avoid "whales" - aim for broad, healthy participation |
| Retention (Referred vs. Non-Referred) | Do referred users stick around longer? |

### Iteration Approach

- Tune thresholds and rewards (Lens-like) to reward sustained engagement, not one-off bursts
- Run time-bound campaigns with clear goals (e.g., "LA Eastside mesh-ready by Q4")
- Adjust based on performance data

---

## 7. Phase Alignment

| Phase | Focus |
|-------|-------|
| v1.0 (MVP) | Organic growth only. Referral links work without crypto. |
| v1.5+ | Introduce optional web3 layer for interested users. |
| v2.0+ | Full gamification with quests, badges, and community governance. |

**Rationale:** Keep Phase 1 simple and accessible. The web3 layer adds value for power users and growth accelerators but should not block mainstream adoption.

---

## 8. Privacy Considerations

- On-chain referrals are **opt-in only**
- Core privacy model (local-only data, no phone number) remains unchanged
- On-chain data is limited to referral edges and achievements, not message content or contact details
- Users can export their "contribution history" as a portable credential

---

## 9. Relationship to PRD

This User Acquisition Plan supplements the Lendlee PRD (v3.1) by adding:

1. **Growth mechanics** that align with the "local adoption indicators" already defined
2. **Incentive structure** for the referral economy
3. **Optional web3 layer** that respects the consumer-initiated, user-owned philosophy

The core app remains unchanged; this is a growth acceleration layer for communities that want it.

---

*Document Version: 1.0*  
*Last Updated: April 2026*  
*Status: Supplementary Growth Strategy*