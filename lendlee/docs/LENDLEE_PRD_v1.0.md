# Lendlee Product Requirements Document

## Version 1.0: Simple Lending & Sharing Utility

---

## Executive Summary (High-Level)

**Lendlee** is a beautiful, minimal app for tracking books and personal items shared with friends, family, and neighbors. It keeps generosity joyful by handling the awkward parts—reminders, due dates, and relationship notes—so relationships stay whole.

**Tagline:** *"Lend freely. Care deeply. Stay connected."*

**Core Philosophy:** Everyday generosity should feel warm, not transactional. Lendlee handles the logistics so you can focus on the connection.

---

## Problem Statement (High-Level)

### The Friction of Generosity

When you lend a book to a friend, three things can go wrong:

1. **You forget what you lent** - Three months later, you can't remember if you ever got that cookbook back
2. **They forget to return it** - Your friend genuinely forgot, but now it's awkward to ask
3. **The relationship suffers** - A simple loan becomes tension, avoidance, or resentment

### Current "Solutions" Are Broken

| Approach | Problem |
|----------|---------|
| **Mental notes** | Fallible, creates anxiety |
| **Spreadsheets** | Too cold, doesn't remind anyone |
| **Text reminders** | Awkward, feels like nagging |
| **Full social networks** | Overkill for simple lending, privacy concerns |
| **Library apps** | Designed for institutions, not friends |

**The Gap:** A tool that's as warm as the generosity it's supporting—not corporate, not complex, just gentle and helpful.

---

## Solution (High-Level)

### Lendlee: The Gentle Lending Tracker

Lendlee makes lending and sharing feel natural by:

- **Remembering for you** - What you lent, to whom, when it's due
- **Reminding gently** - Soft nudges that feel caring, not demanding
- **Preserving relationships** - Context and notes so you remember the person, not just the transaction
- **Staying simple** - No feeds, no algorithms, no social pressure—just your loans

### Core Flow (Happy Path)

**For Lending:**
1. **You lend a book** to your neighbor Sarah
2. **You log it in Lendlee** (30 seconds: photo, name, due date optional)
3. **Life happens** - Three months pass
4. **Lendlee sends a gentle reminder** (to you or Sarah, your choice)
5. **Book returns** with gratitude, relationship intact
6. **You mark it returned** - Lendlee keeps the history

**For Giving:**
1. **You give away a coat** to a friend moving to Chicago
2. **You log it in Lendlee** (15 seconds: photo, name, recipient)
3. **No reminders needed** - it's a gift, not a loan
4. **Record preserved** - history shows your generosity
5. **Relationship noted** - "Helped Alex prepare for Chicago move"

---

## Detailed Problem Analysis

### User Research Insights

**Persona 1: The Generous Reader ("Book Lisa")**
- Loves lending favorite books to friends
- Has 15+ books "out in the wild" at any time
- Can't remember who has what
- Feels awkward asking for returns
- Quote: *"I want my books back, but I don't want to be THAT friend who keeps track."*

**Persona 2: The Community Connector ("Neighbor Mike")**
- Lends tools, kitchen items, camping gear to neighbors
- Wants to build community trust
- Needs to track for practical reasons (tools are expensive)
- Worries about seeming transactional
- Quote: *"I want to say 'yes' when someone asks, but I also need to know where my stuff is."*

**Persona 3: The Family Steward ("Mom Rachel")**
- Manages lending between family members
- Kids borrow from cousins, siblings share clothes
- Wants to teach responsibility without being the "police"
- Needs visibility across household
- Quote: *"I want the kids to learn to return things, but I'm tired of being the reminder."*

### Pain Points Deep-Dive

| Pain Point | Current Behavior | Emotional Impact |
|------------|------------------|------------------|
| **Forgetting loans** | Mental notes, anxiety | Guilt, mistrust |
| **Awkward follow-ups** | Avoidance, indirect hints | Relationship tension |
| **Lost items** | Replacement cost, resentment | Financial loss, betrayal |
| **No record of generosity** | None | Invisible kindness, undervalued |
| **Over-complicated tools** | Abandonment | Frustration, return to chaos |

---

## Detailed Solution Specification

