# Liftlog

A clean, simple workout tracker for your phone's browser. Dark and light themes, installable to your home screen, and it works offline.

## Features

- **Start Workout** – start an empty workout or one from a template. Example templates (Push, Pull, Legs, Full Body, Upper, Lower) can be copied into My Templates.
- **Workout logging** – Set / Previous / weight / reps / ✓ rows, a built-in number keypad, grey placeholders from last time (tick an empty set to log them), warm-up / drop / failure sets (tap the set number), auto warm-ups, swipe left to delete a set.
- **Rest timers** – per-set rest bars that count down after you tick a set, tap to change, Pause / ±15s / Reset / Skip panel, sound + vibration when rest ends.
- **Supersets** – link an exercise with the next one; the rest timer only starts after the last exercise in the superset.
- **Minimise** – drag the workout down to a bar and keep using the app.
- **Finish** – complete or discard unfinished sets, a summary screen with PRs, and an offer to update the template you started from.
- **History** – workouts by month, calendar view, edit / save as template / delete.
- **Exercises** – ~115 built-in exercises with muscle icons, custom exercises, search, body part / category filters, sort, A–Z index, and per-exercise history, charts and records.
- **Profile** – name and photo, dashboard widgets (workouts per week with a goal line, weekly volume, exercise 1RM / best set / volume, body weight, body fat), body measurements.
- **Settings** – kg / lbs, km / miles, default rest timer, theme (system / dark / light), reset all data.

All data is stored on your device (IndexedDB). It's structured so cloud sync can be added later.

## Development

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests
npm run build    # production build in dist/
```

## Deploying

| Site | Updates when | Workflow |
| --- | --- | --- |
| GitHub Pages (preview) | every push to `main` | `.github/workflows/pages.yml` |
| Netlify (main site) | a `v*` tag is pushed, e.g. `v1.0.0` | `.github/workflows/netlify-release.yml` |

To release: bump `version` in `package.json`, merge to `main`, then `git tag v1.2.3 && git push origin v1.2.3`.

One-time setup in the GitHub repo settings:

- **Settings → Pages → Source:** GitHub Actions.
- **Settings → Secrets and variables → Actions:** a `NETLIFY_AUTH_TOKEN` secret (a Netlify personal access token) and a `NETLIFY_SITE_ID` variable.

See [SPEC.md](SPEC.md) for the full product spec.
