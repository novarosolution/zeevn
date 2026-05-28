# ADR 0001: Hide social sign-in until OAuth is implemented

**Status:** Accepted  
**Date:** 2026-05-18  
**Deciders:** Product / engineering  

## Context

Login and Register showed **Continue with Google** and **Continue with Apple** buttons wired to no-op handlers (`noopOAuth`). Tapping them did nothing—a serious trust and accessibility failure. Users reasonably expect social buttons to complete sign-in.

Backend routes for `/users/oauth/google` and `/users/oauth/apple` are not implemented. Shipping OAuth properly requires:

- **Google:** `@react-native-google-signin/google-signin` (native), Google Identity Services (web), server token exchange.
- **Apple:** `expo-apple-authentication` on iOS (App Store guideline 4.8 when other third-party sign-in exists), plus a web/Android strategy.
- **Backend:** OAuth endpoints, user linking, JWT issuance, and E2E tests.

## Decision

**Option A — hide social sign-in entirely (chosen).**

- Remove Google/Apple buttons and “or continue with” dividers from `LoginScreen`, `RegisterScreen`, and `AuthShell`.
- Do not show a “coming soon” line on auth screens (keeps the form focused on email/password).
- Default `AuthPageScaffold` `showOAuthRow` to `false` and remove dead OAuth UI from that legacy scaffold.
- Document this ADR and revisit when OAuth is ready to ship end-to-end.

## Consequences

**Positive**

- No misleading affordances; email/password is the only visible sign-in path.
- Simpler auth UI and less maintenance until OAuth is real.

**Negative**

- Users who expect Google/Apple must use email registration until Option B ships.
- Copy keys for social CTAs remain in `appContent.js` for a future OAuth launch.

## Alternatives considered

**Option B — wire OAuth now**

Rejected for this release: non-trivial native/web split, backend work, secrets, and QA. When pursued, re-enable UI and set `showOAuthRow` / shell props only after `/users/oauth/*` round-trips succeed.

## Follow-up (when implementing OAuth)

1. Add backend `POST /users/oauth/google` and `POST /users/oauth/apple` (id token → user + JWT).
2. Restore social row behind a feature flag (e.g. `EXPO_PUBLIC_OAUTH_ENABLED`).
3. Remove `oauthUnavailableHint` copy or repurpose for real error states.
4. Update this ADR to **Superseded** with a link to ADR 0002.
