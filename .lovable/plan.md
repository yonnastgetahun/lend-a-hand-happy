

## Replace "Starting with Books" with Privacy Policy Section

### What changes

1. **New route `/privacy`** — Add a dedicated Privacy Policy page so Apple can link directly to `https://lend-a-hand-happy.lovable.app/privacy` for App Store submission.

2. **New file `src/pages/Privacy.tsx`** — A clean, simple page rendering the exact privacy policy text provided, styled consistently with the landing page (same fonts, colors, spacing). Includes the Lendlee brand name at top, all six policy statements as a list, and "Last updated: April 8, 2026" at the bottom.

3. **Update `src/App.tsx`** — Add `<Route path="/privacy" element={<Privacy />} />`.

4. **Remove the StartingSmall section from the landing page:**
   - Delete import and `<StartingSmall />` from `src/pages/Index.tsx`
   - Optionally delete `src/components/landing/StartingSmall.tsx`

5. **Add Privacy link to Footer** — Update the existing "Privacy" link in `src/components/landing/Footer.tsx` to point to `/privacy` using React Router's `Link`.

### Privacy page design
- Warm white background, max-width container, centered
- `h1` "Privacy Policy" in serif font
- Each policy statement as a clean paragraph or bullet point
- Last updated date at bottom
- Simple back-to-home link at top

### Result
- Apple gets a linkable URL: `/privacy`
- Landing page no longer has the outdated "Starting with books" section
- Footer Privacy link works

