# Stream platform (working name)

An independent streaming-aggregation alpha built with React, TypeScript, Vite and Supabase; deployed to Vercel. No final brand or token has been selected.

## Run

```sh
npm ci
cp .env.example .env.local
# Add Supabase URL and publishable key
npm run dev
```

`npm run build` checks TypeScript and builds production assets. `npm test` tests player URL construction and the iframe message trust boundary.

## Included

- Responsive curated catalog, title/genre search and movie/TV filters.
- Title detail and player dialogs; VidLink, VidFast and Vidy adapters.
- TV season/episode selection (manual; not yet backed by episode metadata).
- Guest watchlist and compatible-player history persisted locally.
- Supabase magic-link sign-in and per-user cloud library with row-level security.
- Rewards information page explicitly marked not launched; no token, payout or eligibility claims.

## Infrastructure

- Production: https://stream-platform-indol.vercel.app
- Vercel project: `stream-platform`, team `dylans-projects-da633bb8`.
- Supabase project: `addsiskgqebxgntohggn`, Exotiicx402’s, Canada Central.
- Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in each Vercel environment. These are public browser configuration; never use service-role or database credentials here.
- Auth Site URL and redirect allowlist are configured for the production origin. For local sign-in, separately allow `http://127.0.0.1:5173`.
- Database migration lives in `supabase/migrations`. Remote schema has been applied; do not apply the same migration again under a new timestamp.

## Product boundaries and next work

This is an alpha with eight curated starter titles, not a live or complete catalog. Next: TMDB API search/discovery with server-side credentials, complete season metadata, provider monitoring and better playback error reporting, followed by the selected rewards design. Artwork and title identifiers reference TMDB; the application is not endorsed by TMDB.

Providers run their own remote players and may display advertisements, require interactions or be unavailable. Video does not transit Vercel or Supabase. These providers reject restrictive iframe sandboxing; integration uses ordinary cross-origin iframes. Never give embedded content access to Supabase credentials beyond the already-public key, wallets or account information. Player progress messages are accepted only from the selected iframe and provider origin and are untrusted viewing convenience data, never proof for token rewards.

Library sync is a debounced, last-write-wins document per account; simultaneous edits on multiple devices can overwrite each other. Guest activity stays separate from signed-in data. When cloud reads fail, the client keeps local changes and does not overwrite the remote library. Rewards need a separate server-controlled ledger and anti-abuse design before any funds are involved.

## Verification

- Production build and provider tests.
- Database owner read/update, cross-user isolation and ownership reassignment tested in a rolled-back transaction.
- Supabase security advisor: no findings at initial setup.
- Browser tests: guest save/reload, filters/search, detail dialogs and provider selection. VidLink loaded Breaking Bad S1 E1 with a 58:20 duration and accepted playback.
- Email delivery/login requires an end-to-end test with a real user. The built-in Supabase email service is still enabled; configure custom SMTP before opening public account registration.
