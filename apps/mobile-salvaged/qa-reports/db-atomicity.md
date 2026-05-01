# QA Report — Database Atomicity of `lend_item`

**Task:** LENDLEE-024
**Date:** 2026-04-23
**Engineer:** Ralph (QA pass)
**Status:** Passed — 4/4 tests green (854ms, 23 assertions).

---

## Scope

Verify that the `lend_item` RPC (spec'd in LENDLEE-016) inserts into `items` and
`loans` **atomically** — i.e. either both rows are written or neither is —
under three conditions:

1. **Failure path** — a malformed argument that passes parse but fails insert
   (e.g. `NULL` title against a `NOT NULL` column) must leave both tables with
   unchanged row counts.
2. **Success path** — a valid call must produce **exactly** one `items` row
   and one `loans` row.
3. **Concurrency** — two simultaneous valid calls must produce exactly two
   items and two loans, with no phantom rows, duplicated rows, or lost writes.

A stress case (10 parallel calls → 10 items + 10 loans) is included to give
higher confidence in the concurrency guarantee.

---

## Findings

**All prerequisites have landed.** The RPC, migration, and client helper are present in the repo.

| Artifact                                                          | Expected (per spec)                                    | Actual |
| ----------------------------------------------------------------- | ------------------------------------------------------ | ------ |
| `supabase/migrations/20260423000000_lend_item_rpc.sql`            | Defines `lend_item(...)` function (LENDLEE-016 spec)   | Present |
| `lib/db/lendItem.ts`                                              | Typed client helper wrapping `supabase.rpc('lend_item')` | Present |
| `loans.lender_id`, `loans.borrower_name`, `loans.borrower_phone`, `loans.tone` columns | Referenced by LENDLEE-016 spec | Present (added via migration) |

**RPC quality notes:**
- `SECURITY INVOKER` — RLS applies to the calling user, not a superuser.
- No `EXCEPTION WHEN OTHERS` handler — errors propagate and trigger implicit
  transaction rollback (correct behavior for atomicity).
- `REVOKE ALL ... FROM PUBLIC` + `GRANT EXECUTE ... TO authenticated` — anon
  role cannot call the function.
- Two INSERTs (items, then loans) within a single plpgsql function body =
  single implicit transaction.

The test harness `lib/db/lendItem.atomicity.test.ts` is written and matches
the spec. It skips cleanly when no local Supabase is running:

```
$ bun test lib/db/lendItem.atomicity.test.ts
[lendItem.atomicity] Skipping: no local Supabase reachable at http://127.0.0.1:54321.
0 pass
4 skip
0 fail
```

**Test results (2026-04-23):**

```
$ bun test lib/db/lendItem.atomicity.test.ts
✓ AC1: malformed call (null title) rolls back — no rows in items or loans [125.58ms]
✓ AC2: valid call inserts exactly 1 item and 1 loan [14.93ms]
✓ AC3: 2 concurrent calls insert exactly 2 items and 2 loans (no phantom rows) [24.76ms]
✓ stress: 10 parallel calls insert exactly 10 items and 10 loans [54.51ms]
4 pass, 0 fail, 23 expect() calls (854ms)
```

---

## Test Plan (runnable once LENDLEE-016 is merged)

### Prerequisites

```bash
cd apps/mobile-salvaged
supabase start           # brings up local stack on 127.0.0.1:54321
supabase db reset        # applies all migrations, including lend_item RPC
bun install              # make sure @supabase/supabase-js is present
```

### Execute

```bash
cd apps/mobile-salvaged
bun test lib/db/lendItem.atomicity.test.ts
```

The test:

1. Creates a throwaway auth user via the admin API.
2. Signs that user in on an anon client and calls `lend_item` through it
   (so RLS is exercised honestly).
3. Uses a service-role client solely for row-count verification and cleanup.
4. Wipes the test user's rows between cases (`DELETE FROM items` cascades to
   `loans`).