### Core Features

#### 1. Item Lending Flow

**Core Actions (v1.0):**

| Action | Use Case | Data Captured |
|--------|----------|---------------|
| **Give** | "Here's something I don't need anymore" | Item, recipient, date, optional photo, note |
| **Lend** | "Borrow this, return it when you're done" | Item, recipient, date, due date, reminder settings, photo, note |

**📋 FUTURE: Promote & Recommend (v1.5+)**
- **Promote:** Share events/resources with contacts
- **Recommend:** Trusted referrals for services/providers
- *Rationale:* Focus v1.0 on physical item sharing, add knowledge/service sharing once core flows are validated*

**📋 FUTURE: Offline Housemate/Roommate Connect (v1.5+ - Adoption Driver)**
- **Local Network Discovery:** Detect other Lendlee users on same WiFi network
- **Household Mode:** Roommates/housemates auto-connect without external backend
- **Shared Household Inventory:** "What's in our kitchen?" shared view
- **Offline Reminders:** Work even without internet (local network only)
- **Adoption Strategy:** 
  - Target college dorms, shared apartments, co-living spaces
  - Each roommate installs → instant value (shared household tracking)
  - Natural viral loop: "Ask your roommates to join Lendlee"
  - Bridges to wider network: "Now lend to friends outside the house"
- *Rationale:* Households are high-density lending environments; offline-first approach reduces friction for adoption; validates tech for future mesh expansion; creates daily utility even before wide friend network*
- *Technical:* Bonjour/mDNS for local discovery, local network mesh as Kindred tech precursor

**Item Details:**
- Name/title (required)
- Photo (optional, but encouraged)
- Description/notes (optional)
- Category (books, tools, kitchen, electronics, clothes, other)
- Value (optional, for insurance/reference)
- Condition notes (optional)

**Due Date Options:**
- Specific date (e.g., "Return by June 1st")
- Relative time (e.g., "In 2 weeks")
- No due date ("Whenever you're done")
- Recurring loans (e.g., "Borrow every weekend")

#### 2. Gentle Reminder System

**Philosophy:** Reminders should feel like care, not collection agency.

**Reminder Types:**

| Timing | Message Style | Recipient |
|--------|--------------|-----------|
| **Due soon** (2 days before) | "Just a heads up—[Item] is due back in 2 days. No rush if you need more time!" | Borrower |
| **Due today** | "Friendly reminder—today's the day [Item] was planned to return. Let me know if you need more time!" | Borrower |
| **Overdue** (3 days after) | "Hey, checking in about [Item]. Everything okay? Let me know when works to get it back." | Borrower |
| **Long overdue** (2 weeks after) | "It's been a while—should we chat about [Item]? No pressure, just want to make sure it didn't get forgotten." | Borrower + Lender (for awareness) |

**Customization:**
- Tone selector: "Gentle" / "Casual" / "Direct" (default: Gentle)
- Reminder frequency: Adjust based on relationship (close friend vs acquaintance)
- Opt-out per loan: "No reminders for this one" (trust-based lending)

**Delivery Channels:**
- In-app notifications (primary)
- Email (backup)
- Push notifications (mobile, optional)
- ⚠️ **TBD:** SMS integration (cost/complexity analysis needed)

#### 3. Relationship Notes & Context

**Per-Contact Notes:**
- How you met
- Relationship context ("College roommate," "Neighbor since 2020")
- Lending history summary
- Preferences ("Prefers gentle reminders," "Always returns promptly")
- Personal notes (private, not shared)

**Per-Loan Notes:**
- Context of the loan ("For their trip to Italy")
- Special conditions ("Keep away from their dog—allergies")
- Memories/feelings ("So glad they wanted to read this!")

#### 4. Dashboard & History

**Home Screen:**
- Currently lent out (count + quick view)
- Recently returned (celebration moments)
- Due soon (next 7 days)
- Overdue (needs attention)

**History View:**
- All-time lending stats ("You've shared 47 items with 12 people")
- Generosity timeline (visual timeline of sharing)
- Relationship insights ("You and Sarah have shared 8 times—top lender!")

#### 5. Returns & Gratitude

