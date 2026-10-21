# IONOS theme a11y checks (axe-core + Playwright), proof of concept

Same approach as the a11y workshop (`@axe-core/playwright`), applied to the IONOS theming customisation
(`apps/theming/css/ionos/*`, `apps/theming/lib/Themes/IonosTheme.php`).

## Quick start (including the Talk app)

You need a running Nextcloud with the IONOS theme (`php occ config:system:set enforce_theme --value=ionos`,
then `php occ maintenance:theme:update`), reachable at `http://localhost:8080` unless you set `BASE_URL`.

**1. Install, once**
```bash
cd a11y
npm ci
npx playwright install chromium
```

**2. Set what the tests need, once per terminal**
```bash
export A11Y_USER='<your user>'          # account the page tests log in with (see the nc-d-n-t repo)
export A11Y_PASSWORD='<your password>'   # never commit this
export A11Y_TALK_TOKEN='zzn6eq6u'        # Talk conversation ID, see below (optional)
# export BASE_URL=http://localhost:8080  # only if your instance is elsewhere (this is the default)
```

**3. Run**

| I want to run... | Command |
|---|---|
| everything, including Talk | `npm test` |
| only the colour tokens (no login, fast) | `npm run test:tokens` |
| only the real pages (incl. Talk if `A11Y_TALK_TOKEN` is set) | `npm run test:pages` |
| only the Talk conversation | `npm run test:pages -- -g talk` |
| without exporting, in one line | `A11Y_TALK_TOKEN=zzn6eq6u npm run test:pages -- -g talk` |
| report findings but never fail | `A11Y_REPORT_ONLY=1 npm test` |
| watch the browser | `npm run test:pages -- --headed` (or `--ui` for an interactive view) |
| open the HTML report | `npm run report` |
| findings as a table | `npm run summary` (writes `a11y-results/SUMMARY.md`) |

**What a Talk test result means**

| You see | Meaning |
|---|---|
| passed | the conversation was opened and its contrast checks are green, in light and dark mode |
| **skipped** (`-`) | `A11Y_TALK_TOKEN` is not set. Nothing was checked. |
| failed with contrast findings | a real finding, the report shows the elements and ratios |
| `Talk rendered no messages ... The conversation does not exist` | wrong ID, or the account in `A11Y_USER` is not a participant of that conversation |
| `... Duplicate session` | the conversation is open in another tab that uses the same login session: close it |

### Find your Talk conversation ID
The ID (Talk calls it a "token") is the last part of the conversation's address. It is **not** a password or a login
token and it is not a secret; it only tells the test which conversation to open. Open the conversation in Talk and
look at the address bar:

```
http://localhost:8080/index.php/call/zzn6eq6u
                                     ^^^^^^^^ this is the ID
```

Use a conversation where:
- the account from `A11Y_USER` is a participant,
- there are messages from that account **and** from another one (own messages are styled differently),
- ideally there is also a quote, a mention (`@name`) and a link, because those are the parts that went wrong before.

## What it tests
| Project | Spec | Needs login | What |
|---|---|---|---|
| `theme-tokens` | `specs/theme-tokens.spec.ts` | no | Colour contrast (WCAG 1.4.3) of 55 text/background token pairs (110 tests), light + dark, rendered from the theme CSS as the server generates it |
| `pages` | `specs/pages.spec.ts` | yes | Login, Files, personal settings, admin settings, the Files "New" menu and row actions menu (resting and hovered), and one Talk conversation (only with `A11Y_TALK_TOKEN`), each in light + dark |

## Environment variables
| Variable | Default | Meaning |
|---|---|---|
| `BASE_URL` | `http://localhost:8080` | address of the Nextcloud instance |
| `A11Y_USER` / `A11Y_PASSWORD` | see the nc-d-n-t repo | login for the page tests; admin rights are needed for the admin settings page, which is skipped otherwise |
| `A11Y_TALK_TOKEN` | none | Talk conversation ID; without it the Talk tests are skipped |
| `A11Y_SCOPE` | `theme` | `theme` or `full`, see below |
| `A11Y_REPORT_ONLY` | off | `1` = never fail the run, only report |
| `A11Y_LABEL` | `ionos` | name of the run, used to compare two runs |
| `A11Y_PATH_PREFIX` | auto | `/index.php` for instances without pretty URLs |

### Scope of the page scans
`A11Y_SCOPE=theme` (default) checks only what a theme/CSS customisation can break: `color-contrast` and
`link-in-text-block`. Missing labels, ARIA misuse, `lang` etc. come from markup the IONOS theme does not change,
and today they are upstream Nextcloud findings (e.g. the hidden upload `<input>` in Files has no label).
`A11Y_SCOPE=full` runs all WCAG 2.0/2.1 A+AA rules; combine it with the baseline diff below.
The Files interaction tests use language-independent selectors, so they also work in a German UI.

### Talk conversation (what the test checks)
The Talk test opens `/call/<A11Y_TALK_TOKEN>` and checks: axe on the whole page, axe with an own message hovered, and a
contrast check of mention chips (`expectReadable`): axe reports them as "incomplete" (partly covered by their avatar),
so a green axe result says nothing about them. The tests for light and dark mode run one after the other: Talk shows a
conversation only once per login session ("Duplicate session").

Background of the dark-mode bug it found: Talk draws own messages on `--color-primary-light`, which stays light in dark
mode, but colours their text with `--color-text-light` (and links with `--color-main-text`), which turn light (1.1:1).
`apps/theming/css/ionos/talk.css` keeps the light bubble and uses dark text on it in dark mode; chips keep their own colours.
The same file also covers the selected participants in the "new conversation" dialog; that dialog is **not** part of
the automated tests, check it by hand in dark mode.

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
