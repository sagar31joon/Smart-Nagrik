# Smart Nagrik — Priority List

My ranking below, including a direct response to the two concerns you raised.

## On your two concerns first

**"Anon key exposure"** — checked this specifically: `.env` is gitignored in both apps and was never committed in any commit (`git log --all -- .env` is empty across the whole history). The `VITE_SUPABASE_*` keys are also, by design, meant to end up in the shipped JS bundle — that's how every Supabase frontend works. The anon key on its own is not a secret; it's a public identifier that Row Level Security policies constrain. **So there's no key-exposure bug to fix.** What *is* worth fixing is the RLS policy content itself (see P0 below) — that's where the real exposure risk lives, not the key.

**"Aligning backend better"** — agreed, and I found the concrete gap: `supabase/admin_rls.sql` grants full INSERT/UPDATE/DELETE on `cities`, `wards`, `issues`, and `accountability_chain` to *any* Supabase `authenticated` user — there's no role/claim check (e.g. an `is_admin` column or custom JWT claim). The admin login screen is a UI gate, not a database one. If your Supabase project's auth settings allow public sign-up (the default), anyone could register an account directly against the Supabase Auth API (bypassing the admin UI entirely, which has no sign-up form) and get full write/delete access to every city's data. This is P0.

## P0 — Do before any wider rollout

1. **Lock down admin RLS to real admins, not just "authenticated."**
   Add an `admins` table (or a `role` claim in `auth.users` / a `profiles` table) and rewrite `admin_rls.sql` policies to check membership instead of `USING (true)`. Minimal version: `USING (auth.uid() IN (SELECT user_id FROM admins))`.
2. **Confirm Supabase project auth settings disable public sign-up**, or restrict it (email allowlist/domain) — this can't be checked from the repo, only the Supabase dashboard. Do this even after #1, as defense in depth.
3. **Fix ward auto-assignment.** `submitIssue()` always sends `wardId: null` (`webapp/src/ReportModal.jsx`). Add a point-in-polygon lookup against the `wards` boundaries (or nearest-ward-by-centroid as a first pass) so new reports actually populate ward stats and the accountability sidebar — this is core to the product's value proposition and is currently silently broken for all non-seed data.

## P1 — Should do soon

4. **Rate-limit / cache Nominatim calls**, or move them server-side. Two different client-side call sites (`webapp/src/ReportModal.jsx` reverse-geocode, `admin/src/pages/Cities.jsx` forward-geocode) hit OSM's public API directly from the browser; only the admin one sets a `User-Agent`. Risk of IP-based throttling/blocking under any real traffic, and it violates OSM's usage policy expectations for production traffic.
5. **Wire up or remove dead UI**: map-sidebar "I've seen this" upvote button (has a `TODO: upvote` and does nothing), "Share" icon button, "File an official complaint" button, "Share on X" button in the report-confirmation step. Half-working affordances erode trust in a civic-accountability product faster than most.
6. **Decide the admin env story.** `admin/.env` doesn't exist locally, unlike `webapp/.env`. Either document that Vercel env vars are the only supported path, or add an `.env.example` for both apps so local dev is reproducible.

## P2 — Worth doing, not urgent

7. **Multi-city activation.** Schema already supports it (`cities.is_active`, boundary storage, `add_city_template.sql`); wire up a city selector in the webapp instead of the hardcoded `DEFAULT_CITY_SLUG`.
8. **Add a migration tool** (Supabase CLI migrations, or at least numbered/dated SQL files with a changelog) instead of hand-run one-shot `migration.sql`/`admin_rls.sql` scripts — the current "drop everything and recreate" pattern in `migration.sql` is unsafe to ever re-run against a live database with real data.
9. **Basic test coverage / CI.** There's currently no test suite and no CI config in either app.
10. **Clean up stray root-level `dist/`** — appears to be a stale local build artifact sitting alongside `webapp/dist` and `admin/dist`; not tracked in git, just clutter.

Want me to start on P0 #1 (rewriting the RLS policies with a real admin check) or #3 (ward auto-assignment) first?