**Return Flow:**
- Lender marks item returned (or borrower confirms return)
- Optional: "How did it go?" rating (1-5 stars, private to lender)
- Optional: Thank you note (stored in history)
- Optional: Photo of returned item (condition check)

**Gratitude Tracking:**
- Borrower can send thank you note
- Stored in relationship history
- Optional: "Would lend again" flag (private reference for future)

---

## Technical Architecture

### Platform Strategy

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Framework** | React Native | Single codebase for iOS + Android + Web |
| **Web First?** | Yes, then mobile | Validate quickly, then native app stores |
| **State Management** | Redux Toolkit or Zustand | Standard React patterns |
| **UI Library** | React Native Paper or shadcn/ui | Accessible, beautiful components |
| **Backend** | 🔍 **TODO:** See Backend Decision Section | TBD: Firebase vs Supabase |
| **Offline Support** | SQLite (mobile), localStorage (web) | View items offline, sync when connected |

### Authentication

**Primary Method:** Email + Password
- Simple, universal
- Password reset via email
- No phone number required (privacy)

**Social Sign-In (Optional):**
- Apple Sign-In (iOS requirement)
- Google Sign-In (Android/web convenience)
- Email still collected for backup

**Account Structure:**
- Individual accounts (default)
- 🔍 **TODO:** Household accounts? (Share lending history within family)

### Data Model (High-Level)

```
User
├── email (auth)
├── profile (name, avatar)
├── preferences (notification settings, reminder tone)
└── contacts[]

Contact
├── name
├── email/phone (for reminders)
├── relationship_notes
├── lending_history_summary
└── user_id (foreign key)

Item
├── title
├── description
├── category
├── photo_url
├── value (optional)
├── owner_id (foreign key)
└── status (available, lent, given)

Loan
├── item_id (foreign key)
├── lender_id (foreign key)
├── borrower_id (foreign key → Contact)
├── loan_date
├── due_date (optional)
├── return_date (nullable)
├── reminder_settings
├── notes
├── status (active, returned, overdue, lost)
└── reminder_history[]

Reminder
├── loan_id (foreign key)
├── type (due_soon, due_today, overdue, long_overdue)
├── sent_at
├── channel (in_app, email, push)
├── content
└── status (sent, delivered, opened)
```

### Backend Decision (🔍 TODO)

**Option A: Firebase (Google)**

*Pros:*
- Fully managed, scales automatically
- Built-in auth (email + social)
- Real-time sync (great for shared households)
- Cloud functions for reminders
- Generous free tier
- Excellent React Native SDK

*Cons:*
- Vendor lock-in (Google ecosystem)
- Costs can escalate unexpectedly
- Less query flexibility (NoSQL)
- Data export more complex

*Best for:* Teams wanting speed, Google's ecosystem, real-time features

---

**Option B: Supabase (Open Source)**

*Pros:*
- PostgreSQL (full relational power)
- Open source (can self-host if needed)
- Built-in auth (email + social)
- Real-time subscriptions
- Edge functions (reminders)
- Predictable pricing
- Excellent React Native support

*Cons:*
- Slightly more setup than Firebase
- Newer ecosystem (fewer StackOverflow answers)
- Real-time slightly less mature than Firebase

*Best for:* Teams wanting SQL, open source, predictable costs

---

**Comparison Matrix:**

| Criteria | Firebase | Supabase |
|----------|----------|----------|
| Setup speed | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Query power | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Vendor lock-in | High (Google) | Low (open source) |
| Cost predictability | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| React Native SDK | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Real-time | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Auth options | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Self-host option | No | Yes |

**⚠️ TBD:** Decision needed by Week 1 of development. Recommendation: Start with one, implement repository pattern to allow future swap if needed.

---

## User Flows

### Flow 1: First-Time User (Onboarding)

1. **Landing page** → "Download the app" or "Use on web"
2. **Sign up** (email + password, or Apple/Google)
3. **Quick tour** (3 screens: "Log your loans," "Set gentle reminders," "Keep relationships whole")
4. **First loan** (encouraged immediately with friendly UI)
   - "What are you lending?" (photo + name)
   - "To whom?" (contact picker or new contact)
   - "When's it due?" (optional, with "not sure" option)
   - "Any notes?" (optional)
