# Lendlee

**Lend freely. Care deeply. Stay connected.**

A community-centered app for gently tracking person-to-person lending of books and personal items. Inspired by the Buy Nothing movement, Lendlee helps generosity stay joyful and relationships stay whole.

## Why Lendlee Exists

When you lend a book to a friend, three things can go wrong:
1. You forget what you lent
2. They forget to return it  
3. The relationship suffers from awkward follow-ups

Lendlee handles the logistics so you can focus on the connection.

## What Makes Lendlee Different

| Approach | Problem | Lendlee Solution |
|----------|---------|------------------|
| Mental notes | Fallible, creates anxiety | **Gentle tracking** with warm reminders |
| Spreadsheets | Too cold, doesn't remind | **Relationship-first** design |
| Full social networks | Overkill, privacy concerns | **Simple, private, focused** |
| Library apps | Institutional, not personal | **Warmth and care** |

## Core Features

### v1.0 (Current Focus)
- **Give & Lend** - Track items you give away or loan
- **Gentle Reminders** - Soft nudges that feel caring, not demanding
- **Relationship Notes** - Remember context about people, not just transactions
- **Beautiful Design** - Warmth over efficiency
- **Cross-Platform** - React Native for iOS, Android, and Web

### v1.5+ (Future)
- **Promote & Recommend** - Share knowledge and trusted referrals
- **Offline Housemate Connect** - Local network discovery for roommates/households
- **AI Suggestions** - Smart recommendations based on lending history
- **Barcode Scanning** - Auto-fill book details

## Technical Stack

- **Framework:** React Native (iOS, Android, Web)
- **Backend:** 🔍 TODO - Firebase vs Supabase (decision needed)
- **Auth:** Email + Apple Sign-In + Google Sign-In
- **Storage:** SQLite local storage + cloud sync
- **Design:** Warm earth tones, relationship-focused UX

## Documentation

- [PRD v1.0](./docs/LENDLEE_PRD_v1.0.md) - Product Requirements
- [ADR-001](./docs/ADR-001-product-separation.md) - Why we separated from Kindred
- [Archive](./docs/archive/) - Historical PRDs (V2.x-V3.x)

## Relationship to Kindred

Lendlee and [Kindred](https://github.com/yourusername/kindred) are **philosophical siblings**—both believe in user-owned relationships—but **technical strangers**.

- **Lendlee:** Simple lending utility (React Native, immediate value, 3-4 month timeline)
- **Kindred:** Comprehensive relationship network (Native Swift/Kotlin, decentralized, 12+ month timeline)

Both share values of privacy, user agency, and relationship preservation—but serve different needs with different architectures.

## Status

🚧 **Development Planning** - Backend decision in progress, development starting soon

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## License

MIT

---

*Lendlee: Lend freely. Care deeply. Stay connected.*
