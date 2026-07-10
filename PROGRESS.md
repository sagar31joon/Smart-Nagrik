# Smart Nagrik — Progress Log

Civic issue-reporting platform for Indian cities (launched with Gurugram, Haryana). Citizens anonymously report potholes, garbage dumps, and waterlogging on a live map; an admin panel lets municipal staff triage and resolve them; every issue is tied to a ward's accountability chain (Municipal Corp → Commissioner → Additional Commissioner → JHI) plus the local MLA/councillor.

## Architecture

Two independent React + Vite SPAs, both talking directly to one Supabase project (Postgres + Auth + Storage + Realtime), no custom backend server.

- **[webapp/](webapp/)** — public citizen-facing app. Map (MapLibre GL), report submission flow, reports feed, wards dashboard.
- **[admin/](admin/)** — internal staff app, gated by Supabase Auth email/password login. Manage cities, wards, accountability chains, and issue status/moderation.
- **[supabase/](supabase/)** — SQL migrations, RLS policies, and seed data, applied manually via the Supabase SQL editor (no migration tool/CLI in use yet).

Data model: `cities` → `wards` → `issues` (+ `upvotes`, keyed by anonymous per-device token) → `accountability_chain` (per-ward, per-role). Schema is multi-city-ready (`cities.is_active`, `boundary_geojson`) but only Gurugram (35 real wards, seeded councillor/MLA names) is active today.

## History

**2026-05-19 — `6c4db3c` first commit**
Repo initialized with just a placeholder README.

**2026-05-19 — `55a8e75` Organize into webapp and admin folders, integrate multi-city Supabase**
The real build lands in one commit (~6,000 lines): webapp scaffolded with the map, report modal, reports feed, and wards dashboard; full Supabase schema (`migration.sql`, `seed.sql`, `add_city_template.sql`) written with cities/wards/issues/upvotes/accountability_chain, RLS for anonymous read+insert, a storage bucket for issue photos, an upvote-counting trigger, and realtime enabled on `issues`/`upvotes`.

**2026-05-20 — `673f203` feat: complete Smart Nagrik Admin Panel**
Admin app added (~3,900 lines): login, dashboard stats, Cities page (with automatic boundary/geocoding lookup via Nominatim), Wards page (CRUD + accountability chain editor), Issues page (filter, bulk status change, bulk delete, detail modal with photo lightbox), retractable sidebar nav. `admin_rls.sql` added to grant the `authenticated` role write access.

**2026-05-20 — `34000de` fix: resolve Reports tab white screen and add Vercel project configuration**
Bug fix in `webapp/src/lib/supabase.js` (Reports tab was crashing) plus `.vercel/` project configs and `.gitignore` entries added for both apps — first sign of deploy-target setup.

## Current state (as of 2026-07-09 analysis)

- Fully functional MVP for a single city (Gurugram): map + report + moderate loop works end-to-end.
- No committed secrets — `.env` files are gitignored and were never committed in any commit (verified via `git log --all -- .env` across all path variants).
- `admin/.env` does not exist on disk; the admin app must be relying on Vercel-injected environment variables in deployment, or is currently unrunnable locally without one being created manually.
- Multi-city schema exists but is not wired up in the UI — `DEFAULT_CITY_SLUG` is hardcoded to `'gurugram'` in `webapp/src/lib/supabase.js`.
- Several UI affordances are visual-only / not wired to logic yet (see PRIORITIES.md): map-sidebar upvote button, Share buttons, "File an official complaint", "Share on X".
- Newly submitted issues are never assigned a `ward_id` (`submitIssue` always passes `wardId: null`), so ward-level stats and the accountability sidebar don't reflect issues reported after the original seed data.
- `admin_rls.sql` grants full CRUD to *any* Supabase `authenticated` user, not a specifically-flagged admin role — the admin login screen is a UI gate, not a database-level one.