5. **Confirmation** → "Your first loan is logged! We'll remind you gently."
6. **Home screen** with the new loan displayed

**Time to first value:** < 2 minutes

### Flow 2: Logging a New Loan

1. Tap "+" or "New Loan"
2. **Item details** (photo, name, category)
3. **Select borrower** (existing contact or add new)
   - If new: name, email/phone (for reminders), relationship context
4. **Due date** (optional selector, or skip)
5. **Reminder settings** (use default or customize)
6. **Notes** (optional context)
7. **Confirm** → Item appears in "Currently Lent Out"

**Time:** 30-60 seconds

### Flow 3: Reminder Experience (Borrower)

1. Borrower receives notification/email
2. **Tone is warm:** "Just a heads up..."
3. **Options:**
   - "Returned it!" (triggers return flow)
   - "Need more time" (extends due date, updates reminder)
   - "Can't find it" (alerts lender, starts conversation)
   - "Thanks for the reminder" (acknowledgment only)
4. Lender notified of borrower's response

### Flow 4: Return Flow

**Option A: Borrower Initiates**
1. Borrower opens app (if they have it) or clicks reminder link
2. "I'm returning [Item] today"
3. Lender notified: "[Borrower] is returning [Item] today"
4. Physical handoff happens
5. Lender marks "Returned" in app
6. Optional: Thank you note, rating, photo

**Option B: Lender Initiates**
1. Lender opens app
2. Sees overdue or in-person return
3. Finds loan in "Currently Lent Out"
4. Taps "Mark Returned"
5. Optional: Add notes, rating

### Flow 5: Relationship Building (History)

1. User taps "History" tab
2. Sees timeline of all sharing
3. Taps specific person → Relationship view
   - All loans between them
   - Notes about the relationship
   - "Generosity score" (fun metric: "You've shared 12 times!")
4. Option to add private notes about the relationship

---

## Design Principles

### Warmth Over Efficiency

Every interaction should feel human:
- Language: "Care deeply," "Stay connected," not "Track," "Manage," "System"
- Colors: Warm earth tones, not corporate blues
- Animations: Gentle, not snappy
- Empty states: Encouraging, not scolding

### Relationship-First

- Show borrower's face/name prominently, not just item
- Surface relationship context ("Sarah—college friend")
- History emphasizes connection, not just transactions
- Reminders preserve dignity

### Progressive Disclosure

- Default: Minimal fields (item + person)
- Optional: Due dates, notes, photos, values
- Advanced: Custom reminder schedules, categories
- No overwhelm for first-time users

### Privacy by Default

- No public profiles
- No social feeds
- No friend discovery (invite-only)
- Data encrypted at rest and in transit
- No selling/sharing data (ever)

---

## Monetization (Optional v1.0, Required v2.0)

### Freemium Model

**Free Tier:**
- Unlimited personal loans (single user)
- Up to 50 items tracked
- Basic reminders (email + in-app)
- Standard reminder tones
- Export data (CSV)

**Premium Tier (🔍 TODO: Pricing TBD - $3-5/month?):**
- Unlimited items
- Household/family sharing (up to 5 people)
- Advanced reminder customization
- Push notifications
- Priority support
- API access (future)
- Exclusive "warm" reminder tones

**One-Time Purchases:**
- "Lifetime premium" (🔍 TODO: Price TBD - $30-50?)
- Custom themes (future)

**⚠️ TBD:** 
- Pricing strategy validation
- Payment provider (Stripe, RevenueCat, in-app purchases)
- Free trial length (7 days? 14 days?)

---

## Success Metrics

### Primary Metrics (North Star)

| Metric | Target | Timeline | Why |
|--------|--------|----------|-----|
| **Items shared** | 10,000 | 6 months post-launch | Core value delivery |
| **Active users** (monthly) | 2,000 | 6 months post-launch | Engagement |
| **Retention** (30-day) | 40% | 6 months post-launch | Product-market fit |
| **NPS score** | > 50 | 6 months post-launch | User satisfaction |

