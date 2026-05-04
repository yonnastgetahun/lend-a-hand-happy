## Update footer attribution

In `src/components/landing/Footer.tsx`, replace the single copyright line with two stacked, centered lines inside the existing divider section:

**Line 1** (small, muted):
> App Concept by D. Lindsay

**Line 2** (with heart, same as today's styling):
> Made with ♥ for neighbors everywhere by PulseCollabAgency · © {year} Lendlee

### Technical details
- Wrap the two `<p>` tags in a `flex flex-col items-center gap-1` container.
- Keep `text-xs text-muted-foreground` styling on both lines.
- Keep the inline `<Heart className="w-3 h-3 text-accent fill-accent" />` icon on line 2.
- "PulseCollabAgency" stays plain text (no link).
- Only edits the active `src/components/landing/Footer.tsx` (the `lendlee/` and `packages/shared/` copies are not used by the live site).