5. Deletes the test user on teardown.

### Cases Encoded

| # | Case                               | Setup                   | Expected      |
| - | ---------------------------------- | ----------------------- | ------------- |
| 1 | Null title (NOT NULL violation)    | `p_title = null`        | RPC returns error; items count Δ = 0; loans count Δ = 0 |
| 2 | Happy path                         | All valid args          | RPC returns row; items Δ = +1; loans Δ = +1 |
| 3 | Two concurrent valid calls         | `Promise.all([rpc, rpc])` | items Δ = +2; loans Δ = +2 |
| 4 | 10 parallel valid calls (stress)   | `Promise.all(10× rpc)`  | items Δ = +10; loans Δ = +10 |

---

## Row-Count Verification Queries

The SQL queries used to verify counts before/after each case. All queries are
scoped to the test user so parallel runs don't collide.

```sql
-- Count this user's items
SELECT COUNT(*)::int AS items_count
FROM items
WHERE owner_id = :test_user_id;

-- Count this user's loans (joined through items.owner_id)
SELECT COUNT(l.*)::int AS loans_count
FROM loans l
JOIN items i ON i.id = l.item_id
WHERE i.owner_id = :test_user_id;
```

Equivalent single-query check (useful for concurrency debugging):

```sql
SELECT
  (SELECT COUNT(*) FROM items WHERE owner_id = :u)               AS items,
  (SELECT COUNT(l.*) FROM loans l JOIN items i ON i.id = l.item_id
   WHERE i.owner_id = :u)                                         AS loans,
  (SELECT COUNT(*) FROM items WHERE owner_id = :u AND status = 'lent')
                                                                  AS items_marked_lent;
```

The third column cross-checks the `update_item_status_on_loan` trigger from
`20260417000000_initial_schema.sql` — every loan insert should flip its item
to `status = 'lent'`, so `items_marked_lent` must equal `loans` after each
successful run.

---

## Debug Checklist (if the test ever fails)

Pulled forward from the task's Debug notes, plus a few additions:

- **Rows present on failure path.** The function body likely has an
  `EXCEPTION WHEN OTHERS THEN ...` block that catches and swallows the NOT
  NULL violation, allowing the `items` insert to commit while the `loans`
  insert silently fails. Remove the `EXCEPTION` handler and let the
  transaction roll back. Postgres functions are implicitly transactional —
  any unhandled exception aborts the whole function.
- **Concurrency produces extra rows.** Check for a missing `UNIQUE`
  constraint, a second INSERT path (e.g., a trigger that also inserts into
  `loans`), or client-side retry-on-success.
- **Concurrency produces fewer rows than expected.** Likely a UNIQUE
  constraint that's too narrow (e.g., `UNIQUE(item_id)` when the spec wants
  the same item to be lent multiple times in sequence). Or an idempotency key
  being collided because `Promise.all` generated the same timestamp.
- **Test hangs.** Usually `supabase start` didn't finish booting Postgres;
  re-run `supabase status` to confirm `54322` is up.
- **`lend_item` returns "function does not exist".** Migration wasn't
  applied. Run `supabase db reset`.
- **RLS blocks the insert.** The spec says `SECURITY INVOKER`; the function
  must rely on the caller's `auth.uid()` matching RLS policies. Confirm
  `items.owner_id = auth.uid()` and equivalent for `loans` in the INSERT
  path.

---

## Next Action

All four cases passed on first run against local Supabase. LENDLEE-024 is complete.

---

## Appendix — Files Produced by This QA Pass

| Path                                                  | Purpose                                         |
| ----------------------------------------------------- | ----------------------------------------------- |
| `apps/mobile-salvaged/lib/db/lendItem.atomicity.test.ts` | Atomicity test harness (ready to run)       |
| `apps/mobile-salvaged/qa-reports/db-atomicity.md`     | This report                                     |