### Secondary Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| **Downloads** | 5,000 | Top of funnel |
| **Sign-up completion** | 60% | Onboarding effectiveness |
| **First loan logged** (within 24h) | 50% | Time to value |
| **Reminder response rate** | 70% | Feature engagement |
| **Return rate** (within due date) | 80% | Core problem solved |
| **Premium conversion** | 5% | Monetization |
| **Churn** (30-day) | < 10% | Retention health |

### Qualitative Metrics

- **User interviews:** 10 per month
- **Support ticket themes:** Track common requests
- **App store reviews:** Monitor sentiment
- **Relationship stories:** "Did Lendlee help you maintain a relationship?"

---

## Timeline (Dual-Track)

### Phase 1: MVP (Minimum Viable Product)

**AI Agentic Development:**

| Week | Milestones | Deliverables |
|------|------------|--------------|
| **1** | Backend decision, project setup | Repo, CI/CD, dev environment |
| **2** | Auth system, user model | Login/signup flows, profile |
| **3** | Core data models | Item, Loan, Contact schemas |
| **4** | Basic CRUD | Create loan, view loans, mark returned |
| **5** | Reminder system | Email notifications, scheduling |
| **6** | UI polish, responsive | Mobile app feel on web |
| **7-8** | Testing, bug fixes, deploy prep | Test suite, staging environment |

*Assumptions:*
- Backend decision made in Week 1 (🔍 TODO)
- Design system available (shadcn/ui or similar)
- React Native setup complete
- Auth providers (Apple/Google) configured

**Human Team Timeline:**

| Phase | Duration | Key Activities |
|-------|----------|----------------|
| **Design** | 4 weeks | UX flows, visual design, component library |
| **Development** | 8 weeks | Parallel with AI agentic, code review |
| **Testing** | 3 weeks | QA, usability testing (10+ users) |
| **Polish** | 2 weeks | Bug fixes, performance, edge cases |
| **Launch Prep** | 2 weeks | App store submission, marketing assets |
| **Launch** | 1 week | Soft launch, monitoring |

**Total Human Team:** 16-20 weeks (4-5 months)

**Critical Path:**
1. Design finalization (blocks dev)
2. Auth integration (blocks everything)
3. Reminder system (complex, needs thorough testing)
4. App store review (unpredictable, 1-7 days)

**Review Gates:**
- Week 4: Design review (internal + 3 external users)
- Week 8: Alpha testing (20 users, feedback collection)
- Week 12: Beta testing (100 users, metrics tracking)
- Week 16: Launch readiness review

**Risk Factors:**
- ⚠️ **TBD:** Backend decision delay could push Week 1 back
- ⚠️ **TBD:** Apple Developer account approval (if not already have)
- 📋 **FUTURE:** Payment provider integration complexity

### Phase 2: Post-Launch (Months 2-6)

**AI Agentic:**
- Mobile app polish (React Native-specific features)
- Push notifications
- Premium tier implementation
- Performance optimizations

**Human Team:**
- User feedback integration
- A/B testing reminder tones
- Customer support systems
- Marketing campaigns

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Backend decision wrong** | Medium | High | Repository pattern allows swap; start simple |
| **Reminder emails marked spam** | Medium | Medium | Use reputable provider, warm-up domain, monitor reputation |
| **Users find it too simple** | Low | Medium | Core value is simplicity; advanced users might prefer Kindred |
| **Competition (existing apps)** | High | Low | Differentiation is warmth/relationship-focus, not features |
| **React Native performance issues** | Medium | Medium | Profile early, optimize lists, use native modules if needed |
| **Apple/Google auth rejected** | Low | High | Test thoroughly, follow guidelines, have email backup |
| **Monetization fails** | Medium | High | Keep costs low, freemium allows user growth regardless |

---

## Open Questions (🔍 TODO & ⚠️ TBD)

### 🔍 TODO (Must Resolve Before/During Development)

1. **Backend provider:** Firebase vs Supabase decision (Week 1)
2. **Reminder email provider:** SendGrid, Mailgun, AWS SES, or backend built-in?
3. **Push notifications:** Firebase Cloud Messaging (FCM) + Apple Push Notification Service (APNS) integration scope for v1.0?
4. **Payment provider:** Stripe, RevenueCat, or in-app purchases only?
5. **Household accounts:** Share lending history among family members? (Could be v1.5 feature)
6. **Data export:** JSON, CSV formats? GDPR compliance requirements?
7. **Analytics:** Mixpanel, Amplitude, or privacy-respecting alternative (Plausible, PostHog)?

