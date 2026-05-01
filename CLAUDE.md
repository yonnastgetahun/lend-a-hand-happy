# Lendlee — Session Context

## Project Overview
Community-based lending and sharing app. Cross-platform (iOS + Google Play).
React Native / Expo. Supabase backend (auth + database).

## Architecture
- **Monorepo:** `lendlee/` (core product), `kindred/` (broader vision), `apps/mobile-salvaged/` (mobile app)
- **Backend:** Supabase (auth, database, real-time subscriptions)
- **Auth:** Apple Sign-In, Google Sign-In, Email
- **Stack:** React Native, Expo Router, TypeScript, Tailwind/NativeWind

## Groker Integration
This project is managed through the Groker orchestration system.

### Commands (via terminal)
```bash
# Save an idea or decision
~/clawd/bin/groker-cli save "idea about lendlee" --project LENDLEE

# Create tasks from a plan
~/clawd/bin/groker-cli plan "description" --project LENDLEE

# Check status
~/clawd/bin/groker-cli status LENDLEE

# Approve tasks for execution
~/clawd/bin/groker-cli approve
```

### Agent Roles
- **Sage** (Architect): System design, technical decisions, dependency mapping
- **Ralph** (Engineer): Implementation — one task at a time, focused execution
- **Witness** (Judge): Evaluates completed work against acceptance criteria

### Task Flow
1. Plan creates task files in ~/clawd/tasks/ with AC/QA/Debug
2. Approve moves tasks to "ready"
3. Ralph picks up tasks, implements, calls `groker task complete`
4. Witness evaluates against acceptance criteria
5. Approved work gets merged

### Key Docs in This Repo
- `lendlee/LENDEE_TECHNICAL_ARCHITECTURE_V1.md` — technical architecture
- `lendlee/LENDEE_TECHNICAL_SPEC_V2.md` — technical spec
- `lendlee/docs/` — PRDs and reference docs
- `kindred/docs/KINDRED_PRD_v1.0.md` — broader vision PRD
- `apps/mobile-salvaged/` — mobile app code

### Quality Gates
Before shipping, run `/ship-check` for security/deployment checklist.
Before any design work, run `/design-research` for competitive analysis.

## Active Focus
Shipping the core lend flow: WHO → WHAT → WHEN → SMS → Done.
Target: first lend under 30 seconds, veteran lend under 15 seconds.
