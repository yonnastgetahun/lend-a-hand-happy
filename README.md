# Lendlee & Kindred

A dual-product ecosystem for user-owned relationships and community resilience.

## 🌱 Lendlee - *Lend freely. Care deeply. Stay connected.*

**Simple, beautiful lending tracker for books and personal items.**

Lendlee helps you gently track items shared with friends, family, and neighbors. It keeps generosity joyful by handling the awkward parts—reminders, due dates, and relationship notes.

- **Stack:** React Native (iOS, Android, Web)
- **Timeline:** 3-4 months to MVP
- **Focus:** Everyday lending and giving
- **Docs:** [Lendlee PRD v1.0](./lendlee/docs/LENDLEE_PRD_v1.0.md)

[Learn more about Lendlee →](./lendlee/)

---

## 🔗 Kindred - *Your kindred network—through good times and bad.*

**Self-managed relationship and resilience platform.**

Kindred is a user-owned network tool where you manage your own relationships, share resources, and stay connected—online and offline. Decentralized, encrypted, and resilient.

- **Stack:** Swift (iOS), Kotlin (Android), Nostr protocol
- **Timeline:** 12+ months (Phased: PoC → v1.0 → v2.0 → v2.5)
- **Focus:** Relationship stewardship, decentralized identity, future mesh networking
- **Docs:** [Kindred PRD v1.0](./kindred/docs/KINDRED_PRD_v1.0.md)

[Learn more about Kindred →](./kindred/)

---

## Why Two Products?

**Lendlee** and **Kindred** emerged from a single vision that diverged into two distinct products:

| | **Lendlee** | **Kindred** |
|---|---|---|
| **Purpose** | Simple lending utility | Comprehensive relationship network |
| **Tech** | React Native, cloud backend | Native Swift/Kotlin, decentralized |
| **Identity** | Email + social auth | Nostr cryptographic keys |
| **Network** | Simple contact list | Self-owned social graph |
| **Offline** | View-only cache | Future BLE mesh messaging |
| **Timeline** | 3-4 months | 12+ months |
| **Risk** | Low (proven tech) | High (experimental mesh) |

**They are philosophical siblings** (both believe in user-owned relationships) **but technical strangers** (completely different architectures).

See [ADR-001: Product Separation](./lendlee/docs/ADR-001-product-separation.md) for full rationale.

---

## Repository Structure

```
.
├── lendlee/                  # Lendlee documentation and future code
│   ├── docs/
│   │   ├── LENDLEE_PRD_v1.0.md
│   │   ├── ADR-001-product-separation.md
│   │   └── archive/          # Historical PRDs (V2.x-V3.x)
│   └── README.md
│
├── kindred/                  # Kindred documentation (separate git history)
│   ├── docs/
│   │   ├── KINDRED_PRD_v1.0.md
│   │   └── reference/        # Historical PRD copies
│   └── README.md
│
└── README.md                 # This file
```

**Note:** The `kindred/` folder has its own independent git repository (initialized separately). It will eventually move to its own GitHub repository.

---

## Development Status

| Product | Phase | Status |
|---------|-------|--------|
| **Lendlee** | Planning | 🔍 Backend decision needed (Firebase vs Supabase) |
| **Kindred** | Phase 0 Research | 🚧 BLE mesh PoC planning, hardware partner outreach |

---

## Documentation Index

### Lendlee
- [Product Requirements v1.0](./lendlee/docs/LENDLEE_PRD_v1.0.md)
- [Architecture Decision Record](./lendlee/docs/ADR-001-product-separation.md)
- [Historical PRDs (V2-V3)](./lendlee/docs/archive/)

### Kindred
- [Product Requirements v1.0](./kindred/docs/KINDRED_PRD_v1.0.md)
- [Historical References](./kindred/docs/reference/)

---

## Philosophy

Both products share foundational beliefs:

1. **User-owned relationships** - Your connections belong to you, not platforms
2. **Privacy-first** - Data stays local when possible, encrypted when shared
3. **No algorithmic feeds** - No engagement optimization, no ad targeting
4. **Community resilience** - Stronger together, online and offline

---

## Contributing

[To be determined as development begins]

## License

[To be determined]

---

*Two products, one vision: tools that work for us, not on us.*
