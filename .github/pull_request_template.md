## What changed

<!-- Short summary of the problem and solution -->

## Screenshots

<!-- Required for UI changes: before / after (web + mobile if relevant) -->

| Before | After |
| --- | --- |
| <!-- drag image or paste --> | <!-- drag image or paste --> |

## Testing notes

- [ ] `npm test` (lint + `check:tokens`)
- [ ] `cd backend && npm run dev` — API healthy
- [ ] Expo web: `npm run web` — smoke-tested flows:
  - [ ] Browse / search
  - [ ] Auth (login / register) if touched
  - [ ] Cart / checkout if touched
  - [ ] Account / admin if touched

<!-- List specific routes, devices, or edge cases -->

## Breaking changes

<!-- None, or describe API/env/nav changes and migration steps -->

## Migration tracker

<!-- Check when this PR advances UI or token migration -->

- [ ] Uses `@/components/ui` primitives (not new `Premium*` imports)
- [ ] Styles use `useTheme()` tokens (`c`, `S`, `R`, `SH`, `T`) where touched
- [ ] Updated `docs/ui-migration.md` checklist for affected screens
- [ ] No new secrets committed; `.env.example` updated if env vars added