### ⚠️ TBD (Can Be Deferred, Needs Attention)

1. **SMS reminders:** Cost/benefit analysis (expensive, but higher open rates)
2. **Photo storage:** Cloudinary, AWS S3, or backend provider's storage?
3. **Search functionality:** Full-text search on items and notes (needed for 100+ loans)
4. **Categories customization:** User-defined categories or fixed list?
5. **Due date flexibility:** "Return by" vs "Return whenever" vs "Check in after X weeks"
6. **Offline editing:** Create loans offline, sync later (conflict resolution needed)
7. **Import/export:** CSV import from spreadsheets? Migration from other apps?

### 📋 FUTURE (Out of Scope for v1.0)

1. **Promote & Recommend:** Share knowledge and trusted referrals
   - *Promote:* Share events, resources, knowledge with contacts
   - *Recommend:* Trusted referrals for services (plumbers, dentists, etc.)
   - *Why v1.5+:* Focus v1.0 on physical items, expand once core flows validated
2. **Offline Housemate/Roommate Connect:** Local network adoption driver
   - *WiFi-based discovery:* Auto-connect with users on same network (roommates)
   - *Household inventory:* Shared view of "what's in our house"
   - *Offline-first:* Works without internet, bridges to wider network
   - *Why v1.5+:* High-density adoption environment, precursor to Kindred mesh tech
3. **AI-powered suggestions:** "You lent this book to Sarah—she might like this one too"
3. **Barcode scanning:** Auto-fill book details via ISBN lookup
4. **Lending circles:** Small groups with shared inventory (book clubs, tool libraries)
5. **Public wishlists:** "Books I want to borrow" visible to friends
6. **Integration with Kindred:** Optional Nostr identity for power users
7. **Web3 features:** Blockchain-based provenance for valuable items (🎨 art lending)

---

## Competitive Analysis

| Competitor | Their Strength | Lendlee Differentiation |
|------------|--------------|------------------------|
| **Libib** | Library-style cataloging | Relationship-focused, not inventory |
| **LibraryThing** | Book-specific features | Multi-category (tools, clothes, etc.) |
| **Goodreads** | Social features | No social pressure, private by default |
| **Google Sheets** | Free, customizable | Purpose-built, gentle reminders |
| **Excel/Airtable** | Powerful, flexible | Warmth, simplicity, designed for lending |
| **Notion** | All-in-one workspace | Singular focus on lending relationships |
| **Ourshelves** (if exists) | ? | Warmth, reminder tone, relationship notes |

**Key Differentiator:** Lendlee isn't a database—it's a relationship preservation tool.

---

## References

- ADR-001-product-separation.md (Decision rationale for product split)
- KINDRED_PRD_v1.0.md (Related product, different scope)
- LENDEE_PRD_V3.2.md (Historical: extracted Kindred from this)
- Landing page designs (Current workspace: `/src/components/landing/`)

---

## Decision Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| April 2026 | Separate from Kindred | Different timelines, tech stacks, audiences | Final |
| April 2026 | React Native for cross-platform | Shared codebase, proven technology | Final |
| April 2026 | Email + social auth | Universal access, privacy (no phone) | Final |
| April 2026 | 🔍 Backend TBD | Firebase vs Supabase needs analysis | **TODO** |
| April 2026 | SQLite local storage | Offline viewing, simple sync | Final |
| April 2026 | Gentle reminder system | Core differentiator, relationship preservation | Final |
| April 2026 | 🔍 Freemium model | Monetization path, but pricing TBD | **TODO** |
| April 2026 | No mesh/networking | Out of scope—Kindred's domain | Final |
| April 2026 | No Nostr identity | Simplify for general users—Kindred for crypto natives | Final |

---

*Document Version: 1.0*
*Last Updated: April 2026*
*Status: Draft - Awaiting Review*
*Next Step: Backend provider decision (Week 1)*
