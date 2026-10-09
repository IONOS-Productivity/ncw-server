# IONOS theme a11y checks (axe-core + Playwright), proof of concept

Same approach as the a11y workshop (`@axe-core/playwright`), applied to the IONOS theming customisation
(`apps/theming/css/ionos/*`, `apps/theming/lib/Themes/IonosTheme.php`).

## What it tests
| Project | Spec | Needs login | What |
|---|---|---|---|
| `theme-tokens` | `specs/theme-tokens.spec.ts` | no | Colour contrast (WCAG 1.4.3) of ~54 text/background token pairs, light + dark, rendered from the theme CSS as the server generates it |
| `pages` | `specs/pages.spec.ts` | yes | Login, Files, settings, admin overview + Files menus/sidebar, light + dark |

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
Env: `BASE_URL`, `A11Y_USER` / `A11Y_PASSWORD` (default `admin` / `admin123`), `A11Y_REPORT_ONLY=1`, `A11Y_LABEL`.

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
