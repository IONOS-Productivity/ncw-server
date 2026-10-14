# IONOS theme a11y checks (axe-core + Playwright), proof of concept

Same approach as the a11y workshop (`@axe-core/playwright`), applied to the IONOS theming customisation
(`apps/theming/css/ionos/*`, `apps/theming/lib/Themes/IonosTheme.php`).

## What it tests
| Project | Spec | Needs login | What |
|---|---|---|---|
| `theme-tokens` | `specs/theme-tokens.spec.ts` | no | Colour contrast (WCAG 1.4.3) of ~54 text/background token pairs, light + dark, rendered from the theme CSS as the server generates it |
| `pages` | `specs/pages.spec.ts` | yes | Login, Files, settings, admin settings + Files "New" menu and row actions menu (resting and hovered), light + dark |

## Run locally
```bash
# 1. a running Nextcloud with the IONOS theme enforced
php occ config:system:set enforce_theme --value=ionos
# (dev server reachable at BASE_URL, default http://localhost:8080)

# 2. once
cd a11y && npm ci && npx playwright install chromium

# 3. run
npm test                  # everything
npm run test:tokens       # contrast of theme tokens only (no login)
A11Y_REPORT_ONLY=1 npm test   # never fail, only report
npm run report            # open the HTML report
npm run summary           # a11y-results/SUMMARY.md
```
Env: `BASE_URL`, `A11Y_USER` / `A11Y_PASSWORD` (default `admin` / `admin123`), `A11Y_REPORT_ONLY=1`, `A11Y_LABEL`,
`A11Y_PATH_PREFIX`, `A11Y_SCOPE`.

### Scope of the page scans
`A11Y_SCOPE=theme` (default) checks only what a theme/CSS customisation can break: `color-contrast` and
`link-in-text-block`. Missing labels, ARIA misuse, `lang` etc. come from markup the IONOS theme does not change,
and today they are upstream Nextcloud findings (e.g. the hidden upload `<input>` in Files has no label).
`A11Y_SCOPE=full` runs all WCAG 2.0/2.1 A+AA rules; combine it with the baseline diff below.
The Files interaction tests use language-independent selectors, so they also work in a German UI.

### Watch the browser
```bash
npx playwright test --project=pages --headed   # visible Chromium
npx playwright test --project=pages --ui       # interactive UI with timeline
```

### Instance without pretty URLs (`/index.php/login` works, `/login` is 404)
Detected automatically (`helpers/instance.ts`); `A11Y_PATH_PREFIX=/index.php` forces it, `A11Y_PATH_PREFIX=` forces none.

### Login for the `pages` tests
`specs/auth.setup.ts` logs in once with `A11Y_USER` / `A11Y_PASSWORD` and stores the session in `.auth/` (git-ignored).
Use a local account with admin rights and without 2FA/SSO. Wrong credentials and untrusted domains fail fast with a clear message.

## Gotchas
- **Theme CSS is cached.** After editing `apps/theming/css/ionos/*` or `IonosTheme.php` run
  `php occ maintenance:theme:update`, otherwise the tests scan stale CSS.
- The token test fails if a token is undefined, so a missing variable can never pass silently.
- Disabled states are not tested (exempt under WCAG 1.4.3).

## Separate upstream issues from ours
```bash
php occ config:system:set enforce_theme --value=default
A11Y_LABEL=default A11Y_REPORT_ONLY=1 npm run test:pages
php occ config:system:set enforce_theme --value=ionos
A11Y_LABEL=ionos A11Y_REPORT_ONLY=1 npm run test:pages
npm run summary     # lists findings that exist only with the IONOS theme
```

## Reports
`playwright-report/` (HTML), `a11y-results/findings-<label>.jsonl` and `SUMMARY.md`.
In CI both are uploaded as the `a11y-report` artifact (see `.github/workflows/a11y.yml`, report-only for now).
